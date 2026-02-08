
import React, { useState, useMemo } from 'react';
import { TranslationProject, AppView } from '../types';

interface ProjectExplorerProps {
  setView: (view: AppView) => void;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ setView }) => {
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed' | 'Pending'>('All');
  const [search, setSearch] = useState('');

  const projects: TranslationProject[] = [
    { id: '1', name: 'Q4 Product Catalog', sourceLang: 'English', targetLang: 'Spanish', status: 'In Progress', progress: 65, lastModified: '2h ago' },
    { id: '2', name: 'User Manual v2.1', sourceLang: 'German', targetLang: 'French', status: 'Completed', progress: 100, lastModified: '5h ago' },
    { id: '3', name: 'Marketing Campaign', sourceLang: 'English', targetLang: 'Japanese', status: 'Pending', progress: 0, lastModified: '1d ago' },
    { id: '4', name: 'Legal Terms of Service', sourceLang: 'English', targetLang: 'German', status: 'In Progress', progress: 30, lastModified: '2d ago' },
    { id: '5', name: 'Mobile App String File', sourceLang: 'English', targetLang: 'Italian', status: 'Completed', progress: 100, lastModified: '3d ago' },
    { id: '6', name: 'Technical Whitepaper', sourceLang: 'French', targetLang: 'Arabic', status: 'In Progress', progress: 45, lastModified: '4d ago' },
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesFilter = filter === 'All' || p.status === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.sourceLang.toLowerCase().includes(search.toLowerCase()) ||
                           p.targetLang.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Internal Home Navigation */}
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className="w-12 h-11 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-brand-sm flex items-center justify-center group"
            title="Back to Dashboard"
          >
            <i className="ph-bold ph-house text-xl group-hover:scale-110 transition-transform"></i>
          </button>
          
          {['All', 'In Progress', 'Completed', 'Pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-6 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                filter === f 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-brand-lg' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80">
          <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm font-bold shadow-brand-sm focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Project Information</th>
                <th className="px-8 py-5">Pair</th>
                <th className="px-8 py-5">Current Status</th>
                <th className="px-8 py-5">Health & Completion</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                  <td className="px-8 py-6">
                    <div>
                      <span className="block text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {project.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Last Active: {project.lastModified}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase">{project.sourceLang.substring(0, 3)}</span>
                      <i className="ph-bold ph-arrow-right text-slate-300"></i>
                      <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-indigo-600 uppercase">{project.targetLang.substring(0, 3)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      project.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                        <span>{project.progress}% Sync</span>
                        {project.progress === 100 && <i className="ph-bold ph-check-circle text-emerald-500"></i>}
                      </div>
                      <div className="w-40 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${project.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button onClick={() => setView(AppView.FILE_TRANSLATOR)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-colors shadow-brand-sm">
                          <i className="ph-bold ph-pencil-simple text-xl"></i>
                       </button>
                       <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-colors shadow-brand-sm">
                          <i className="ph-bold ph-dots-three-vertical text-xl"></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <i className="ph-bold ph-folder-open text-6xl mb-4"></i>
                      <p className="text-xs font-black uppercase tracking-widest">No matching projects found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Stats Overlay */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-brand-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
               <i className="ph ph-trend-up text-[120px]"></i>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Aggregate Velocity</h4>
            <p className="text-4xl font-black tracking-tighter mb-2">12.4k</p>
            <p className="text-xs font-medium opacity-80">Words localized in the last 24h across active nodes.</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Language Coverage</h4>
            <div className="flex -space-x-3">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {['EN', 'JP', 'ES', 'DE', '+8'][i-1]}
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Storage Quota</h4>
            <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2.4 GB / 10 GB</span>
               <span className="text-[10px] font-black text-indigo-600">Enterprise</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 w-1/4"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProjectExplorer;
