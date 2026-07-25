
import { AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 h-full bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xl text-gray-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg transition-colors"
      >
        <Home className="w-5 h-5 mr-3" /> Return to Home
      </button>
    </div>
  );
};

export default ErrorPage;
