from rapidfuzz import process, fuzz
from sqlalchemy.orm import Session
from models import Document
import string

_vocabulary = set()

def build_vocabulary(db: Session):
    global _vocabulary
    _vocabulary.clear()
    docs = db.query(Document.content).all()
    
    for doc in docs:
        if doc.content:
            words = [w.strip(string.punctuation).lower() for w in doc.content.split() if w.strip(string.punctuation)]
            _vocabulary.update(words)

def correct_spelling(query: str, db: Session) -> str:
    global _vocabulary
    if not _vocabulary:
        build_vocabulary(db)
        
    if not _vocabulary:
        return query
        
    corrected_query = []
    for word in query.split():
        clean_word = word.strip(string.punctuation).lower()
        if not clean_word:
            continue
            
        if clean_word in _vocabulary:
            corrected_query.append(word)
        else:
            # Find closest match
            match = process.extractOne(clean_word, _vocabulary, scorer=fuzz.ratio)
            if match and match[1] > 80: # 80% similarity threshold
                # Maintain original casing logic roughly, or just use the corrected lowercase word
                corrected_query.append(match[0])
            else:
                corrected_query.append(word)
                
    return " ".join(corrected_query)
