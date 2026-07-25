import os
from fastapi.testclient import TestClient

def test_backup_endpoint(client: TestClient):
    response = client.get("/api/backup")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    
    # Save the streamed zip to check if it's valid
    backup_path = "test_download.zip"
    with open(backup_path, "wb") as f:
        f.write(response.content)
        
    assert os.path.exists(backup_path)
    assert os.path.getsize(backup_path) > 0
    os.remove(backup_path)

def test_restore_invalid_file(client: TestClient):
    # Try restoring a text file
    with open(__file__, "rb") as f:
        response = client.post("/api/restore", files={"file": ("fake_backup.txt", f, "text/plain")})
        
    assert response.status_code == 400
    assert "Only ZIP files" in response.json()["detail"]
