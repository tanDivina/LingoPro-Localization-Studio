import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { StyleguideRule, StyleguideDocument } from '../types';
import { geminiService } from '../services/geminiService';
import { safeLocalStorage } from '../utils/storage';

interface StyleguideConfigProps {
  onClose: () => void;
  onRulesUpdate?: (rules: StyleguideRule[]) => void;
}

const StyleguideConfig: React.FC<StyleguideConfigProps> = ({ onClose, onRulesUpdate }) => {
  const [rules, setRules] = useState<StyleguideRule[]>([]);
  const [docs, setDocs] = useState<StyleguideDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'docs'>('rules');
  const [newRule, setNewRule] = useState<Partial<StyleguideRule>>({
    type: 'prohibited_word',
    severity: 'Medium',
    pattern: '',
    description: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewRules, setReviewRules] = useState<StyleguideRule[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRules = safeLocalStorage.getItem('lingopro_styleguide');
    if (savedRules) {
      try { setRules(JSON.parse(savedRules)); } catch (e) {}
    }
    const savedDocs = safeLocalStorage.getItem('lingopro_styleguide_docs');
    if (savedDocs) {
      try { setDocs(JSON.parse(savedDocs)); } catch (e) {}
    }
  }, []);

  const saveState = (updatedRules: StyleguideRule[], updatedDocs: StyleguideDocument[]) => {
    setRules(updatedRules);
    setDocs(updatedDocs);
    safeLocalStorage.setItem('lingopro_styleguide', JSON.stringify(updatedRules));
    safeLocalStorage.setItem('lingopro_styleguide_docs', JSON.stringify(updatedDocs));
    if (onRulesUpdate) onRulesUpdate(updatedRules);
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
    
    saveState([...rules, rule], docs);
    setNewRule({ type: 'prohibited_word', severity: 'Medium', pattern: '', description: '' });
  };

  const deleteRule = (id: string) => {
    saveState(rules.filter(r => r.id !== id), docs);
  };

  const deleteDoc = (id: string) => {
    // Optionally delete associated rules
    const nextRules = rules.filter(r => r.sourceDocId !== id);
    saveState(nextRules, docs.filter(d => d.id !== id));
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setIsAnalyzing(true);

    try {
      let content = "";
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'docx') {
        const zip = await JSZip.loadAsync(file);
        const docXml = await zip.file("word/document.xml")?.async("string");
        if (docXml) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXml, "text/xml");
          content = Array.from(xmlDoc.getElementsByTagName('w:t')).map(n => n.textContent).join(' ');
        }
      } else {
        content = await file.text();
      }

      const extractedRules = await geminiService.analyzeStyleguideDocument(content);
      
      const newDoc: StyleguideDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        uploadedAt: new Date().toLocaleDateString(),
        size: file.size
      };

      setReviewRules(extractedRules.map(r => ({ ...r, sourceDocId: newDoc.id })));
      setDocs(prev => [...prev, newDoc]); // Temporarily add it for the context of current analysis
    } catch (err) {
      alert("Analysis failed. Please try a different format or smaller file.");
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const commitReviewRules = () => {
    // Only finalize the docs state here along with rules
    saveState([...rules, ...reviewRules], docs);
    setReviewRules([]);
    setActiveTab('rules');
  };

  const discardReview = () => {
    setReviewRules([]);
    // Remove the doc we just "provisionally" added if we discard
    const lastDoc = docs[docs.length - 1];
    if (lastDoc && lastDoc.id.startsWith('doc-')) {
       setDocs(docs.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-brand-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Brand Protocols</h3>
            <div className="flex items-center space-x-4 mt-1">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Linguistic Enforcement Engine</p>
               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
               <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{rules.length} Active Rules</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="h-11 px-6 bg-blue-600 text-white border border-blue-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-brand-xl disabled:opacity-30 active:scale-95"
             >
                <i className={`ph-bold ${isAnalyzing ? 'ph-spinner animate-spin' : 'ph-file-arrow-up'}`}></i>
                <span>{isAnalyzing ? 'Analyzing...' : 'Upload Style Guide'}</span>
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.txt,.pdf" onChange={handleDocumentUpload} />
             <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-brand-sm">
                <i className="ph-bold ph-x text-xl"></i>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Sidebar / Tabs & Manual Entry */}
          <div className="w-full lg:w-80 p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 space-y-8 overflow-y-auto no-scrollbar">
             
             <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Studio View</h4>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => setActiveTab('rules')} className={`h-10 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'rules' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Active Rules</button>
                   <button onClick={() => setActiveTab('docs')} className={`h-10 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'docs' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Knowledge Base</button>
                </div>
             </div>

             <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Rule Injection</h4>
                <div className="space-y-3">
                  <select 
                    value={newRule.type} 
                    onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 h-12 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                  >
                    <option value="prohibited_word">Prohibited Term</option>
                    <option value="mandatory_term">Mandatory Term</option>
                    <option value="tone_rule">Tone/Voice Rule</option>
                    <option value="formatting_rule">Formatting Rule</option>
                  </select>
                  <input 
                    type="text" 
                    value={newRule.pattern} 
                    onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 h-12 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    placeholder="Pattern (e.g. 'Flash')"
                  />
                  <input 
                    type="text" 
                    value={newRule.replacement} 
                    onChange={(e) => setNewRule({...newRule, replacement: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 h-12 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    placeholder="Replacement (Optional)"
                  />
                  <textarea 
                    value={newRule.description} 
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-bold resize-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    rows={4}
                    placeholder="Expert Rationale..."
                  />
                  <button 
                    onClick={addRule}
                    className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    Add to Protocols
                  </button>
                </div>
             </div>

             <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
               <div className="flex items-center space-x-2 mb-2">
                 <i className="ph-fill ph-sparkle text-blue-500"></i>
                 <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-tighter">AI Knowledge Hub</span>
               </div>
               <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                 "Upload your brand guidelines. LingoPro extracts rules and saves the source for continuous compliance."
               </p>
             </div>
          </div>

          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/10">
             
             {/* Review AI Extracted Rules */}
             {reviewRules.length > 0 && (
               <div className="space-y-6 animate-in zoom-in duration-500 bg-blue-600 p-8 rounded-[3rem] text-white shadow-brand-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <i className="ph-fill ph-brain text-[120px]"></i>
                  </div>
                  <div className="relative z-10 flex justify-between items-center mb-4">
                    <div>
                       <h4 className="text-xl font-black uppercase tracking-tighter">Neural Extraction Complete</h4>
                       <p className="text-[10px] font-bold text-blue-100 opacity-80 uppercase tracking-widest mt-1">Identified {reviewRules.length} Protocol Enhancements</p>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={discardReview} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Discard</button>
                      <button onClick={commitReviewRules} className="px-8 py-2 bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl transition-all hover:scale-105">Commit All Rules</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                     {reviewRules.map((r, i) => (
                       <div key={i} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-sm relative group">
                          <span className="absolute top-4 right-4 text-[8px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded">{r.type.split('_')[0]}</span>
                          <p className="text-xs font-black text-white mb-1">"{r.pattern}"</p>
                          <p className="text-[10px] text-blue-100 leading-tight italic opacity-80">{r.description}</p>
                          <button 
                            onClick={() => setReviewRules(reviewRules.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white text-red-500 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <i className="ph ph-x"></i>
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'rules' ? (
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Protocols</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rules.map((rule) => {
                      const sourceDoc = docs.find(d => d.id === rule.sourceDocId);
                      return (
                        <div key={rule.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-brand-sm group transition-all hover:border-blue-300 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col">
                                 <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest inline-block w-fit ${
                                   rule.severity === 'High' ? 'bg-red-500 text-white' : rule.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                 }`}>{rule.severity} Priority</span>
                                 {sourceDoc && (
                                   <span className="text-[8px] text-blue-500 font-bold uppercase mt-1">Source: {sourceDoc.name}</span>
                                 )}
                              </div>
                              <button onClick={() => deleteRule(rule.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <i className="ph-bold ph-trash-simple text-lg"></i>
                              </button>
                            </div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-2">
                               <span className="text-blue-500 font-black mr-2 opacity-50">/</span>
                               "{rule.pattern}"
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{rule.description}</p>
                            {rule.replacement && (
                              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                 <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Expert Fix</p>
                                 <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">"{rule.replacement}"</p>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                  {rules.length === 0 && !isAnalyzing && reviewRules.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center opacity-20 grayscale">
                       <i className="ph-bold ph-shield-slash text-6xl mb-4"></i>
                       <p className="text-xs font-black uppercase tracking-widest">No brand protocols defined</p>
                    </div>
                  )}
               </div>
             ) : (
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand Knowledge Base</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {docs.map((doc) => (
                      <div key={doc.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-brand-sm group transition-all hover:border-blue-300 flex items-center space-x-6">
                         <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner shrink-0">
                            <i className="ph-bold ph-file-doc text-2xl"></i>
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase tracking-tighter">{doc.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{doc.uploadedAt} • {(doc.size / 1024).toFixed(1)} KB</p>
                            <div className="flex items-center space-x-3 mt-3">
                               <span className="text-[8px] font-black text-emerald-500 uppercase flex items-center space-x-1">
                                  <i className="ph-fill ph-check-circle"></i>
                                  <span>Analyzed</span>
                               </span>
                               <button onClick={() => deleteDoc(doc.id)} className="text-[8px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors">Forget Document</button>
                            </div>
                         </div>
                      </div>
                    ))}
                    {docs.length === 0 && (
                      <div className="col-span-2 py-32 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                         <i className="ph-bold ph-folder-open text-6xl"></i>
                         <p className="text-xs font-black uppercase tracking-widest">No brand documents uploaded</p>
                         <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Click to upload your first reference</button>
                      </div>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleguideConfig;