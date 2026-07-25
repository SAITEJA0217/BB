import os
import tempfile
from fastapi.testclient import TestClient

def test_upload_pdf(client: TestClient, generate_test_pdf):
    pdf_path = generate_test_pdf("upload_test.pdf", "Important Study Material")
    
    with open(pdf_path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("upload_test.pdf", f, "application/pdf")})
        
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "upload_test_pdf" # Validating sanitization ('.' replaced with '_')
    assert data["total_pages"] == 1
    
    # Clean up
    os.remove(pdf_path)

def test_duplicate_upload(client: TestClient, generate_test_pdf):
    pdf_path = generate_test_pdf("duplicate_test.pdf", "Duplicate Content")
    
    with open(pdf_path, "rb") as f:
        client.post("/api/upload", files={"file": ("duplicate_test.pdf", f, "application/pdf")})
        
    # Upload exact same file again
    with open(pdf_path, "rb") as f:
        response2 = client.post("/api/upload", files={"file": ("duplicate_test.pdf", f, "application/pdf")})
        
    assert response2.status_code == 409
    assert "Duplicate file detected" in response2.json()["detail"]
    
    os.remove(pdf_path)

def test_upload_non_pdf(client: TestClient):
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(b"Not a PDF")
        tmp_path = tmp.name
        
    with open(tmp_path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("test.txt", f, "text/plain")})
        
    assert response.status_code == 400
    assert "Only PDF files are allowed" in response.json()["detail"]
    os.remove(tmp_path)
