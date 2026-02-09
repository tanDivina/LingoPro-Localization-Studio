
import React, { useState, useEffect, useRef } from 'react';
import { StyleguideRule } from '../types';
import { geminiService } from '../services/geminiService';
import { safeLocalStorage } from '../utils/storage';

interface StyleguideConfigProps {
  onClose: () => void;
  onRulesUpdate?: (rules: StyleguideRule[]) => void;
}

const StyleguideConfig: React.FC<StyleguideConfigProps> = ({ onClose, onRulesUpdate }) => {
  const [rules, setRules] = useState<StyleguideRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<StyleguideRule>>({
    type: 'prohibited_word',
    severity: 'Medium',
    pattern: '',
    description: ''
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = safeLocalStorage.getItem('lingopro_styleguide');
    if (saved) {
      try { setRules(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveRules = (updated: StyleguideRule[]) => {
    setRules(updated);
    safeLocalStorage.setItem('lingopro_styleguide', JSON.stringify(updated));
    if (onRulesUpdate) onRulesUpdate(updated);
  };

  const addRule = () => {
    if (!newRule.pattern?.trim() || !newRule.description?.trim()) {
      alert("Please provide pattern and description.");
      return;
    }
    
    const rule: StyleguideRule = {
      id: Date.now().toString(),
      type: newRule.type as any,
      pattern: newRule.pattern,
      replacement: newRule.replacement,
      description: newRule.description,
      severity: newRule.severity as any
    };
    
    saveRules([...rules, rule]);
    setNewRule({ type: 'prohibited_word', severity: 'Medium', pattern: '', description: '' });
  };

  const deleteRule = (id: string) => {
    saveRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-md sm:rounded-lg shadow-brand-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Brand Protocols</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <i className="ph-bold ph-x text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-80 p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 space-y-6 overflow-y-auto">
             <div className="space-y-4">
                <input 
                  type="text" 
                  value={newRule.pattern} 
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 h-[44px] text-xs font-bold"
                  placeholder="Prohibited Term"
                />
                <textarea 
                  value={newRule.description} 
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-bold resize-none"
                  rows={3}
                  placeholder="Rationale..."
                />
                <button 
                  onClick={addRule}
                  className="w-full h-[44px] bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-brand-md"
                >
                  Append Rule
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
             {rules.map((rule) => (
               <div key={rule.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="min-w-0">
                     <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">"{rule.pattern}"</p>
                     <p className="text-[10px] text-slate-400 truncate">{rule.description}</p>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-300 hover:text-red-500">
                    <i className="ph-bold ph-trash text-lg"></i>
                  </button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleguideConfig;
