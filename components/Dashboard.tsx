
import React from 'react';
import { TranslationProject, AppView, GlossaryTerm, StyleguideRule, LocalizationAsset } from '../types';
import { safeLocalStorage } from '../utils/storage';

interface DashboardProps {
  setView?: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const stats = [
    { label: 'Words Translated', value: '1.2M', trend: '+12%', color: 'border-l-indigo-600', icon: <i className="ph-bold ph-file-text"></i>, tip: 'Total volume of linguistic data processed across all projects' },
    { label: 'Active Projects', value: '24', trend: '+2', color: 'border-l-indigo-500', icon: <i className="ph-bold ph-folder-open"></i>, tip: 'Current localization projects in non-final status' },
    { label: 'Avg Accuracy', value: '99.4%', trend: '+0.2%', color: 'border-l-emerald-500', icon: <i className="ph-bold ph-seal-check"></i>, tip: 'Mean confidence score calculated from AI and manual reviews' },
    { label: 'Team Members', value: '12', trend: 'Active', color: 'border-l-amber-500', icon: <i className="ph-bold ph-users"></i>, tip: 'Internal and external expert translators currently on-platform' },
  ];

  const recentProjects: TranslationProject[] = [
    { id: '1', name: 'Q4 Product Catalog', sourceLang: 'English', targetLang: 'Spanish', status: 'In Progress', progress: 65, lastModified: '2h ago' },
    { id: '2', name: 'User Manual v2.1', sourceLang: 'German', targetLang: 'French', status: 'Completed', progress: 100, lastModified: '5h ago' },
    { id: '3', name: 'Marketing Campaign', sourceLang: 'English', targetLang: 'Japanese', status: 'Pending', progress: 0, lastModified: '1d ago' },
    { id: '4', name: 'Legal Terms of Service', sourceLang: 'English', targetLang: 'German', status: 'In Progress', progress: 30, lastModified: '2d ago' },
  ];

  const injectDemoEnvironment = () => {
    const demoAssets: LocalizationAsset[] = [
      {
        id: 'demo-1',
        name: 'Enterprise_Terms_v2.xliff',
        type: 'xliff',
        size: 45200,
        status: 'pending',
        content: `<?xml version="1.0" encoding="UTF-8"?><xliff version="1.2"><file source-language="en" target-language="ja"><body style="font-family: Inter">
          <trans-unit id="1"><source>Welcome to our global platform.</source><target></target></trans-unit>
          <trans-unit id="2"><source>The mission of LingoPro is to empower seamless communication.</source><target></target></trans-unit>
          <trans-unit id="3"><source>Zero-latency neural processing enabled by Gemini 3.</source><target></target></trans-unit>
        </body></file></xliff>`
      }
    ];

    const demoGlossary: GlossaryTerm[] = [
      { source: 'Cloud Node', target: 'クラウドノード', description: 'Computing cluster infrastructure' },
      { source: 'Fidelity', target: '忠実度', description: 'Visual and acoustic accuracy' }
    ];

    const demoStyleguide: StyleguideRule[] = [
      { id: 'r1', type: 'prohibited_word', pattern: 'Cheap', description: 'Use "Cost-Effective" instead for brand prestige.', severity: 'High' }
    ];

    safeLocalStorage.setItem('lingopro_assets', JSON.stringify(demoAssets));
    safeLocalStorage.setItem('lingopro_glossary', JSON.stringify(demoGlossary));
    safeLocalStorage.setItem('lingopro_styleguide', JSON.stringify(demoStyleguide));
    
    alert("Demo Environment Injected!");
    if (setView) setView(AppView.FILE_TRANSLATOR);
  };

  return (
    <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Quick Action */}
      <div className="relative p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-brand-xl overflow-hidden group bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-900 animate-gradient-xy border border-white/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6" title="Gemini 2.5 Live Audio Pipeline Active">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>Live audio active</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tighter">Scale Worldwide</h2>
          <p className="text-sm sm:text-lg text-indigo-100 mb-6 sm:mb-8 leading-relaxed font-medium opacity-90">Enterprise localization powered by Gemini Live API.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={() => setView?.(AppView.LIVE_INTERPRETER)}
              className="px-6 py-4 bg-white text-indigo-700 font-black rounded-xl shadow-brand-lg hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2 uppercase tracking-widest text-[10px] sm:text-xs min-h-[44px]"
              title="Start a real-time voice-to-voice interpretation session"
            >
              <i className="ph-fill ph-play-circle text-xl sm:text-2xl"></i>
              <span>Live Interpreter</span>
            </button>
            <button 
              onClick={injectDemoEnvironment}
              title="Populate the File Translator with expert demo assets and brand rules"
              className="px-6 py-4 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-white font-black rounded-xl shadow-brand-lg hover:bg-indigo-500/40 transition-all flex items-center justify-center space-x-2 uppercase tracking-widest text-[10px] sm:text-xs min-h-[44px]"
            >
              <i className="ph-bold ph-file-doc text-lg sm:text-xl"></i>
              <span>Studio Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`relative p-4 sm:p-8 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border-l-4 ${stat.color} border border-slate-200 dark:border-slate-800 shadow-brand-sm transition-all hover:-translate-y-1`} title={stat.tip}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg sm:rounded-xl text-xl">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</h3>
            <div className="flex items-baseline justify-between">
              <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
              <span className="text-[8px] font-bold text-emerald-500 hidden sm:inline" title="Performance trend compared to previous cycle">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden">
        <div className="px-5 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50/50 dark:bg-slate-800/50 gap-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Active Projects</h2>
          <button 
            onClick={() => setView?.(AppView.PROJECT_VIEW)}
            className="w-full sm:w-auto px-5 h-[40px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center"
            title="Open comprehensive project management console"
          >
            Project Explorer
          </button>
        </div>

        {/* Desktop: Standard Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">Project Name</th>
                <th className="px-8 py-4">Languages</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Progress</th>
                <th className="px-8 py-4">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentProjects.map((project) => (
                <tr key={project.id} className="h-[80px] hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group cursor-pointer" onClick={() => setView?.(AppView.FILE_TRANSLATOR)} title={`Manage ${project.name}`}>
                  <td className="px-8 py-4">
                    <span className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{project.name}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-3" title={`${project.sourceLang} source to ${project.targetLang} target`}>
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-500 uppercase">{project.sourceLang}</span>
                      <i className="ph-bold ph-arrow-right text-slate-300 animate-pulse"></i>
                      <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-indigo-600 uppercase">{project.targetLang}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      project.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="w-48" title={`${project.progress}% of total segments translated and approved`}>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000 progress-glow" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">{project.lastModified}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
