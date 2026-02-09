
import React, { useState, useEffect, useMemo } from 'react';
import { TranslationProject, AppView, GlossaryTerm, StyleguideRule, LocalizationAsset } from '../types';
import { safeLocalStorage } from '../utils/storage';

interface DashboardProps {
  setView?: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [assets, setAssets] = useState<LocalizationAsset[]>([]);
  const [tm, setTm] = useState<Record<string, string>>({});
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);

  useEffect(() => {
    const savedAssets = safeLocalStorage.getItem('lingopro_assets');
    const savedTm = safeLocalStorage.getItem('lingopro_tm');
    const savedGlossary = safeLocalStorage.getItem('lingopro_glossary');
    if (savedAssets) try { setAssets(JSON.parse(savedAssets)); } catch (e) {}
    if (savedTm) try { setTm(JSON.parse(savedTm)); } catch (e) {}
    if (savedGlossary) try { setGlossary(JSON.parse(savedGlossary)); } catch (e) {}
  }, []);

  const totalWords = useMemo(() => Object.keys(tm).reduce((acc, s) => acc + (s.trim().split(/\s+/).length || 0), 0), [tm]);

  const stats = [
    { label: 'Linguistic Cache', value: `${(totalWords / 1000).toFixed(1)}k`, sub: 'Verified in TM', color: 'border-l-blue-600', icon: <i className="ph-bold ph-database"></i> },
    { label: 'Human Oversight', value: '74%', sub: 'Sign-off rate', color: 'border-l-emerald-500', icon: <i className="ph-bold ph-user-check"></i>, tip: 'Percentage of active translations verified by a human expert.' },
    { label: 'Terminology', value: glossary.length.toString(), sub: 'Fixed Protocols', color: 'border-l-sky-500', icon: <i className="ph-bold ph-books"></i> },
    { label: 'Review Queue', value: '12', sub: 'Low Confidence', color: 'border-l-amber-500', icon: <i className="ph-bold ph-warning-circle"></i>, tip: 'Segments requiring immediate human intervention.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative p-10 rounded-[3rem] shadow-brand-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border border-white/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>
            <span>Human-AI Loop Active</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Orchestrate Global Meaning</h2>
          <p className="text-lg text-blue-100 mb-8 leading-relaxed font-medium opacity-90">Expert-driven localization. AI generates the foundation; you define the nuance.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setView?.(AppView.FILE_TRANSLATOR)} className="px-10 py-4 bg-white text-blue-700 font-black rounded-2xl shadow-brand-lg hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 uppercase tracking-widest text-xs min-h-[48px]">
              <i className="ph-bold ph-pencil-line text-xl"></i>
              <span>Enter Verification Studio</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`relative p-8 bg-white dark:bg-slate-900 rounded-3xl border-l-4 ${stat.color} border border-slate-200 dark:border-slate-800 shadow-brand-sm transition-all hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-2xl">{stat.icon}</div>
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
