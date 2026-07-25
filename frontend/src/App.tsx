import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Search, Database, Bookmark, Settings, HelpCircle, HardDrive, LayoutDashboard } from 'lucide-react';
import LandingPage from './pages/LandingPage.tsx';
import SearchInterface from './pages/SearchInterface.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import BookmarksPage from './pages/BookmarksPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import BackupRestorePage from './pages/BackupRestorePage.tsx';
import ErrorPage from './pages/ErrorPage.tsx';

const Sidebar = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;
  
  const navItems = [
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Backup', path: '/backup', icon: HardDrive },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col items-center md:items-start shrink-0">
      <div className="p-4 md:p-6 w-full flex items-center justify-center md:justify-start border-b border-gray-800 mb-4">
        <Database className="w-8 h-8 text-blue-500 md:mr-3" />
        <span className="hidden md:block font-bold text-xl text-white tracking-tight">StudyMate</span>
      </div>
      
      <nav className="flex-1 w-full flex flex-col gap-2 px-3">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex items-center p-3 rounded-xl transition-all ${
              location.pathname === item.path 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-6 h-6 md:mr-4 shrink-0" />
            <span className="hidden md:block font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-800 w-full mt-auto">
        <Link to="/" className="flex items-center text-gray-500 hover:text-gray-300 transition-colors p-2 md:p-3 rounded-lg hover:bg-gray-800">
          <HelpCircle className="w-6 h-6 md:mr-4 shrink-0" />
          <span className="hidden md:block text-sm font-medium">Help & About</span>
        </Link>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-950 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-hidden flex flex-col relative">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchInterface />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/backup" element={<BackupRestorePage />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          }
        }}/>
      </div>
    </Router>
  );
};

export default App;
