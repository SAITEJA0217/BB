import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bookmark, FileText, Trash2, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Document, Page } from 'react-pdf';

interface BookmarkItem {
  id: number;
  pdf_name: string;
  page_number: number;
  heading: string | null;
  content: string;
  date_saved: string;
}

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState('');
  const [activePageNumber, setActivePageNumber] = useState(1);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/bookmarks');
      setBookmarks(res.data.bookmarks || []);
    } catch (err) {
      toast.error("Failed to load bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBookmark = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b.id !== id));
      toast.success("Bookmark removed");
    } catch (err) {
      toast.error("Failed to delete bookmark");
    }
  };

  const exportBookmarks = () => {
    if (bookmarks.length === 0) return;
    const header = "Date,PDF,Page,Heading,Content\n";
    const rows = bookmarks.map(b => 
      `"${b.date_saved}","${b.pdf_name}","${b.page_number}","${b.heading || ''}","${b.content.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'studymate_bookmarks.csv';
    a.click();
    toast.success("Bookmarks exported!");
  };

  const openViewer = (pdfName: string, pageNum: number) => {
    setActivePdfUrl(`http://localhost:8000/static/${pdfName}`);
    setActivePageNumber(pageNum);
    setViewerOpen(true);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-950 text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
              <Bookmark className="w-8 h-8 mr-3 text-yellow-500" /> Bookmarks Manager
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Save and organize important paragraphs for quick access offline.</p>
          </div>
          
          <button 
            onClick={exportBookmarks}
            disabled={bookmarks.length === 0}
            className="flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg border border-gray-700"
          >
            <Download className="w-5 h-5 mr-2 text-gray-400" /> Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gray-900 rounded-3xl animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-600 bg-gray-900/50 rounded-3xl border border-gray-800/50">
            <Bookmark className="w-24 h-24 mb-6 opacity-20" />
            <p className="text-2xl font-medium text-gray-400">No bookmarks saved yet</p>
            <p className="mt-2 text-gray-500">Search for topics and click the bookmark icon to save them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-16">
            {bookmarks.map((bookmark, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={bookmark.id} 
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all shadow-md group flex flex-col md:flex-row"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center text-blue-300 font-medium bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 text-sm shadow-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        {bookmark.pdf_name}
                      </span>
                      <span className="text-gray-300 bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 font-mono text-sm shadow-sm">
                        Page {bookmark.page_number}
                      </span>
                      {bookmark.heading && (
                        <span className="text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 text-sm shadow-sm">
                          {bookmark.heading}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 hidden md:block">
                      {new Date(bookmark.date_saved).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 font-serif leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    {bookmark.content}
                  </p>
                </div>
                
                <div className="bg-gray-800/50 p-4 md:p-6 md:w-48 flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-800">
                  <button 
                    onClick={() => openViewer(bookmark.pdf_name, bookmark.page_number)}
                    className="flex-1 md:w-full flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl shadow-md transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Open PDF
                  </button>
                  <button 
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors bg-gray-900 border border-gray-800"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {viewerOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-md">
           <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 shadow-xl">
              <h3 className="text-white font-medium flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-400" />
                {activePdfUrl.split('/').pop()} - Page {activePageNumber}
              </h3>
              <button 
                onClick={() => setViewerOpen(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-300 transition-colors border border-gray-700"
              >
                Close Viewer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex justify-center p-8 custom-scrollbar">
              <Document
                file={activePdfUrl}
                loading={<div className="text-blue-500 animate-pulse mt-20 text-xl font-medium">Loading PDF offline...</div>}
                error={<div className="text-red-400 mt-20 text-xl">Failed to load PDF. Ensure the backend static mount is running.</div>}
              >
                <div className="shadow-2xl rounded-xl overflow-hidden border-4 border-gray-800 bg-white">
                  <Page pageNumber={activePageNumber} scale={1.5} renderTextLayer={true} renderAnnotationLayer={false} />
                </div>
              </Document>
            </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
