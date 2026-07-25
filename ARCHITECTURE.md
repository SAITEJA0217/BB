# Architecture Overview

StudyMate Offline is built on a highly decoupled stack ensuring speed, offline capability, and cross-platform native execution.

## 1. The Core Application Loop
The application is essentially a Desktop Web Application.
- **Tauri (Rust)**: The entry point of the desktop application. When the `.exe` (or `.dmg`/`.AppImage`) is launched, the compiled Rust binary automatically spawns the FastAPI Backend (compiled as a sidecar) in a background thread. Tauri then renders the React frontend inside a secure Webview (WebView2 on Windows, WebKit on macOS/Linux).
- **Graceful Shutdown**: When the Tauri window is closed, it intercepts the exit signal and cleanly terminates the Python child process.

## 2. The Backend (Python + FastAPI)
- **Data Ingestion**: PyMuPDF (`fitz`) handles rapid PDF parsing. If text extraction yields nothing, it gracefully falls back to `pytesseract` to OCR the images.
- **Search Engine**: The system does NOT use Vector Embeddings to ensure strict offline mode and hardware agnostic speeds. Instead, it tokenizes the documents and uses `rank_bm25` (BM25Okapi) for statistical keyword retrieval. 
- **Query Processing**: Before a query hits BM25, it passes through `RapidFuzz` for typo correction and a Synonym Expansion dictionary.
- **Storage**: All structured data (Upload Metadata, Bookmarks, History, System Configurations) is stored in a highly-optimized local `SQLite` database.

## 3. The Frontend (React + TypeScript)
- **State Management**: Uses React standard hooks (`useState`, `useEffect`) and `localStorage` for UI-specific configuration.
- **Routing**: `react-router-dom` handles navigation between the Search, Dashboard, Bookmarks, Backup, and Settings pages.
- **PDF Viewer**: Integrates `react-pdf` to stream the native PDF bytes from the local FastAPI mount, allowing students to seamlessly navigate pages matching their search result.
