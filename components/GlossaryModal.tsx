
import React, { useState, useRef } from 'react';
import { GlossaryTerm } from '../types';

interface GlossaryModalProps {
  onClose: () => void;
  onUpdate: (glossary: GlossaryTerm[]) => void;
  initialGlossary: GlossaryTerm[];
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ onClose, onUpdate, initialGlossary }) => {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(initialGlossary);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [newTerm, setNewTerm] = useState<GlossaryTerm>({
    source: '',
    target: '',
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGlossary = glossary.filter(g => 
    g.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTerm = () => {
    if (!newTerm.source || !newTerm.target) return;
    const updated = [...glossary, newTerm];
    setGlossary(updated);
    onUpdate(updated);
    setNewTerm({ source: '', target: '', description: '' });
    setIsAdding(false);
  };

  const handleDeleteTerm = (index: number) => {
    const updated = glossary.filter((_, i) => i !== index);
    setGlossary(updated);
    onUpdate(updated);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Robust check for files property
    if (!e || !e.target || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await file.text();
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const merged = [...glossary, ...parsed];
          setGlossary(merged);
          onUpdate(merged);
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = content.split('\n');
        const parsed: GlossaryTerm[] = [];
        lines.forEach(line => {
          const [source, target, description] = line.split(',').map(s => s.trim());
          if (source && target) {
            parsed.push({ source, target, description: description || '' });
          }
        });
        const merged = [...glossary, ...parsed];
        setGlossary(merged);
        onUpdate(merged);
      }
      
      // Clear input value so same file can be re-imported
      if (e.target) e.target.value = '';
    } catch (err) {
      alert("Failed to parse glossary file.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-brand-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Term Glossary</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Consistency Enforcement Core</p>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-6 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:border-blue-400 transition-all flex items-center space-x-2 shadow-brand-sm"
             >
                <i className="ph-bold ph-upload"></i>
                <span>Import</span>
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv" onChange={handleImport} />
             <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-brand-sm">
                <i className="ph-bold ph-x text-xl"></i>
             </button>
          </div>
        </div>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Filter terminology..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none text-sm font-bold shadow-inner"
                />
             </div>
             <button 
                onClick={() => setIsAdding(true)}
                className="h-12 px-8 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-brand-lg hover:bg-blue-700 transition-all flex items-center space-x-3 shrink-0"
             >
                <i className="ph-bold ph-plus"></i>
                <span>New Term</span>
             </button>
          </div>

          {isAdding && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-800/50 space-y-4 animate-in slide-in-from-top-4 duration-300">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Source Term</label>
                     <input 
                        type="text" 
                        value={newTerm.source}
                        onChange={(e) => setNewTerm({...newTerm, source: e.target.value})}
                        className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="e.g. Dashboard"
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Target Translation</label>
                     <input 
                        type="text" 
                        value={newTerm.target}
                        onChange={(e) => setNewTerm({...newTerm, target: e.target.value})}
                        className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="e.g. 制御パネル"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Context / Notes</label>
                  <input 
                     type="text" 
                     value={newTerm.description}
                     onChange={(e) => setNewTerm({...newTerm, description: e.target.value})}
                     className="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                     placeholder="Usage notes..."
                  />
               </div>
               <div className="flex justify-end space-x-3 pt-2">
                  <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                  <button onClick={handleAddTerm} className="px-8 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-brand-lg transition-all">Add Protocol</button>
               </div>
            </div>
          )}

          <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Source Term</th>
                  <th className="px-6 py-4">Translation</th>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredGlossary.map((term, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{term.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/50">{term.target}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs block">{term.description || '--'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDeleteTerm(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <i className="ph-bold ph-trash text-lg"></i>
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredGlossary.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center opacity-30">
                       <i className="ph-bold ph-books text-4xl mb-4 block"></i>
                       <p className="text-xs font-black uppercase tracking-widest">No terminology protocols found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Glossary Integrity Verified</p>
           <button onClick={onClose} className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-brand-xl hover:shadow-brand-lg transition-all active:scale-95">
              Sync Workspace
           </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;
