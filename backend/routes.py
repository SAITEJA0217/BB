import os
import shutil
import time
import zipfile
import re
import httpx
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Upload, Document, Bookmark, SearchHistory
from pdf_processor import process_pdf
from search_engine import search, build_index
from spell_corrector import build_vocabulary, _vocabulary
from logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        logger.warning(f"Invalid upload attempt (not a PDF): {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
    # Sanitize filename
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename)
    
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Check upload size limit (FastAPI reads stream, we'll check while saving or via dependency)
    MAX_SIZE = 50 * 1024 * 1024 # 50MB
    file_size = 0
    
    try:
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(8192):
                file_size += len(chunk)
                if file_size > MAX_SIZE:
                    raise HTTPException(status_code=413, detail="File too large (Limit 50MB)")
                buffer.write(chunk)
            
        logger.info(f"File saved: {safe_filename} ({file_size} bytes)")
        result = process_pdf(file_path, safe_filename, db)
        if "error" in result:
            os.remove(file_path) # cleanup duplicate
            raise HTTPException(status_code=409, detail=result["error"])
            
        upload = result["upload"]
        return {"filename": upload.filename, "status": "Successfully uploaded and indexed", "total_pages": upload.pages}
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Upload).order_by(Upload.upload_date.desc()).all()
    result = []
    for d in docs:
        paras = db.query(Document).filter(Document.pdf_name == d.filename).count()
        result.append({
            "id": d.id,
            "filename": d.filename,
            "pages": d.pages,
            "paragraphs": paras,
            "file_size": d.file_size,
            "upload_date": d.upload_date
        })
    return {"documents": result}

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == doc_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.query(Document).filter(Document.pdf_name == upload.filename).delete()
    db.delete(upload)
    db.commit()
    
    file_path = os.path.join(UPLOAD_DIR, upload.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    build_index(db)
    build_vocabulary(db)
    
    return {"status": "success"}

@router.post("/search")
def search_documents(
    query: dict = Body(...), 
    db: Session = Depends(get_db)
):
    q_str = query.get("q", "")
    if not q_str:
        return {"results": [], "time_ms": 0}
        
    # Save search history
    history = SearchHistory(query=q_str)
    db.add(history)
    db.commit()
        
    start_time = time.time()
    filters = query.get("filters", {})
    results = search(q_str, db, filters=filters, top_k=20)
    end_time = time.time()
    
    return {
        "results": results,
        "time_ms": int((end_time - start_time) * 1000)
    }

@router.post("/chat")
async def chat_with_document(
    query: dict = Body(...), 
    db: Session = Depends(get_db)
):
    q_str = query.get("q", "")
    if not q_str:
        return {"explanation": "", "sources": [], "time_ms": 0}
        
    # Save search history
    history = SearchHistory(query=q_str)
    db.add(history)
    db.commit()
        
    start_time = time.time()
    filters = query.get("filters", {})
    
    # 1. Retrieve top context
    sources = search(q_str, db, filters=filters, top_k=4)
    
    # 2. Construct Prompt
    context_text = "\n\n".join([f"--- Excerpt {i+1} ---\n{s['content']}" for i, s in enumerate(sources)])
    
    prompt = f"""You are StudyMate, a helpful, intelligent offline tutor. 
Using ONLY the following excerpts from the user's uploaded documents, answer the user's question clearly and simply. If the answer is not in the excerpts, say "I couldn't find the exact answer in your documents, but based on my general knowledge..."

Excerpts:
{context_text}

User Question: {q_str}
"""

    explanation = ""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "phi3",
                    "prompt": prompt,
                    "stream": False
                }
            )
            if response.status_code == 200:
                explanation = response.json().get("response", "")
            else:
                explanation = f"Error from AI model: {response.text}"
    except Exception as e:
        explanation = "Could not connect to the local AI. Please ensure Ollama is installed and running (`ollama run phi3`)."
        logger.error(f"Ollama connection error: {e}")

    end_time = time.time()
    
    return {
        "explanation": explanation,
        "sources": sources,
        "time_ms": int((end_time - start_time) * 1000)
    }

@router.get("/autocomplete")
def autocomplete(q: str = Query(...)):
    query = q.lower().strip()
    if not query:
        return {"suggestions": []}
        
    suggestions = [w for w in _vocabulary if w.startswith(query)][:5]
    return {"suggestions": suggestions}

@router.post("/rebuild_index")
def rebuild(db: Session = Depends(get_db)):
    build_index(db)
    build_vocabulary(db)
    return {"status": "success"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_pdfs = db.query(Upload).count()
    total_pages = db.query(Upload.pages).all()
    total_pages = sum([p[0] for p in total_pages]) if total_pages else 0
    total_paras = db.query(Document).count()
    total_bookmarks = db.query(Bookmark).count()
    
    # Rough DB size
    db_path = "database.db"
    db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
    
    return {
        "total_pdfs": total_pdfs,
        "total_pages": total_pages,
        "total_paragraphs": total_paras,
        "total_bookmarks": total_bookmarks,
        "database_size_bytes": db_size
    }

# Bookmarks API
@router.post("/bookmarks")
def add_bookmark(b: dict = Body(...), db: Session = Depends(get_db)):
    bookmark = Bookmark(
        pdf_name=b.get("pdf_name"),
        page_number=b.get("page_number"),
        heading=b.get("heading"),
        content=b.get("content")
    )
    db.add(bookmark)
    db.commit()
    return {"status": "success"}

@router.get("/bookmarks")
def get_bookmarks(db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).order_by(Bookmark.date_saved.desc()).all()
    return {"bookmarks": bookmarks}

@router.delete("/bookmarks/{b_id}")
def delete_bookmark(b_id: int, db: Session = Depends(get_db)):
    db.query(Bookmark).filter(Bookmark.id == b_id).delete()
    db.commit()
    return {"status": "success"}

# Search History API
@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    history = db.query(SearchHistory).order_by(SearchHistory.timestamp.desc()).limit(10).all()
    return {"history": history}

@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(SearchHistory).delete()
    db.commit()
    return {"status": "success"}

# Backup API
@router.get("/backup")
def export_backup():
    backup_file = "studymate_backup.zip"
    try:
        with zipfile.ZipFile(backup_file, 'w') as zipf:
            if os.path.exists("database.db"):
                zipf.write("database.db")
            if os.path.exists(UPLOAD_DIR):
                for root, _, files in os.walk(UPLOAD_DIR):
                    for f in files:
                        zipf.write(os.path.join(root, f))
        logger.info("Backup created successfully")
        return FileResponse(backup_file, filename="studymate_backup.zip", media_type="application/zip")
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        raise HTTPException(status_code=500, detail="Backup creation failed")

@router.post("/restore")
async def import_backup(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed for restore")
        
    restore_file = "temp_restore.zip"
    try:
        with open(restore_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with zipfile.ZipFile(restore_file, 'r') as zipf:
            zipf.extractall(".")
            
        logger.info("Restore successful. Rebuilding index...")
        build_index(db)
        build_vocabulary(db)
        
        os.remove(restore_file)
        return {"status": "Restore successful"}
    except Exception as e:
        logger.error(f"Restore failed: {e}")
        raise HTTPException(status_code=500, detail="Restore failed")
