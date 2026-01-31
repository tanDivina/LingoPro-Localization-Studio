
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import FileTranslator from './components/FileTranslator';
import LiveInterpreter from './components/LiveInterpreter';
import TranscriptionView from './components/TranscriptionView';
import SubtitlingView from './components/SubtitlingView';
import AdLocalizationView from './components/AdLocalizationView';
import NuanceGuard from './components/NuanceGuard';
import VoiceoverStudio from './components/VoiceoverStudio';
import DocumentationView from './components/DocumentationView';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const enterApp = (view: AppView = AppView.DASHBOARD) => {
    setCurrentView(view);
    setShowLanding(false);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard setView={setCurrentView} />;
      case AppView.FILE_TRANSLATOR:
        return <FileTranslator />;
      case AppView.LIVE_INTERPRETER:
        return <LiveInterpreter />;
      case AppView.TRANSCRIPTION:
        return <TranscriptionView />;
      case AppView.SUBTITLING:
        return <SubtitlingView />;
      case AppView.AD_LOCALIZATION:
        return <AdLocalizationView />;
      case AppView.NUANCE_GUARD:
        return <NuanceGuard />;
      case AppView.VOICEOVER_STUDIO:
        return <VoiceoverStudio />;
      case AppView.DOCUMENTATION:
        return <DocumentationView />;
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={enterApp} toggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} />;
  }

  const isDocumentation = currentView === AppView.DOCUMENTATION;

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {!isDocumentation && <Sidebar currentView={currentView} setView={setCurrentView} />}
        
        <main className="flex-1 overflow-y-auto relative p-8">
          <header className="mb-8 flex justify-between items-center sticky top-0 z-10 py-4 -mt-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent dark:border-slate-800/30">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                {currentView.replace('_', ' ')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">LingoPro Localization Suite</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                {isDocumentation && (
                  <button 
                    onClick={() => setCurrentView(AppView.DASHBOARD)}
                    className="flex items-center space-x-2 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-xl transition-all"
                  >
                    <i className="ph-bold ph-arrow-left"></i>
                    <span>Return to Dashboard</span>
                  </button>
                )}
                <button 
                  onClick={() => setShowLanding(true)}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors flex items-center space-x-2"
                >
                  <i className="ph-bold ph-door"></i>
                  <span>Exit to Landing</span>
                </button>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? (
                    <i className="ph-bold ph-sun w-5 h-5"></i>
                  ) : (
                    <i className="ph-bold ph-moon w-5 h-5"></i>
                  )}
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-105 transition-transform">
                  JD
                </div>
              </div>
            </div>
          </header>

          <div className={`${isDocumentation ? 'max-w-7xl' : 'max-w-6xl'} mx-auto pb-12`}>
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
