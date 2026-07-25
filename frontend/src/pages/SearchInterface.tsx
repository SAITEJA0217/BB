import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, FileText, Copy, AlertCircle, Bookmark, History, Download, X, Settings, Bot, Send, Sparkles, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';

// Configure PDF.js worker
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface SearchResult {
  id: number;
  pdf_name: string;
  page_number: number;
  chapter: string | null;
  unit: string | null;
  heading: string | null;
  paragraph_number: number;
  content: string;
  match_score: number;
}

const SearchInterface: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // History
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Filters
  const [availablePdfs, setAvailablePdfs] = useState<string[]>([]);
  const [selectedPdf, setSelectedPdf] = useState('All');
  
  // PDF Viewer Modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState('');
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
    axios.get('http://localhost:8000/api/documents').then(res => {
      const docs = res.data.documents || [];
      setAvailablePdfs(docs.map((d: any) => d.filename));
    });
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/history');
      setSearchHistory(res.data.history || []);
    } catch(e) {}
  };

  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      try {
        const res = await axios.get(`http://localhost:8000/api/autocomplete?q=${encodeURIComponent(val)}`);
        setSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const q = directQuery || query;
    if (!q.trim()) return;

    setShowSuggestions(false);
    setIsLoading(true);
    setHasSearched(true);
    setQuery(q); // update input
    
    try {
      const filters: any = {};
      if (selectedPdf !== 'All') filters.pdf_name = selectedPdf;
      
      const response = await axios.post('http://localhost:8000/api/chat', {
        q: q,
        filters
      });
      setResults(response.data.sources || []);
      setExplanation(response.data.explanation || '');
      fetchHistory();
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
      setExplanation('');
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveBookmark = async (res: SearchResult) => {
    try {
      await axios.post('http://localhost:8000/api/bookmarks', {
        pdf_name: res.pdf_name,
        page_number: res.page_number,
        heading: res.heading,
        content: res.content
      });
      alert('Bookmarked!');
    } catch (e) {
      alert('Failed to bookmark.');
    }
  };

  const openPdfViewer = (pdfName: string, pageNum: number) => {
    setActivePdfUrl(`http://localhost:8000/static/${pdfName}`);
    setActivePageNumber(pageNum);
    setViewerOpen(true);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const exportResultsCSV = () => {
    if (results.length === 0) return;
    const header = "PDF,Page,Chapter,Unit,Heading,Match Score,Content\n";
    const rows = results.map(r => `"${r.pdf_name}","${r.page_number}","${r.chapter || ''}","${r.unit || ''}","${r.heading || ''}","${r.match_score}","${r.content.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search_results.csv';
    a.click();
  };

  const highlightContent = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    const cleanQuery = searchQuery.replace(/ AND | OR | NOT /gi, ' ');
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return text;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-400/80 text-black rounded px-1 font-medium shadow-sm">{part}</mark> : part
    );
  };

  // Custom text renderer for PDF to highlight search terms
  const customTextRenderer = ({ str }: any) => {
    const cleanQuery = query.replace(/ AND | OR | NOT /gi, ' ');
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return str;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    return str.replace(regex, (match: string) => `<mark class="bg-yellow-400/80 text-black px-1 rounded">${match}</mark>`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200 font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-4 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 shrink-0 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-blue-400 mr-2" />
            <h1 className="font-bold text-xl text-white tracking-tight">StudyMate Agent</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedPdf}
            onChange={(e) => setSelectedPdf(e.target.value)}
            className="bg-gray-900/50 border border-gray-700 text-sm rounded-full py-1.5 px-4 text-gray-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
          >
            <option value="All">All Documents</option>
            {availablePdfs.map(pdf => (
              <option key={pdf} value={pdf}>{pdf}</option>
            ))}
          </select>
          <button className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area (Chat/Results) */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-8 w-full relative z-10 custom-scrollbar pb-32"
        onClick={() => setShowSuggestions(false)}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          
          {!hasSearched && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-[50vh] text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full p-[2px] mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
                <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Hello, I'm ready.</h2>
              <p className="text-gray-400 max-w-md text-lg font-light leading-relaxed">
                Ask me a question or provide a topic. I'll scan your knowledge base to find relevant insights instantly.
              </p>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex gap-4 p-6 bg-gray-900/40 border border-gray-800 rounded-2xl w-full max-w-3xl self-start backdrop-blur-sm">
              <div className="w-8 h-8 shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 space-y-4 pt-1">
                <div className="h-4 bg-gray-800/80 rounded w-1/4 animate-pulse"></div>
                <div className="h-3 bg-gray-800/50 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-800/50 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          )}

          {hasSearched && !isLoading && results.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 p-6 bg-gray-900/40 border border-gray-800 rounded-2xl w-full max-w-3xl self-start backdrop-blur-sm"
            >
              <div className="w-8 h-8 shrink-0 bg-gray-800 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-gray-300">
                  I searched through your documents but couldn't find any direct matches for <strong className="text-white">"{query}"</strong>. 
                  Try rephrasing your search or selecting a different document.
                </p>
              </div>
            </motion.div>
          )}

          {hasSearched && !isLoading && results.length > 0 && (
            <>
              {/* AI Intro Message & Explanation */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 mb-4"
              >
                <div className="w-8 h-8 shrink-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-6 mb-4 shadow-lg backdrop-blur-md">
                    <p className="text-gray-100 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                      {explanation}
                    </p>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Here are the sources from your knowledge base I used:</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center"><Search className="w-3 h-3 mr-1" /> {results.length} insights extracted</span>
                    <button onClick={exportResultsCSV} className="flex items-center hover:text-blue-400 transition-colors">
                      <Download className="w-3 h-3 mr-1" /> Export Data
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Result Cards */}
              <div className="space-y-6 ml-12">
                {results.map((result, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="bg-gray-900/60 backdrop-blur-md border border-gray-800/80 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:bg-gray-900/80 transition-all shadow-lg group relative"
                  >
                    <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-xs font-medium">
                          Score: {result.match_score}%
                        </span>
                        <span className="flex items-center text-gray-300 bg-white/5 px-3 py-1 rounded-full text-xs">
                          <FileText className="w-3 h-3 mr-1.5 opacity-70" />
                          {result.pdf_name} (Pg {result.page_number})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => saveBookmark(result)}
                          className="p-1.5 text-gray-400 hover:text-yellow-400 bg-gray-800 rounded-lg transition-colors"
                          title="Bookmark Insight"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(result.content)}
                          className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-colors"
                          title="Copy text"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openPdfViewer(result.pdf_name, result.page_number)}
                          className="flex items-center text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors ml-1"
                        >
                          View Source
                        </button>
                      </div>
                    </div>

                    {(result.chapter || result.unit || result.heading) && (
                      <div className="px-6 py-2 bg-white/[0.02] flex flex-wrap gap-4 text-xs text-gray-400">
                        {result.unit && <span>Unit: <span className="text-gray-300">{result.unit}</span></span>}
                        {result.chapter && <span>Chapter: <span className="text-gray-300">{result.chapter}</span></span>}
                        {result.heading && <span>Heading: <span className="text-gray-300">{result.heading}</span></span>}
                      </div>
                    )}
                    
                    <div className="p-6">
                      <p className="text-gray-200 leading-relaxed font-serif text-lg">
                        {highlightContent(result.content, query)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Floating Input Bar */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-gray-950 via-gray-950 to-transparent pt-12 pb-6 px-4 z-30">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={(e) => handleSearch(e)} className="relative flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-2xl blur opacity-30 pointer-events-none"></div>
            <div className="relative flex w-full bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl items-center p-2 focus-within:border-blue-500/50 transition-colors">
              <MessageSquare className="w-5 h-5 text-gray-500 ml-4 mr-2 hidden sm:block" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => { if(suggestions.length > 0 || searchHistory.length > 0) setShowSuggestions(true); }}
                placeholder="Ask me anything about your documents..."
                className="flex-1 bg-transparent py-3 px-2 focus:outline-none text-white text-lg placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="p-3 mr-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-colors shrink-0 shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Suggestions Pop-up (upwards) */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-3 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-40"
                >
                  {suggestions.length > 0 && (
                    <div className="p-2 border-b border-gray-800">
                      <p className="text-xs text-gray-500 px-3 pb-2 pt-1 font-medium uppercase tracking-wider">Suggested queries</p>
                      {suggestions.map((s, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleSearch(undefined, s)}
                          className="px-4 py-3 hover:bg-white/5 cursor-pointer text-gray-200 rounded-xl transition-colors flex items-center gap-3"
                        >
                          <Search className="w-4 h-4 text-gray-500" /> {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchHistory.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 px-3 pb-2 pt-1 font-medium uppercase tracking-wider">Recent history</p>
                      {searchHistory.slice(0, 3).map((h, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleSearch(undefined, h.query)}
                          className="px-4 py-3 hover:bg-white/5 cursor-pointer text-gray-300 rounded-xl transition-colors flex items-center gap-3"
                        >
                          <History className="w-4 h-4 text-gray-500" /> {h.query}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-gray-900/50 border-b border-gray-800">
              <h3 className="text-white font-medium flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-400" />
                {activePdfUrl.split('/').pop()}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-950 rounded-lg border border-gray-800">
                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors">-</button>
                  <span className="px-3 text-sm font-mono text-gray-300">{Math.round(scale * 100)}%</span>
                  <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors">+</button>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  Page <input 
                    type="number" 
                    value={activePageNumber} 
                    onChange={e => setActivePageNumber(Number(e.target.value))}
                    className="w-16 mx-2 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-center text-white focus:outline-none focus:border-blue-500 transition-colors"
                    min={1} max={numPages || 1}
                  /> of {numPages || '--'}
                </div>
                <button 
                  onClick={() => setViewerOpen(false)}
                  className="p-2 bg-gray-800/50 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto flex justify-center p-8 custom-scrollbar relative">
              <Document
                file={activePdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center mt-32 text-gray-400">
                    <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="animate-pulse">Loading Document...</p>
                  </div>
                }
                error={
                  <div className="text-red-400 mt-32 flex flex-col items-center bg-red-500/10 p-8 rounded-2xl border border-red-500/20">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p>Failed to load PDF. Ensure the backend is running.</p>
                  </div>
                }
              >
                <div className="shadow-2xl rounded-xl overflow-hidden border border-gray-800 bg-white relative z-10">
                  <Page 
                    pageNumber={activePageNumber} 
                    scale={scale} 
                    renderAnnotationLayer={false}
                    renderTextLayer={true}
                    customTextRenderer={customTextRenderer}
                  />
                </div>
              </Document>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SearchInterface;
