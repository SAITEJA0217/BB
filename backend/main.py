import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, SessionLocal
from routes import router as api_router
from search_engine import build_index
from spell_corrector import build_vocabulary

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudyMate Offline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounting for PDF Viewer
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    build_index(db)
    build_vocabulary(db)
    db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to StudyMate Offline API"}
