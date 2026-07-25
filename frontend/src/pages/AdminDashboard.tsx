import React, { useState, useEffect } from 'react';
import { Upload, FileText, ArrowLeft, Loader2, RefreshCw, Trash2, DatabaseBackup, Database as DatabaseIcon, BarChart3, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Document {
  id: number;
  filename: string;
  pages: number;
  paragraphs: number;
  file_size: number;
  upload_date: string;
}

interface Stats {
  total_pdfs: number;
  total_pages: number;
  total_paragraphs: number;
  total_bookmarks: number;
  database_size_bytes: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get('http://localhost:8000/api/documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
    setIsFetching(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert("Only PDF files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Upload & Indexing successful (OCR fallback applied if scanned)');
      fetchDocuments();
      fetchStats();
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        alert(error.response.data.detail || "Duplicate PDF detected.");
      } else {
        alert('Upload failed');
      }
    }
    setIsUploading(false);
    event.target.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/documents/${id}`);
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleRebuild = async () => {
    try {
      await axios.post('http://localhost:8000/api/rebuild_index');
      alert("Index & Vocabulary rebuilt successfully.");
    } catch (error) {
      console.error("Rebuild failed", error);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-12 relative text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 bg-gray-900 px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-400 mb-10 text-lg">Manage offline study material, perform OCR, and view statistics.</p>

        {/* Extended Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
          <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: 0.1}} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col justify-center shadow-xl">
            <div className="flex items-center text-gray-400 mb-3"><FileText className="w-5 h-5 mr-2"/> PDFs</div>
            <span className="text-4xl font-bold text-white">{stats?.total_pdfs || 0}</span>
          </motion.div>
          <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: 0.2}} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col justify-center shadow-xl">
            <div className="flex items-center text-gray-400 mb-3"><FileText className="w-5 h-5 mr-2 text-blue-400"/> Pages</div>
            <span className="text-4xl font-bold text-blue-400">{stats?.total_pages || 0}</span>
          </motion.div>
          <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: 0.3}} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col justify-center shadow-xl">
            <div className="flex items-center text-gray-400 mb-3"><BarChart3 className="w-5 h-5 mr-2 text-purple-400"/> Paragraphs</div>
            <span className="text-4xl font-bold text-purple-400">{stats?.total_paragraphs || 0}</span>
          </motion.div>
          <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: 0.4}} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col justify-center shadow-xl">
            <div className="flex items-center text-gray-400 mb-3"><Bookmark className="w-5 h-5 mr-2 text-yellow-400"/> Bookmarks</div>
            <span className="text-4xl font-bold text-yellow-400">{stats?.total_bookmarks || 0}</span>
          </motion.div>
          <motion.div initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: 0.5}} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-6 flex flex-col justify-center shadow-xl">
            <div className="flex items-center text-gray-400 mb-3"><DatabaseIcon className="w-5 h-5 mr-2 text-green-400"/> DB Size</div>
            <span className="text-3xl font-bold text-green-400 truncate">{formatBytes(stats?.database_size_bytes || 0)}</span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                <Upload className="mr-3 text-blue-400" /> Upload Material
              </h2>
              
              <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center relative group bg-gray-950 shadow-inner min-h-[250px]">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-300 font-medium text-lg">Processing PDF...</p>
                    <p className="text-sm text-gray-500 mt-2">Checking duplicates, extracting text & running OCR if needed.</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors shadow-lg">
                      <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-400" />
                    </div>
                    <p className="text-gray-300 font-medium mb-2 text-lg">Click or drag PDF</p>
                    <p className="text-sm text-gray-500 max-w-[200px]">Auto extracts metadata, checks hashes, and performs local indexing.</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-sm">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <DatabaseBackup className="mr-3 text-purple-400" /> Maintenance
              </h2>
              <button onClick={handleRebuild} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-sm font-medium rounded-xl transition-all border border-gray-700 flex items-center justify-center shadow-md">
                <RefreshCw className="w-4 h-4 mr-2" /> Force Rebuild Index
              </button>
            </div>
          </div>

          {/* Document List Section */}
          <div className="md:col-span-2 bg-gray-900/50 border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold flex items-center text-white">
                <FileText className="mr-3 text-cyan-400" /> Uploaded PDFs
              </h2>
              <button 
                onClick={() => {fetchDocuments(); fetchStats();}} 
                disabled={isFetching}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300 hover:text-white border border-gray-700 shadow-md"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] border border-gray-800/50 rounded-2xl bg-black/40 p-6 custom-scrollbar">
              {documents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 py-24">
                  <FileText className="w-20 h-20 mb-6 opacity-20" />
                  <p className="text-xl font-medium">No documents uploaded yet</p>
                  <p className="text-sm mt-2">Upload a PDF to build the BM25 index locally.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex flex-col p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center truncate mr-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-4 shadow-inner">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="truncate font-medium text-gray-200 text-lg">{doc.filename}</span>
                            <span className="text-xs text-gray-500">{new Date(doc.upload_date).toLocaleString()} • {formatBytes(doc.file_size)}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(doc.id)} className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors" title="Delete PDF">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex text-sm text-gray-400 space-x-4 ml-16">
                        <span className="bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 shadow-sm">Pages: {doc.pages}</span>
                        <span className="bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 shadow-sm">Paragraphs: {doc.paragraphs}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
