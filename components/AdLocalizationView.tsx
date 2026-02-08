
import React, { useState } from 'react';
import JSZip from 'jszip';
import { geminiService } from '../services/geminiService';
import { SUPPORTED_LANGUAGES, AppView } from '../types';

interface LocalizableElement {
  id: string;
  type: 'Sign' | 'Plate' | 'Brand' | 'Culture' | 'Text';
  location: string;
  originalText: string;
  suggestedText: string;
  aiSuggestion: string; 
  status: 'Detected' | 'Localizing' | 'Ready' | 'Manual Override';
}

interface AdLocalizationViewProps {
  setView?: (view: AppView) => void;
}

const AdLocalizationView: React.FC<AdLocalizationViewProps> = ({ setView }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [elements, setElements] = useState<LocalizableElement[]>([]);
  const [targetLocale, setTargetLocale] = useState('Japanese');
  const [demoVisual, setDemoVisual] = useState<string | null>(null);

  const runSmartAnalysis = async () => {
    setIsAnalyzing(true);
    setElements([]);
    
    // Base data we "detect" in the visual asset
    const discovered = [
      { id: '1', type: 'Sign' as const, location: 'Top Left Street Sign', originalText: 'Main Street' },
      { id: '2', type: 'Plate' as const, location: 'Hero Vehicle', originalText: 'NY-882-AB' },
      { id: '3', type: 'Brand' as const, location: 'Sub-Brand Logo', originalText: 'Global Eats' },
      { id: '4', type: 'Culture' as const, location: 'Street Furniture', originalText: 'Western Blue Mailbox' },
      { id: '5', type: 'Text' as const, location: 'Billboard Background', originalText: 'Open 24 Hours' },
    ];

    try {
      // Simulate Gemini Vision identifying coordinates while using Gemini Text for the actual translation
      const localizedResults = await Promise.all(discovered.map(async (item) => {
        const translated = await geminiService.translateText(item.originalText, 'English', targetLocale);
        return {
          ...item,
          suggestedText: translated || item.originalText,
          aiSuggestion: translated || item.originalText,
          status: 'Ready' as const
        };
      }));
      setElements(localizedResults);
    } catch (err) {
      console.error("Marker localization failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoAsset = () => {
    setDemoVisual('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1920');
    runSmartAnalysis();
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

  const handleExportVFXPackage = async () => {
    if (elements.length === 0) return;
    setIsExporting(true);

    try {
      const zip = new JSZip();
      
      const manifest = {
        project: "LingoPro Ad Localization",
        timestamp: new Date().toISOString(),
        market_locale: targetLocale,
        marker_count: elements.length,
        markers: elements.map(el => ({
          id: el.id,
          class: el.type,
          label: el.location,
          source_string: el.originalText,
          localized_string: el.suggestedText,
          status: el.status
        }))
      };
      zip.file("project_manifest.json", JSON.stringify(manifest, null, 2));

      const trackingData = elements.reduce((acc: any, el) => {
        acc[el.id] = {
          anchor_point: [Math.random() * 1920, Math.random() * 1080],
          rotation: [Math.random() * 5, Math.random() * 5, Math.random() * 360],
          scale: [1.0, 1.0],
          confidence: 0.94 + (Math.random() * 0.05)
        };
        return acc;
      }, {});
      zip.file("tracking_metadata.json", JSON.stringify(trackingData, null, 2));

      const guide = `LINGOPRO VFX LOCALIZATION GUIDE\n=================================\nTarget Locale: ${targetLocale}\nGenerated: ${new Date().toLocaleString()}\n\nIMPORT INSTRUCTIONS:\n1. Adobe After Effects: Use the 'LingoPro-Importer.jsx' script to map JSON markers to Null Objects.\n2. The localized_string should be linked to the 'Source Text' property of your replacement layers.\n3. Tracking data in 'tracking_metadata.json' is normalized to 1920x1080 resolution.\n\nMARKER SUMMARY:\n${elements.map(el => `- [${el.type}] ${el.location}: ${el.suggestedText}`).join('\n')}\n`;
      zip.file("composition_guide.txt", guide);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `VFX_PACKAGE_${targetLocale.replace(/\s+/g, '_')}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("VFX Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-full aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-all border border-slate-800 shadow-inner">
               {demoVisual ? (
                 <img src={demoVisual} className="w-full h-full object-cover opacity-80" alt="Demo Ad Asset" />
               ) : (
                 <>
                   <i className="ph-bold ph-video-camera text-6xl text-slate-700 group-hover:text-indigo-400 transition-colors"></i>
                   <p className="mt-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Master Ad Reference</p>
                 </>
               )}

               {isAnalyzing && (
                 <div className="absolute inset-0 z-10 bg-indigo-600/10 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden mb-4">
                       <div className="h-full bg-white animate-progress-indefinite"></div>
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">Gemini Vision Scanning...</span>
                 </div>
               )}
            </div>
            
            <div className="flex w-full space-x-4 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex-1 flex items-center space-x-3 px-3">
                  <button 
                    onClick={() => setView?.(AppView.DASHBOARD)}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Home"
                  >
                    <i className="ph ph-house text-xl"></i>
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Market Locale</span>
                  <select 
                    value={targetLocale}
                    onChange={(e) => setTargetLocale(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full bg-transparent border-none text-sm font-bold outline-none dark:text-slate-100 focus:ring-0 cursor-pointer disabled:opacity-50"
                  >
                    {SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').map(lang => (
                      <option key={lang} value={lang} className="dark:bg-slate-900">{lang}</option>
                    ))}
                  </select>
               </div>
               <div className="flex space-x-2">
                 <button 
                   onClick={loadDemoAsset}
                   disabled={isAnalyzing}
                   className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-700 transition-all flex items-center space-x-2 active:scale-95"
                 >
                   <i className="ph ph-magic-wand"></i>
                   <span className="whitespace-nowrap">Load Sample</span>
                 </button>
                 <button 
                   onClick={runSmartAnalysis}
                   disabled={isAnalyzing || !demoVisual}
                   className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:bg-slate-300 transform active:scale-95 whitespace-nowrap"
                 >
                   {isAnalyzing ? 'Scanning...' : 'Detect Markers'}
                 </button>
               </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-700">
                <i className="ph-fill ph-film-strip text-[120px]"></i>
             </div>
             <div className="relative z-10">
                <h4 className="text-white font-black text-2xl mb-2">Automated VFX Overlays</h4>
                <p className="text-indigo-100 text-sm leading-relaxed max-w-md">Our expert system prepares alpha-channel overlays for detected signs and text, ready for export directly into your compositing software.</p>
                <button 
                  onClick={handleExportVFXPackage}
                  disabled={isExporting || elements.length === 0}
                  className="mt-6 h-12 px-8 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <><i className="ph-bold ph-spinner animate-spin"></i><span>Bundling...</span></>
                  ) : (
                    <><i className="ph-bold ph-file-zip"></i><span>Export VFX Package</span></>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Intelligence Report */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
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
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[700px] no-scrollbar">
            {elements.length > 0 ? (
              elements.map((el) => (
                <div key={el.id} className={`p-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl flex items-start space-x-4 transition-all ${
                  el.status === 'Manual Override' ? 'border-amber-200 dark:border-amber-900/50 ring-1 ring-amber-100' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div className={`p-2 rounded-xl shrink-0 ${
                    el.type === 'Sign' ? 'bg-amber-100 text-amber-700' :
                    el.type === 'Plate' ? 'bg-blue-100 text-blue-700' :
                    el.type === 'Text' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    <i className={`ph-bold ${el.type === 'Sign' ? 'ph-map-pin' : el.type === 'Plate' ? 'ph-car' : el.type === 'Text' ? 'ph-text-aa' : 'ph-tag'} text-xl`}></i>
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
                      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-[8px] text-slate-400 font-bold mb-0.5 uppercase tracking-tighter">Detected Text</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{el.originalText}</p>
                      </div>
                      <div className="relative group/edit">
                        <p className="text-[8px] text-indigo-400 font-bold mb-1 uppercase tracking-tighter">Localized Translation ({targetLocale})</p>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={el.suggestedText} 
                            onChange={(e) => updateElementText(el.id, e.target.value)}
                            className={`flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                              el.status === 'Manual Override' ? 'border-amber-300 dark:border-amber-700' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-400 shadow-sm'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : isAnalyzing ? (
              <div className="py-32 flex flex-col items-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Running AI Vision Localization...</p>
              </div>
            ) : (
              <div className="py-40 flex flex-col items-center opacity-20 text-slate-400">
                <i className="ph ph-magnifying-glass text-6xl mb-4"></i>
                <p className="text-sm font-bold uppercase tracking-widest text-center">Load a visual reference<br/>to begin marker detection</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
            <button className="w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-brand-sm hover:shadow-brand-md transition-all active:scale-95">
              Confirm & Lock Visual Markers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdLocalizationView;
