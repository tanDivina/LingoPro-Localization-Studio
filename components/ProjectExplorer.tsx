
import React, { useState, useEffect, useMemo } from 'react';
import { TranslationProject, AppView, LocalizationAsset } from '../types';
import { safeLocalStorage } from '../utils/storage';

interface ProjectExplorerProps {
  setView: (view: AppView) => void;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ setView }) => {
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed' | 'Pending'>('All');
  const [search, setSearch] = useState('');
  const [realAssets, setRealAssets] = useState<LocalizationAsset[]>([]);
  const [storageStats, setStorageStats] = useState({ used: 0, quota: 0 });

  useEffect(() => {
    const savedAssets = safeLocalStorage.getItem('lingopro_assets');
    if (savedAssets) try { setRealAssets(JSON.parse(savedAssets)); } catch (e) {}
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorageStats({ used: estimate.usage || 0, quota: estimate.quota || 0 });
      });
    }
  }, []);

  const projects: TranslationProject[] = useMemo(() => {
    return realAssets.map(asset => ({
      id: asset.id, name: asset.name, sourceLang: 'Auto', targetLang: 'Target',
      status: asset.status === 'completed' ? 'Completed' : asset.status === 'translating' ? 'In Progress' : 'Pending',
      progress: asset.status === 'completed' ? 100 : 45,
      verificationProgress: asset.status === 'completed' ? 100 : 12, // HITL metric
      lastModified: 'Recent'
    }));
  }, [realAssets]);

  const workspaceSize = useMemo(() => realAssets.reduce((acc, a) => acc + (a.size || 0), 0), [realAssets]);
  const formatSize = (b: number) => b === 0 ? '0 B' : (b / 1024 / 1024).toFixed(2) + ' MB';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setView(AppView.DASHBOARD)} className="w-12 h-11 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 flex items-center justify-center shadow-brand-sm"><i className="ph-bold ph-house text-xl"></i></button>
          {['All', 'In Progress', 'Completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-6 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${filter === f ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>{f}</button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-6 h-11 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl outline-none text-sm font-bold shadow-sm" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Project Name</th>
                <th className="px-8 py-5">AI Progress</th>
                <th className="px-8 py-5">Human Verification</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setView(AppView.FILE_TRANSLATOR)}>
                  <td className="px-8 py-6">
                    <span className="block text-base font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Locale: {p.targetLang}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                       <span className={`text-[10px] font-black ${p.verificationProgress > 50 ? 'text-emerald-500' : 'text-amber-500'}`}>{p.verificationProgress}% Verified</span>
                       <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${p.verificationProgress > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${p.verificationProgress}%` }}></div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Open Studio</button>
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
export default ProjectExplorer;
