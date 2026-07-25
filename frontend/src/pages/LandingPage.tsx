import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Database, Bot, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const fullGreeting = "Hello. I'm StudyMate, your intelligent knowledge assistant.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullGreeting.length) {
        setGreeting(fullGreeting.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40);
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gray-950 text-white font-sans">
      {/* Dynamic AI Background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDelay: '4s' }}></div>

      <main className="z-10 flex flex-col items-center w-full max-w-5xl px-6">
        
        {/* Glowing Orb / Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full p-1 relative z-10 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* AI Typing Effect Greeting */}
        <div className="h-12 mb-6">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-300 tracking-wide">
            {greeting}<span className="animate-ping ml-1 text-blue-500">|</span>
          </h1>
        </div>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 text-center"
        >
          How can I help you study today?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl text-center font-light leading-relaxed"
        >
          Interact with your study materials instantly. Ask questions, discover connections, and extract insights from your local knowledge base.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.1 }}
          className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto"
        >
          <button 
            onClick={() => navigate('/search')}
            className="group flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] w-full sm:w-auto text-lg overflow-hidden relative"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <MessageSquare className="mr-3 w-5 h-5 text-blue-400" />
            <span className="relative z-10">Start Interaction</span>
            <ArrowRight className="ml-2 w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
          </button>
          
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center justify-center px-8 py-4 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white rounded-full font-medium border border-transparent hover:border-white/10 transition-all w-full sm:w-auto text-lg"
          >
            <Database className="mr-3 w-5 h-5 opacity-70" />
            Knowledge Base
          </button>
        </motion.div>
        
        {/* Subtle decorative features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3 }}
          className="mt-20 flex gap-6 text-sm text-gray-500 font-medium"
        >
          <div className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-400/70" /> Smart Search</div>
          <div className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-400/70" /> Deep Insights</div>
          <div className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-400/70" /> Context Aware</div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
