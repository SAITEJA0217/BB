import React, { useState } from 'react';
import axios from 'axios';
import { HardDrive, Download, Upload as UploadIcon, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BackupRestorePage = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await axios.get('http://localhost:8000/api/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'studymate_backup.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Backup downloaded successfully!');
    } catch (error) {
      toast.error('Failed to create backup.');
    }
    setIsBackingUp(false);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      toast.error('Only ZIP files are supported for restore.');
      return;
    }

    if (!window.confirm("WARNING: This will overwrite your current database and all uploaded PDFs. Are you sure you want to proceed?")) {
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setIsRestoring(true);
    try {
      await axios.post('http://localhost:8000/api/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Restore successful! System re-indexed.');
    } catch (error) {
      toast.error('Restore failed.');
    }
    setIsRestoring(false);
    event.target.value = '';
  };

  return (
    <div className="flex-1 h-full bg-gray-950 text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center mb-8">
          <HardDrive className="w-8 h-8 mr-3 text-cyan-500" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Backup & Restore</h1>
            <p className="text-gray-400 mt-2 text-lg">Secure your study materials, bookmarks, and search history offline.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Backup Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl flex flex-col">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create Backup</h2>
            <p className="text-gray-400 mb-8 flex-1">
              Downloads a compressed ZIP file containing your SQLite database, uploaded PDFs, and all metadata. Store this safely on an external drive.
            </p>
            <button 
              onClick={handleBackup}
              disabled={isBackingUp || isRestoring}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center"
            >
              {isBackingUp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
              {isBackingUp ? 'Generating Backup...' : 'Export Full Backup'}
            </button>
          </div>

          {/* Restore Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl flex flex-col">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
              <UploadIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Restore Backup</h2>
            <p className="text-gray-400 mb-6 flex-1">
              Upload a previously generated `studymate_backup.zip` file.
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">Warning: Restoring will overwrite all existing data. This action cannot be undone.</p>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept=".zip" 
                onChange={handleRestore}
                disabled={isBackingUp || isRestoring}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              <div className="w-full py-4 bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center">
                {isRestoring ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadIcon className="w-5 h-5 mr-2" />}
                {isRestoring ? 'Restoring System...' : 'Select ZIP to Restore'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BackupRestorePage;
