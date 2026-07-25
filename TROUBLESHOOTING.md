# Troubleshooting & FAQ

## ❌ Application opens to a blank screen
Ensure that no other process is occupying Port `8000`. The FastAPI backend requires Port 8000 to stream PDFs and serve the search API.

## ❌ PDF Upload Fails
- Ensure the file is a standard `.pdf` document.
- Ensure the file size is under 50MB (default limit configured in `routes.py`).
- If the PDF is password-protected, the system cannot parse it. You must remove the password protection first.

## ❌ Search is returning irrelevant results
BM25 relies on exact keyword matching and term frequency. If you are not getting good results:
- Check your spelling.
- Ensure the uploaded PDF actually contains the text (try opening it and searching natively).
- If the PDF is a scanned image, ensure "Enable Local OCR" is toggled ON in the Settings page.

## ❌ Backup ZIP is corrupted
Ensure the backup completes fully before closing the application. If the `/uploads` directory is exceptionally large (multiple GBs), the ZIP creation may take a moment. 

## ❌ Where are my logs?
Logs are automatically written to `logs/studymate.log` inside the installation directory. If you experience crashes, review this file or submit it with your bug report.
