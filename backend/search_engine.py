from rank_bm25 import BM25Okapi
import nltk
from nltk.tokenize import word_tokenize
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Document
from spell_corrector import correct_spelling
from query_expander import expand_query
import re
from logger import get_logger

logger = get_logger(__name__)

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

_bm25 = None
_document_ids = []
search_cache = {}

def tokenize(text: str):
    if not text:
        return []
    import string
    return [word.strip(string.punctuation).lower() for word in text.split() if word.strip(string.punctuation)]

def build_index(db: Session):
    global _bm25, _document_ids, search_cache
    search_cache.clear()
    logger.info("Building BM25 Index...")
    docs = db.query(Document).all()
    
    tokenized_corpus = []
    _document_ids = []
    
    for doc in docs:
        tokenized_corpus.append(tokenize(doc.content))
        _document_ids.append(doc.id)
        
    if tokenized_corpus:
        _bm25 = BM25Okapi(tokenized_corpus)
    else:
        _bm25 = None
    logger.info(f"BM25 Index built successfully with {len(docs)} documents.")

def parse_boolean_query(query: str, doc_content: str) -> bool:
    """Very basic boolean logic handler for AND, OR, NOT"""
    content_lower = doc_content.lower()
    
    # Handle NOT
    if " NOT " in query:
        parts = query.split(" NOT ")
        must_have = parts[0].lower().strip()
        must_not_have = parts[1].lower().strip()
        if must_have and must_have not in content_lower: return False
        if must_not_have and must_not_have in content_lower: return False
        return True
        
    # Handle AND
    if " AND " in query:
        parts = query.split(" AND ")
        for part in parts:
            if part.lower().strip() not in content_lower:
                return False
        return True
        
    # Handle OR
    if " OR " in query:
        parts = query.split(" OR ")
        for part in parts:
            if part.lower().strip() in content_lower:
                return True
        return False
        
    return True

def search(query: str, db: Session, filters: dict = None, top_k: int = 10):
    global _bm25, _document_ids
    
    if _bm25 is None:
        build_index(db)
        
    if _bm25 is None or not _document_ids:
        return []

    cache_key = f"{query}_{str(filters)}_{top_k}"
    if cache_key in search_cache:
        logger.info(f"Cache hit for query: {query}")
        return search_cache[cache_key]

    logger.info(f"Executing search for query: {query}")
        
    # Pre-processing pipeline
    corrected_query = correct_spelling(query, db)
    expanded_query = expand_query(corrected_query)
    
    is_boolean = " AND " in query or " OR " in query or " NOT " in query
    
    # If boolean, we might want to prioritize boolean parsing over standard BM25,
    # but for simplicity we'll use BM25 to get candidates, then filter.
    search_query = query if is_boolean else expanded_query
    
    tokenized_query = tokenize(search_query)
    doc_scores = _bm25.get_scores(tokenized_query)
    
    # Normalizing scores roughly to percentage
    max_score = max(doc_scores) if doc_scores.any() else 0
    
    top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)
    
    results = []
    seen_content = set()
    
    for idx in top_indices:
        score = doc_scores[idx]
        if score <= 0:
            continue
            
        doc_id = _document_ids[idx]
        
        # Apply filters
        q = db.query(Document).filter(Document.id == doc_id)
        if filters:
            if filters.get("pdf_name") and filters["pdf_name"] != "All":
                q = q.filter(Document.pdf_name == filters["pdf_name"])
            if filters.get("chapter"):
                q = q.filter(Document.chapter == filters["chapter"])
            if filters.get("unit"):
                q = q.filter(Document.unit == filters["unit"])
                
        doc = q.first()
        if not doc:
            continue
            
        # Apply boolean logic if applicable
        if is_boolean and not parse_boolean_query(query, doc.content):
            continue
            
        # Deduplication
        content_hash = hash(doc.content)
        if content_hash in seen_content:
            continue
        seen_content.add(content_hash)
        
        match_score = int((score / max_score) * 100) if max_score > 0 else 0
        
        results.append({
            "id": doc.id,
            "pdf_name": doc.pdf_name,
            "page_number": doc.page_number,
            "chapter": doc.chapter,
            "unit": doc.unit,
            "heading": doc.heading,
            "paragraph_number": doc.paragraph_number,
            "content": doc.content,
            "match_score": match_score
        })
                
    final_results = results[:top_k]
    
    # Store in cache
    if len(search_cache) > 100:
        search_cache.pop(next(iter(search_cache)))
    search_cache[cache_key] = final_results
            
    return final_results
