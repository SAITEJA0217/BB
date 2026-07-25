import { useState, useEffect } from 'react';
import { Settings, Save, Monitor, Moon, Sun, Type, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    resultsPerPage: '20',
    enableOCR: true,
    highlightColor: 'yellow',
    defaultZoom: '1.5',
    autoOpenPdf: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('studymate_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('studymate_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  const handleReset = () => {
    if(window.confirm("Reset all settings to default?")) {
      const defaultSettings = {
        theme: 'dark',
        resultsPerPage: '20',
        enableOCR: true,
        highlightColor: 'yellow',
        defaultZoom: '1.5',
        autoOpenPdf: false
      };
      setSettings(defaultSettings);
      localStorage.setItem('studymate_settings', JSON.stringify(defaultSettings));
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="flex-1 h-full bg-gray-950 text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
              <Settings className="w-8 h-8 mr-3 text-blue-500" /> Application Settings
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Customize your StudyMate Offline experience.</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-medium rounded-xl transition-colors border border-gray-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg flex items-center"
            >
              <Save className="w-5 h-5 mr-2" /> Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-md">
            <h2 className="text-xl font-semibold text-white flex items-center mb-6 pb-4 border-b border-gray-800">
              <Monitor className="w-5 h-5 mr-3 text-purple-400" /> Appearance
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Theme</label>
                <div className="flex bg-gray-950 rounded-xl p-1 border border-gray-800">
                  <button onClick={() => handleChange('theme', 'light')} className={`flex-1 flex items-center justify-center py-2 rounded-lg font-medium transition-colors ${settings.theme === 'light' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Sun className="w-4 h-4 mr-2"/> Light</button>
                  <button onClick={() => handleChange('theme', 'dark')} className={`flex-1 flex items-center justify-center py-2 rounded-lg font-medium transition-colors ${settings.theme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}><Moon className="w-4 h-4 mr-2"/> Dark</button>
                  <button onClick={() => handleChange('theme', 'system')} className={`flex-1 flex items-center justify-center py-2 rounded-lg font-medium transition-colors ${settings.theme === 'system' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Monitor className="w-4 h-4 mr-2"/> System</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Highlight Color</label>
                <select 
                  value={settings.highlightColor}
                  onChange={e => handleChange('highlightColor', e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="pink">Pink</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Preferences */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-md">
            <h2 className="text-xl font-semibold text-white flex items-center mb-6 pb-4 border-b border-gray-800">
              <Type className="w-5 h-5 mr-3 text-cyan-400" /> Search Preferences
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Results Per Page</label>
                <select 
                  value={settings.resultsPerPage}
                  onChange={e => handleChange('resultsPerPage', e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="10">10 Results</option>
                  <option value="20">20 Results</option>
                  <option value="50">50 Results</option>
                  <option value="100">100 Results</option>
                </select>
              </div>
              
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings.enableOCR}
                      onChange={e => handleChange('enableOCR', e.target.checked)}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${settings.enableOCR ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.enableOCR ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-medium">Enable Local OCR</div>
                    <div className="text-xs text-gray-500">Automatically run Tesseract on scanned PDFs</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* PDF Viewer Preferences */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-md">
            <h2 className="text-xl font-semibold text-white flex items-center mb-6 pb-4 border-b border-gray-800">
              <Eye className="w-5 h-5 mr-3 text-green-400" /> PDF Viewer
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Default Zoom Level</label>
                <select 
                  value={settings.defaultZoom}
                  onChange={e => handleChange('defaultZoom', e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="1.0">100%</option>
                  <option value="1.2">120%</option>
                  <option value="1.5">150% (Recommended)</option>
                  <option value="2.0">200%</option>
                </select>
              </div>
              
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings.autoOpenPdf}
                      onChange={e => handleChange('autoOpenPdf', e.target.checked)}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${settings.autoOpenPdf ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.autoOpenPdf ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-medium">Auto-Open PDF</div>
                    <div className="text-xs text-gray-500">Open viewer automatically on exact match</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
