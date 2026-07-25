# Administrator Guide

StudyMate Offline gives administrators absolute control over the knowledge base. Since everything runs locally, no external parties ever see your uploaded syllabi or textbooks.

## 📁 Managing PDFs
1. Navigate to the **Dashboard** via the left sidebar.
2. Locate the **Knowledge Base Management** section.
3. Click **Upload PDF** to add new study material. The system will immediately parse the text, perform OCR if necessary, and index the content.
4. To remove a document, click the **Trash** icon next to the PDF in the files list. *Note: Deleting a PDF automatically purges its indexed content from the search engine.*

## 💾 Backups & Restores
It is highly recommended to perform weekly backups of your knowledge base.
1. Navigate to the **Backup** page via the left sidebar.
2. Click **Export Full Backup**. This generates a `.zip` file containing your SQLite database and all raw uploaded PDFs.
3. To restore the system on a new machine, simply navigate to the Backup page and upload this `.zip` file. The system will automatically overwrite the existing data and safely re-index the BM25 search engine.

## 📊 Viewing Statistics
The **Dashboard** provides real-time insights into your students' usage:
- Total Indexed Paragraphs
- Most Searched Topics
- Cache Hit Efficiency

If you encounter issues, please refer to the `TROUBLESHOOTING.md` document.
