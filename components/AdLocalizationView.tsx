
import React, { useState } from 'react';

interface LocalizableElement {
  id: string;
  type: 'Sign' | 'Plate' | 'Brand' | 'Culture' | 'Text';
  location: string;
  originalText: string;
  suggestedText: string;
  aiSuggestion: string; // Store original AI suggestion for reset capability
  status: 'Detected' | 'Localizing' | 'Ready' | 'Manual Override';
}

const AdLocalizationView: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elements, setElements] = useState<LocalizableElement[]>([]);
  const [targetLocale, setTargetLocale] = useState('Japanese (Tokyo)');

  const runSmartAnalysis = () => {
    setIsAnalyzing(true);
    setElements([]);
    
    // Simulate Gemini 2.5 Flash Vision analysis
    setTimeout(() => {
      setElements([
        { id: '1', type: 'Sign', location: 'Top Left Street Sign', originalText: 'Main Street', suggestedText: '中央通り (Chuo-dori)', aiSuggestion: '中央通り (Chuo-dori)', status: 'Ready' },
        { id: '2', type: 'Plate', location: 'Hero Vehicle', originalText: 'NY-882-AB', suggestedText: '品川 500 あ 12-34', aiSuggestion: '品川 500 あ 12-34', status: 'Ready' },
        { id: '3', type: 'Brand', location: 'Sub-Brand Logo', originalText: 'Global Eats', suggestedText: 'グローバル・イーツ', aiSuggestion: 'グローバル・イーツ', status: 'Ready' },
        { id: '4', type: 'Culture', location: 'Street Furniture', originalText: 'Western Blue Mailbox', suggestedText: 'Red JP Post Pillar Box', aiSuggestion: 'Red JP Post Pillar Box', status: 'Detected' },
        { id: '5', type: 'Text', location: 'Billboard Background', originalText: 'Open 24 Hours', suggestedText: '24時間営業', aiSuggestion: '24時間営業', status: 'Ready' },
      ]);
      setIsAnalyzing(false);
    }, 2500);
  };

  const updateElementText = (id: string, newText: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { 
          ...el, 
          suggestedText: newText, 
          status: newText === el.aiSuggestion ? 'Ready' : 'Manual Override' 
        };
      }
      return el;
    }));
  };

  const resetElement = (id: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, suggestedText: el.aiSuggestion, status: 'Ready' };
      }
      return el;
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Visual Asset Dropzone */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-full aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-all border border-slate-800">
               {isAnalyzing && (
                 <div className="absolute inset-0 z-10 bg-indigo-600/10 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                       <div className="h-full bg-white animate-progress-indefinite"></div>
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">Gemini Vision Scanning...</span>
                 </div>
               )}
               <svg className="w-16 h-16 text-slate-700 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <p className="mt-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Master Ad Reference</p>
               <button className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-slate-700 transition-all border border-slate-700">Browse Asset</button>
            </div>
            
            <div className="flex w-full space-x-4 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex-1 flex items-center space-x-3 px-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Market Locale</span>
                  <input 
                    type="text" 
                    value={targetLocale}
                    onChange={(e) => setTargetLocale(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-bold outline-none dark:text-slate-100 focus:ring-0"
                    placeholder="e.g. Japan (Tokyo)"
                  />
               </div>
               <button 
                 onClick={runSmartAnalysis}
                 disabled={isAnalyzing}
                 className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:bg-slate-300 transform active:scale-95"
               >
                 {isAnalyzing ? 'Scanning...' : 'Detect Markers'}
               </button>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-8 -translate-y-8">
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
             </div>
             <div className="relative z-10">
                <h4 className="text-white font-black text-2xl mb-2">Automated VFX Overlays</h4>
                <p className="text-indigo-100 text-sm leading-relaxed max-w-md">Our expert system prepares alpha-channel overlays for detected signs and text, ready for export directly into your compositing software (After Effects, Nuke, Flame).</p>
                <button className="mt-6 px-6 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-md">Export VFX Package</button>
             </div>
          </div>
        </div>

        {/* Intelligence Report */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Marker Diarization</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Visual elements identified for market adaptation.</p>
            </div>
            {elements.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {elements.length} Markers Found
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[700px]">
            {elements.length > 0 ? (
              elements.map((el) => (
                <div key={el.id} className={`p-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl flex items-start space-x-4 transition-all ${
                  el.status === 'Manual Override' ? 'border-amber-200 dark:border-amber-900/50 ring-1 ring-amber-100 dark:ring-amber-900/10' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div className={`p-2 rounded-xl shrink-0 ${
                    el.type === 'Sign' ? 'bg-amber-100 text-amber-700' :
                    el.type === 'Plate' ? 'bg-blue-100 text-blue-700' :
                    el.type === 'Text' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {el.type === 'Sign' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg> : 
                     el.type === 'Plate' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> :
                     el.type === 'Text' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5l-1.043 2.5m6.043-2.5l1.043 2.5" /></svg> :
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate mr-2">{el.type} • {el.location}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        el.status === 'Ready' ? 'bg-green-100 text-green-700' : 
                        el.status === 'Manual Override' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}>{el.status}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] text-slate-400 font-bold mb-0.5 uppercase tracking-tighter">Detected Text</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{el.originalText}</p>
                      </div>
                      <div className="relative group/edit">
                        <p className="text-[8px] text-indigo-400 font-bold mb-1 uppercase tracking-tighter">Localized Translation</p>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={el.suggestedText} 
                            onChange={(e) => updateElementText(el.id, e.target.value)}
                            className={`flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                              el.status === 'Manual Override' ? 'border-amber-300 dark:border-amber-700' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-400'
                            }`}
                            placeholder="Type override..."
                          />
                          {el.status === 'Manual Override' && (
                            <button 
                              onClick={() => resetElement(el.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Reset to AI Suggestion"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : isAnalyzing ? (
              <div className="py-32 flex flex-col items-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Running Vision Context Analysis...</p>
              </div>
            ) : (
              <div className="py-40 flex flex-col items-center opacity-20 text-slate-400">
                <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <p className="text-sm font-bold uppercase tracking-widest">Awaiting Smart Scan</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
            <button className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md transition-all active:scale-95">
              Confirm & Save Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdLocalizationView;
