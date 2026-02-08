
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
import ProjectExplorer from './components/ProjectExplorer';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import { safeLocalStorage } from './utils/storage';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return safeLocalStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      safeLocalStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      safeLocalStorage.setItem('theme', 'light');
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

  const setView = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard setView={setView} />;
      case AppView.FILE_TRANSLATOR:
        return <FileTranslator setView={setView} />;
      case AppView.LIVE_INTERPRETER:
        return <LiveInterpreter setView={setView} />;
      case AppView.TRANSCRIPTION:
        return <TranscriptionView setView={setView} />;
      case AppView.SUBTITLING:
        return <SubtitlingView setView={setView} />;
      case AppView.AD_LOCALIZATION:
        return <AdLocalizationView setView={setView} />;
      case AppView.NUANCE_GUARD:
        return <NuanceGuard setView={setView} />;
      case AppView.VOICEOVER_STUDIO:
        return <VoiceoverStudio setView={setView} />;
      case AppView.PROJECT_VIEW:
        return <ProjectExplorer setView={setView} />;
      case AppView.DOCUMENTATION:
        return <DocumentationView setView={setView} />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  const isDocumentation = currentView === AppView.DOCUMENTATION;
  const isDashboard = currentView === AppView.DASHBOARD;

  return (
    <ErrorBoundary>
      <div className={`${isDarkMode ? 'dark' : ''}`}>
        {showLanding ? (
          <LandingPage 
            onEnter={enterApp} 
            toggleTheme={() => setIsDarkMode(!isDarkMode)} 
            isDarkMode={isDarkMode} 
          />
        ) : (
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {!isDocumentation && (
              <>
                {isSidebarOpen && (
                  <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                  ></div>
                )}
                <div className={`fixed inset-y-0 left-0 z-[50] w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                  <Sidebar currentView={currentView} setView={setView} />
                </div>
              </>
            )}
            
            <main className="flex-1 overflow-y-auto relative px-4 sm:px-8 lg:px-12 no-scrollbar">
              <header className="mb-6 flex justify-between items-center sticky top-0 z-40 py-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent dark:border-slate-800/30">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-3 bg-white dark:bg-slate-900 rounded-xl shadow-brand-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95"
                    aria-label="Toggle Navigation Menu"
                    title="Toggle mobile menu"
                  >
                    <i className="ph-bold ph-list text-xl"></i>
                  </button>

                  <div className="flex items-center gap-2">
                    {!isDashboard && (
                      <button 
                        onClick={() => setView(AppView.DASHBOARD)}
                        className="hidden sm:flex p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 group"
                        title="Back to Dashboard"
                      >
                        <i className="ph ph-house text-xl group-hover:scale-110 transition-transform"></i>
                      </button>
                    )}
                    <div 
                      className="cursor-pointer group"
                      onClick={() => setView(AppView.DASHBOARD)}
                      title="Navigate to Dashboard"
                    >
                      <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter truncate max-w-[180px] sm:max-w-none group-hover:text-indigo-600 transition-colors">
                        {currentView.replace('_', ' ')}
                      </h1>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-6">
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] shadow-brand-sm flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95"
                    aria-label="Toggle Dark Mode"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDarkMode ? <i className="ph-bold ph-sun text-lg"></i> : <i className="ph-bold ph-moon text-lg"></i>}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-brand-lg ring-2 ring-white dark:ring-slate-800 cursor-pointer shrink-0" title="User Profile: John Doe (JD)">
                    JD
                  </div>
                </div>
              </header>

              <div className={`${isDocumentation ? 'max-w-7xl' : 'max-w-6xl'} mx-auto pb-16`}>
                {renderView()}
              </div>
            </main>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
