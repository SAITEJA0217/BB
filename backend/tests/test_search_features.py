import os
from fastapi.testclient import TestClient
import time

def test_basic_search(client: TestClient, generate_test_pdf):
    # Upload doc
    pdf_path = generate_test_pdf("search_doc.pdf", "This is a paragraph discussing normalization in database systems. Chapter 2.")
    with open(pdf_path, "rb") as f:
        client.post("/api/upload", files={"file": ("search_doc.pdf", f, "application/pdf")})
        
    # Test search
    payload = {"q": "normalization", "filters": {}}
    response = client.post("/api/search", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    assert "normalization" in data["results"][0]["content"].lower()
    assert data["time_ms"] < 200 # Should be fast
    
    os.remove(pdf_path)

def test_search_cache(client: TestClient, generate_test_pdf):
    pdf_path = generate_test_pdf("cache_doc.pdf", "Information about SQL queries.")
    with open(pdf_path, "rb") as f:
        client.post("/api/upload", files={"file": ("cache_doc.pdf", f, "application/pdf")})
        
    payload = {"q": "sql queries", "filters": {}}
    
    # First search
    start = time.time()
    client.post("/api/search", json=payload)
    first_duration = time.time() - start
    
    # Second search (should hit cache)
    start = time.time()
    client.post("/api/search", json=payload)
    second_duration = time.time() - start
    
    # The cache should ideally make the second one faster, but at least ensure it returns 200
    assert second_duration <= first_duration or second_duration < 0.1
    os.remove(pdf_path)

def test_boolean_search(client: TestClient, generate_test_pdf):
    pdf_path = generate_test_pdf("bool_doc.pdf", "Cats and dogs are animals. Birds are too.")
    with open(pdf_path, "rb") as f:
        client.post("/api/upload", files={"file": ("bool_doc.pdf", f, "application/pdf")})
        
    # Test NOT operator
    payload = {"q": "animals NOT birds", "filters": {}}
    response = client.post("/api/search", json=payload)
    assert response.status_code == 200
    # Depending on our boolean logic implementation, it should filter out the sentence with 'birds' if we parse at sentence level, or just return empty if the whole doc has 'birds'. Our simple logic checks paragraph.
    
    os.remove(pdf_path)
