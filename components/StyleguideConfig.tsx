
import React, { useState, useEffect, useRef } from 'react';
import { StyleguideRule } from '../types';
import { geminiService } from '../services/geminiService';

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
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lingopro_styleguide');
    if (saved) {
      try { setRules(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveRules = (updated: StyleguideRule[]) => {
    setRules(updated);
    localStorage.setItem('lingopro_styleguide', JSON.stringify(updated));
    if (onRulesUpdate) onRulesUpdate(updated);
  };

  const addRule = () => {
    if (!newRule.pattern?.trim() || !newRule.description?.trim()) {
      alert("Please provide both a pattern/subject and a description for the rule.");
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
    setNewRule({ 
      type: 'prohibited_word', 
      severity: 'Medium',
      pattern: '',
      description: ''
    });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteRule = (id: string) => {
    saveRules(rules.filter(r => r.id !== id));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      const extractedRules = await geminiService.parseStyleguideContent(content);
      
      if (extractedRules.length > 0) {
        saveRules([...rules, ...extractedRules]);
        alert(`Successfully extracted ${extractedRules.length} brand protocols.`);
      } else {
        alert("No clear brand rules could be identified in the document.");
      }
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to process document. Ensure it is a valid text file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {showToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-xs flex items-center space-x-3 animate-in slide-in-from-top-4">
          <i className="ph-bold ph-check-circle text-lg"></i>
          <span>Rule Synced to Guard</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <i className="ph-bold ph-shield-check text-2xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Brand Enforcement Guard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define linguistic and stylistic boundaries</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-emerald-500 transition-all disabled:opacity-50"
            >
              {isImporting ? <i className="ph-bold ph-circle-notch animate-spin"></i> : <i className="ph-bold ph-upload-simple"></i>}
              <span>{isImporting ? 'Analyzing...' : 'Import Document'}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.docx" />
            
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <i className="ph-bold ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-80 p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 space-y-6 overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">New Protocol Rule</h4>
              <p className="text-[9px] text-slate-400 leading-tight">Manually define or refine extracted rules here.</p>
            </div>
            
            <div className="space-y-4 pb-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Rule Type</label>
                <select 
                  value={newRule.type} 
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                >
                  <option value="prohibited_word">Prohibited Word</option>
                  <option value="mandatory_term">Mandatory Term</option>
                  <option value="tone_rule">Tone of Voice</option>
                  <option value="formatting_rule">Formatting Style</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pattern/Subject</label>
                <input 
                  type="text" 
                  value={newRule.pattern || ''} 
                  onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  placeholder="e.g. 'Cheap' or 'Active Tone'"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Description/Correction</label>
                <textarea 
                  value={newRule.description || ''} 
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none resize-none"
                  rows={3}
                  placeholder="Explain why this rule exists..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Enforcement Severity</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(s => (
                    <button 
                      key={s}
                      type="button"
                      onClick={() => setNewRule({...newRule, severity: s as any})}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                        newRule.severity === s ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="button"
                onClick={addRule}
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-[10px] tracking-widest uppercase shadow-xl"
              >
                Sync to Guard
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-white dark:bg-slate-900">
            <div className="space-y-4">
              {rules.length > 0 ? rules.map((rule) => (
                <div key={rule.id} className="group p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start justify-between transition-all hover:border-emerald-300">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      rule.severity === 'High' ? 'bg-red-500/10 text-red-500' : 
                      rule.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      <i className={`ph-bold ${
                        rule.type === 'prohibited_word' ? 'ph-prohibit' : 
                        rule.type === 'mandatory_term' ? 'ph-check-circle' : 'ph-waveform'
                      } text-xl`}></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rule.type.replace('_', ' ')}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          rule.severity === 'High' ? 'bg-red-100 text-red-700' : 
                          rule.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>{rule.severity}</span>
                        {rule.id.startsWith('ext-') && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">AI EXTRACTED</span>
                        )}
                      </div>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">"{rule.pattern}"</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{rule.description}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <i className="ph-bold ph-trash text-xl"></i>
                  </button>
                </div>
              )) : (
                <div className="py-24 text-center space-y-4 opacity-30">
                  <i className="ph-bold ph-shield-slash text-6xl"></i>
                  <p className="text-xs font-black uppercase tracking-widest">No Active Brand Protocols</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleguideConfig;
