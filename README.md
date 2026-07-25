# StudyMate Offline

StudyMate Offline is a completely offline, highly-secure, PDF-based desktop study assistant built for universities, colleges, and libraries. It requires no internet connection, completely isolating your proprietary educational materials from third-party APIs and Cloud LLMs.

## 🚀 Features
- **100% Offline Search**: Powered by BM25, RapidFuzz spell correction, and synonym expansion.
- **Embedded PDF Viewer**: A full-featured PDF viewer with exact page navigation and highlighted paragraphs.
- **Bookmarks & History**: Save your most crucial study findings and export them to CSV.
- **OCR Fallback**: Automatically extracts text from scanned PDFs using Tesseract.
- **Admin Dashboard**: Manage PDFs, view usage statistics, and trigger full system backups.

## 📦 Architecture
StudyMate uses a highly decoupled modern stack bundled into a native desktop executable via **Tauri**:
- **Backend**: Python 3.11, FastAPI, SQLite, PyMuPDF, rank_bm25.
- **Frontend**: React 18, TypeScript, TailwindCSS, shadcn/ui.
- **Desktop**: Rust, Tauri.

## 🛠 Installation

### End-Users
Simply navigate to our [Releases page](https://github.com/your-org/studymate-offline/releases) and download the appropriate installer for your OS:
- **Windows**: `StudyMate-Offline-Setup.exe`
- **macOS**: `StudyMate-Offline.dmg`
- **Linux**: `StudyMate-Offline.AppImage`

### Developers
Refer to the `DEVELOPER_GUIDE.md` for instructions on setting up the local environment.

## 📖 Documentation
- [User Guide](USER_GUIDE.md)
- [Administrator Guide](ADMIN_GUIDE.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Troubleshooting & FAQ](TROUBLESHOOTING.md)

---
**Version**: 3.0.0
**License**: MIT
