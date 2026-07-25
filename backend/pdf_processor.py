import fitz  # PyMuPDF
import re
import hashlib
import os
from sqlalchemy.orm import Session
from models import Document, Upload
from search_engine import build_index
from spell_corrector import build_vocabulary
from logger import get_logger

logger = get_logger(__name__)

try:
    import pytesseract
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

def get_file_hash(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def extract_metadata_heuristics(text: str):
    chapter = None
    unit = None
    heading = None
    
    chapter_match = re.search(r'(?i)(chapter\s+\d+|ch\s+\d+)', text)
    if chapter_match:
        chapter = chapter_match.group(1).title()
        
    unit_match = re.search(r'(?i)(unit\s+[IVXLCDM\d]+)', text)
    if unit_match:
        unit = unit_match.group(1).title()
        
    lines = text.split('\n')
    if lines and len(lines[0]) < 100 and lines[0].isupper():
        heading = lines[0].strip()
        
    return chapter, unit, heading

def process_pdf(file_path: str, filename: str, db: Session):
    logger.info(f"Starting processing for file: {filename}")
    
    file_hash = get_file_hash(file_path)
    file_size = os.path.getsize(file_path)
    
    # Check duplicate
    existing = db.query(Upload).filter(Upload.file_hash == file_hash).first()
    if existing:
        logger.warning(f"Duplicate file detected: {filename}")
        return {"error": "Duplicate file detected.", "upload": existing}

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        logger.error(f"Failed to open PDF {filename}: {str(e)}")
        return {"error": f"Failed to read PDF file. It might be corrupted or password protected."}
        
    total_pages = len(doc)
    logger.info(f"PDF opened successfully. Pages: {total_pages}")
    
    upload = Upload(filename=filename, pages=total_pages, file_size=file_size, file_hash=file_hash)
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    current_chapter = None
    current_unit = None
    
    # Try loading images for OCR if needed
    images = None
    
    for page_num in range(total_pages):
        try:
            page = doc[page_num]
            text = page.get_text("text").strip()
            
            # OCR Fallback if no text found
            if not text and OCR_AVAILABLE:
                try:
                    logger.info(f"Applying OCR on page {page_num} of {filename}")
                    if images is None:
                        images = convert_from_path(file_path)
                    if page_num < len(images):
                        text = pytesseract.image_to_string(images[page_num])
                except Exception as e:
                    logger.error(f"OCR failed for page {page_num}: {e}")
                    
            if not text:
                continue
                
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
            
            for idx, para in enumerate(paragraphs):
                if len(para) > 10:
                    ch, un, hd = extract_metadata_heuristics(para)
                    if ch: current_chapter = ch
                    if un: current_unit = un
                    
                    document = Document(
                        pdf_name=filename,
                        page_number=page_num + 1,
                        chapter=current_chapter,
                        unit=current_unit,
                        heading=hd,
                        paragraph_number=idx + 1,
                        content=para
                    )
                    db.add(document)
        except Exception as e:
            logger.error(f"Failed processing page {page_num} in {filename}: {e}")
            continue
            
    try:
        db.commit()
        logger.info(f"Successfully committed document data for {filename}")
    except Exception as e:
        logger.error(f"Database commit failed for {filename}: {e}")
        db.rollback()
        return {"error": "Database error during save."}
        
    doc.close()
    
    build_index(db)
    build_vocabulary(db)
    
    return {"status": "success", "upload": upload}
