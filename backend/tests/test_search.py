from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "StudyMate" in response.json()["message"]

def test_empty_search():
    response = client.post("/api/search", json={"q": ""})
    assert response.status_code == 200
    assert response.json()["results"] == []

def test_autocomplete_empty():
    response = client.get("/api/autocomplete?q=")
    assert response.status_code == 200
    assert response.json()["suggestions"] == []
