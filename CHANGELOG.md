# Changelog

## [3.0.0] - 2026-07-24
### Added
- **Tauri Native Application**: Full desktop support across Windows, macOS, and Linux. No more messy command lines required.
- **Backup & Restore**: Added one-click backup exports of the database and uploaded PDFs directly from the UI.
- **Bookmarks Manager**: Save specific paragraphs and export them to a CSV spreadsheet.
- **Settings Panel**: Toggle Dark Mode, Zoom preferences, and Local OCR capabilities.
- **Real PDF Viewer**: Deep-links directly into the exact page of the document within the app.
- **Automated Testing**: 90%+ backend coverage with exhaustive duplicate-detection and parsing pipelines.
- **Crash Recovery**: Added robust exception handling to the backend. Corrupted PDFs now bounce gracefully without halting the application.

### Changed
- Refactored frontend to an SPA using `react-router-dom`.
- Optimized SQLite read operations and implemented an LRU search cache for `rank_bm25` lookups.

### Security
- Added strict PDF upload validation.
- Sanitized filenames to block directory traversal attacks.
- Enforced 50MB maximum upload limit.
