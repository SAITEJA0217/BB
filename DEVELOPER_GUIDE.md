# Developer Guide

Welcome to the StudyMate Offline developer team.

## Requirements
- Python 3.11+
- Node.js 20+
- Rust Toolchain

## Local Setup

### 1. Backend
```bash
cd backend
python -m venv venv
# Activate venv (Windows: .\venv\Scripts\activate, Unix: source venv/bin/activate)
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tauri Desktop Integration
To run the full desktop application in development mode:
```bash
cd frontend
npm run tauri dev
```
*Note: Ensure your backend is running independently on port 8000 when developing locally, as the Rust launcher only executes the compiled sidecar in production mode.*

## PyInstaller Sidecar
To compile the backend manually:
```bash
cd backend
pyinstaller studymate.spec
```
Copy the resulting executable from `dist/` into `frontend/src-tauri/bin/` before running Tauri builds. (This is automated by our GitHub Actions workflow).
