
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onExit?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onExit }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: <i className="ph-bold ph-house"></i>, tip: 'Central overview and project status' },
    { id: AppView.PROJECT_VIEW, label: 'Projects', icon: <i className="ph-bold ph-folder-open"></i>, tip: 'Comprehensive project management' },
    { id: AppView.FILE_TRANSLATOR, label: 'File Translator', icon: <i className="ph-bold ph-file-doc"></i>, tip: 'XLIFF and Document studio' },
    { id: AppView.TRANSCRIPTION, label: 'Transcription', icon: <i className="ph-bold ph-waveform"></i>, tip: 'Speech-to-text with diarization' },
    { id: AppView.SUBTITLING, label: 'Subtitling', icon: <i className="ph-bold ph-closed-captioning"></i>, tip: 'Video subtitle timing and translation' },
    { id: AppView.NUANCE_GUARD, label: 'Nuance Guard', icon: <i className="ph-bold ph-shield-check"></i>, tip: 'Cultural and brand compliance scan' },
    { id: AppView.VOICEOVER_STUDIO, label: 'Voiceover Studio', icon: <i className="ph-bold ph-broadcast"></i>, tip: 'Neural speech synthesis' },
    { id: AppView.LIVE_INTERPRETER, label: 'Live Interpreter', icon: <i className="ph-bold ph-microphone-stage"></i>, tip: 'Real-time voice-to-voice link' },
    { id: AppView.AD_LOCALIZATION, label: 'Ad Localization', icon: <i className="ph-bold ph-eye"></i>, tip: 'Visual marker and signage adaptation' },
    { id: AppView.DOCUMENTATION, label: 'Knowledge Base', icon: <i className="ph-bold ph-books"></i>, tip: 'Expert manuals and technical whitepapers' },
  ];

  return (
    <aside className="w-full lg:w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-brand-xl lg:shadow-none overflow-y-auto no-scrollbar">
      <div className="p-6 lg:p-8">
        <div className="flex items-center space-x-3 mb-8 lg:mb-12">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-brand-lg overflow-hidden">
            <i className="ph-bold ph-globe text-xl sm:text-2xl animate-spin-slow"></i>
          </div>
          <div>
             <span className="block text-lg lg:text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">LingoPro</span>
             <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Localization</span>
          </div>
        </div>
        
        <nav className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center space-x-4 px-4 h-[44px] sm:h-[48px] rounded-lg sm:rounded-md text-sm font-bold transition-all ${
                currentView === item.id 
                  ? 'sidebar-item-active text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              aria-current={currentView === item.id ? 'page' : undefined}
              title={item.tip}
            >
              <div className="text-xl shrink-0">{item.icon}</div>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 lg:p-8 border-t border-slate-50 dark:border-slate-800/50 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800" title="Node Connectivity Status">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Node Cluster Live</span>
              </div>
            </div>
            <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 w-full animate-shimmer"></div>
            </div>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="w-full flex items-center space-x-4 px-4 h-11 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm font-bold"
        >
          <i className="ph-bold ph-sign-out text-xl"></i>
          <span>Exit Suite</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
