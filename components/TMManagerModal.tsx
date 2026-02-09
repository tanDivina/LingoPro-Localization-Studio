
import React, { useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/storage';

interface TMManagerModalProps {
  onClose: () => void;
}

const TMManagerModal: React.FC<TMManagerModalProps> = ({ onClose }) => {
  const [tm, setTm] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedTm = safeLocalStorage.getItem('lingopro_tm');
    if (savedTm) {
      try {
        setTm(JSON.parse(savedTm));
      } catch (e) {
        console.error("Failed to parse TM", e);
      }
    }
  }, []);

  const saveTm = (updated: Record<string, string>) => {
    setTm(updated);
    safeLocalStorage.setItem('lingopro_tm', JSON.stringify(updated));
  };

  const deleteEntry = (source: string) => {
    const next = { ...tm };
    delete next[source];
    saveTm(next);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to permanently clear the local Translation Memory? This cannot be undone.")) {
      saveTm({});
    }
  };

  const filteredEntries = Object.entries(tm).filter(([source, target]: [string, string]) => 
    source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[85vh] rounded-[3rem] shadow-brand-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i className="ph-bold ph-database text-2xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Local Translation Memory</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Browser-Persisted Linguistic Cache</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={clearAll}
                className="h-11 px-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center space-x-2"
             >
                <i className="ph-bold ph-trash"></i>
                <span>Wipe Cache</span>
             </button>
             <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-colors shadow-brand-sm">
                <i className="ph-bold ph-x text-xl"></i>
             </button>
          </div>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
             <div className="relative flex-1 w-full">
                <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Search memory segments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 h-14 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold shadow-inner"
                />
             </div>
             <div className="flex items-center space-x-4 shrink-0 px-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entries:</span>
                <span className="text-xl font-black text-blue-600">{Object.keys(tm).length}</span>
             </div>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5">Source Master</th>
                  <th className="px-8 py-5">Target Locale</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredEntries.map(([source, target], i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-8 py-6 w-1/2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{source}</p>
                    </td>
                    <td className="px-8 py-6 w-1/2">
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-sm font-black text-blue-700 dark:text-blue-300 leading-relaxed">{target}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button onClick={() => deleteEntry(source)} className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete entry from local storage">
                          <i className="ph-bold ph-trash-simple text-xl"></i>
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-32 text-center opacity-30">
                       <i className="ph-bold ph-database text-6xl mb-6 block"></i>
                       <p className="text-sm font-black uppercase tracking-widest leading-loose">The browser cache is currently empty.<br />Approve segments in the studio to build your TM.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
           <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Persistence Synchronized</p>
           </div>
           <div className="flex space-x-4">
             <button className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-blue-400 transition-all shadow-sm">Export TMX</button>
             <button onClick={onClose} className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-brand-xl hover:-translate-y-1 transition-all active:scale-95">Close Manager</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TMManagerModal;
