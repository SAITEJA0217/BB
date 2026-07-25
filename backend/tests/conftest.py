import pytest
import os
import shutil
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
from reportlab.pdfgen import canvas
import tempfile

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    # Create temp uploads dir for tests
    test_uploads_dir = "test_uploads"
    if not os.path.exists(test_uploads_dir):
        os.makedirs(test_uploads_dir)
        
    # Override upload dir temporarily if possible, but routes.py hardcodes UPLOAD_DIR
    # We'll mock the UPLOAD_DIR in routes by patching, or just clean it up.
    # For now, let's just make sure tests run in an isolated way or we clean up.
    
    with TestClient(app) as c:
        yield c

    # Teardown logic
    app.dependency_overrides.clear()
    if os.path.exists(test_uploads_dir):
        shutil.rmtree(test_uploads_dir)

@pytest.fixture
def generate_test_pdf():
    def _generate(filename="test_doc.pdf", content="This is a test paragraph for BM25 searching. Chapter 1. Unit I."):
        filepath = os.path.join(tempfile.gettempdir(), filename)
        c = canvas.Canvas(filepath)
        c.drawString(100, 750, content)
        c.save()
        return filepath
    return _generate
