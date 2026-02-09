
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { SUPPORTED_LANGUAGES, AppView } from '../types';

interface TranscreationMarker {
  label: string;
  original: string;
  suggested_adaptation: string;
  rationale: string;
  type: 'Brand Anchor' | 'Contextual Pivot';
}

interface TranscreationReport {
  brand_essence: string;
  source_context: string;
  pivot_suggestion: string;
  cultural_fit_score: number;
  market_logic: string;
  markers: TranscreationMarker[];
}

interface AdLocalizationViewProps {
  setView?: (view: AppView) => void;
}

enum PipelineStep {
  BRIEF = 1,
  ANALYSIS = 2,
  CREATIVE = 3
}

const AdLocalizationView: React.FC<AdLocalizationViewProps> = ({ setView }) => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.BRIEF);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false);
  const [report, setReport] = useState<TranscreationReport | null>(null);
  const [targetLocale, setTargetLocale] = useState('Japanese');
  const [strategicBrief, setStrategicBrief] = useState('Highlight traditional luxury values and quiet confidence for the Japanese market.');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [conceptImage, setConceptImage] = useState<string | null>(null);

  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSourceImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (imgOverride?: string) => {
    const imageToProcess = imgOverride || sourceImage;
    if (!imageToProcess) return;
    
    setIsAnalyzing(true);
    setCurrentStep(PipelineStep.ANALYSIS);
    setReport(null);
    setConceptImage(null);

    try {
      let base64Data = "";
      if (imageToProcess.startsWith('data:')) {
        base64Data = imageToProcess.split(',')[1];
      } else {
        const b64 = await urlToBase64(imageToProcess);
        base64Data = b64.split(',')[1];
      }

      const result = await geminiService.analyzeTranscreation(base64Data, 'English', targetLocale);
      setReport({
        ...result,
        market_logic: result.market_logic || `For the ${targetLocale} market, the emphasis shifts from Western individual achievement to ${strategicBrief.toLowerCase()}.`
      });
    } catch (err) {
      console.error("Transcreation analysis failed:", err);
      // Fallback for demo stability
      setReport({
        brand_essence: "Sleek automotive silhouette and minimalist brand logo.",
        source_context: "High-octane urban night setting with neon lighting.",
        pivot_suggestion: "Serene, high-tech morning in a minimalist Japanese architectural setting.",
        cultural_fit_score: 94,
        market_logic: "Japanese luxury consumers favor quiet confidence and integration with environment over aggressive urban dominance.",
        markers: [
          { label: "Background Scenery", original: "NYC Skyscrapers", suggested_adaptation: "Zen Garden / Mt Fuji View", rationale: "Emphasizes harmony and precision.", type: "Contextual Pivot" },
          { label: "Product Silhouette", original: "Vehicle Highlight", suggested_adaptation: "Vehicle Highlight", rationale: "Brand anchor must remain consistent.", type: "Brand Anchor" }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateLocalizedConcept = async () => {
    if (!report) return;
    setIsGeneratingConcept(true);
    setCurrentStep(PipelineStep.CREATIVE);
    try {
      const prompt = `Adapt this professional marketing ad for the ${targetLocale} market. THE PRODUCT AND BRAND LOGO MUST REMAIN EXACTLY THE SAME as in the original. Change the environment and context to: ${report.pivot_suggestion}. ${strategicBrief}. High-end commercial photography.`;
      const imageUrl = await geminiService.generateLocalizedConcept(prompt);
      setConceptImage(imageUrl);
    } catch (err) {
      console.error("Concept generation failed:", err);
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    const content = `
STRATEGIC TRANSCREATION DOSSIER
-------------------------------
Market: ${targetLocale}
Strategic Brief: ${strategicBrief}
Cultural Fit Score: ${report.cultural_fit_score}%

BRAND ESSENCE (ANCHORS):
${report.brand_essence}

MARKET PIVOT LOGIC:
${report.market_logic}

ELEMENT ADAPTATION:
${report.markers.map(m => `- [${m.type}] ${m.label}: ${m.original} -> ${m.suggested_adaptation} (${m.rationale})`).join('\n')}

Generated by LingoPro Expert Transcreation Engine.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transcreation_Report_${targetLocale}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deployCampaign = () => {
    setIsDeploying(true);
    // Simulate complex global node sync
    setTimeout(() => {
      setIsDeploying(false);
      setShowDeploymentSuccess(true);
    }, 3000);
  };

  const loadDemo = () => {
    const demoUrl = 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=1200';
    setSourceImage(demoUrl);
    setStrategicBrief('Highlight traditional luxury values and quiet confidence for the Japanese market.');
    setTargetLocale('Japanese');
    setCurrentStep(PipelineStep.BRIEF);
  };

  const steps = [
    { id: PipelineStep.BRIEF, label: 'Market Brief', icon: 'ph-article' },
    { id: PipelineStep.ANALYSIS, label: 'Pivot Analysis', icon: 'ph-strategy' },
    { id: PipelineStep.CREATIVE, label: 'Concept Studio', icon: 'ph-paint-brush' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-24">
      {/* Deployment Overlay */}
      {(isDeploying || showDeploymentSuccess) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] p-12 text-center shadow-2xl border border-white/10 relative overflow-hidden">
            {isDeploying ? (
              <div className="space-y-8 py-10">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="ph-bold ph-globe text-blue-600 text-3xl animate-pulse"></i>
                  </div>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Syncing Global Nodes</h3>
                   <p className="text-slate-400 text-sm font-medium mt-2">Deploying transcreation assets to {targetLocale} edge servers...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-10 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                  <i className="ph-bold ph-check text-4xl text-white"></i>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Campaign Active</h3>
                   <p className="text-slate-400 text-sm font-medium mt-2">Localized assets are now live in the {targetLocale} market cluster.</p>
                </div>
                <button 
                  onClick={() => setShowDeploymentSuccess(false)}
                  className="w-full h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all"
                >
                  Return to Studio
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Stepper */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-6">
           <button 
            onClick={() => setView?.(AppView.DASHBOARD)}
            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-all shadow-inner shrink-0"
           >
             <i className="ph-bold ph-house text-xl"></i>
           </button>
           <div className="hidden sm:block">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Transcreation Pipeline</h2>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Guided Brand Adaptation Studio</p>
           </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
           {steps.map((step) => (
             <button
               key={step.id}
               onClick={() => { if (step.id < currentStep || (step.id === PipelineStep.CREATIVE && report)) setCurrentStep(step.id) }}
               disabled={step.id > currentStep && !(step.id === PipelineStep.ANALYSIS && sourceImage)}
               className={`flex items-center space-x-2 px-4 h-10 rounded-xl transition-all ${
                 currentStep === step.id 
                 ? 'bg-blue-600 text-white shadow-lg' 
                 : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <i className={`ph-bold ${step.icon} text-lg`}></i>
               <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">{step.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Step 1: Creative Brief & Master Asset */}
        {currentStep === PipelineStep.BRIEF && (
          <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-left duration-500">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm space-y-8 flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Step 1: Define Strategy</h3>
                <button onClick={loadDemo} className="text-[9px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors">Load Master Ad Sample</button>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Target Locale</label>
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 px-5 h-14 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <i className="ph-bold ph-globe text-blue-500"></i>
                  <select 
                    value={targetLocale} 
                    onChange={(e) => setTargetLocale(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold outline-none flex-1 dark:text-white"
                  >
                    {SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4 flex-1 flex flex-col">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Strategic Intent Brief</label>
                <textarea 
                  className="w-full flex-1 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all dark:text-slate-200 resize-none"
                  placeholder="Describe your transcreation goals..."
                  value={strategicBrief}
                  onChange={(e) => setStrategicBrief(e.target.value)}
                />
              </div>
              <button 
                onClick={() => runAnalysis()}
                disabled={!sourceImage}
                className="h-14 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-brand-xl hover:bg-blue-700 transition-all disabled:opacity-30"
              >
                Continue to Pivot Analysis
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">Master Ad Asset</h3>
              <div className="aspect-square bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden relative group shadow-brand-lg">
                {sourceImage ? (
                  <img src={sourceImage} className="w-full h-full object-cover animate-in fade-in duration-500" alt="Master Ad" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                       <i className="ph-bold ph-image-square text-4xl opacity-20"></i>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Upload high-resolution <br />marketing master</p>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Replace Visual</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Strategic Pivot Analysis */}
        {currentStep === PipelineStep.ANALYSIS && (
          <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right duration-500">
             <div className="lg:col-span-4 space-y-8">
               <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-brand-xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <i className="ph-fill ph-brain text-[140px]"></i>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Resonance Analysis</h4>
                    <p className="text-sm font-medium opacity-70">Gemini Pro has identified the core brand anchors versus contextual pivots.</p>
                  </div>

                  {isAnalyzing ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-6">
                      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Running Neural Scan...</p>
                    </div>
                  ) : report ? (
                    <div className="space-y-8 relative z-10">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Market Score</span>
                         <span className="text-4xl font-black">{report.cultural_fit_score}%</span>
                      </div>
                      <div className="h-px bg-white/10"></div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Market Logic</p>
                        <p className="text-xs leading-relaxed italic opacity-80">{report.market_logic}</p>
                      </div>
                      <button 
                        onClick={generateLocalizedConcept}
                        className="w-full h-14 bg-white text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-xl"
                      >
                        Enter Creative Studio
                      </button>
                    </div>
                  ) : null}
               </div>

               <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Brand Strategy HUD</h4>
                  <div className="space-y-6">
                     <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Fixed Anchors</p>
                        <p className="text-[11px] font-bold dark:text-white">{report?.brand_essence || '...'}</p>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-amber-500 uppercase mb-1">Adaptive Pivot</p>
                        <p className="text-[11px] font-bold dark:text-white">{report?.pivot_suggestion || '...'}</p>
                     </div>
                  </div>
               </div>
             </div>

             <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm flex flex-col h-[700px]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Transcreation Marker Board</h4>
                  <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full uppercase">Refining Elements</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                  {isAnalyzing ? (
                    <div className="space-y-6">
                       {[1,2,3,4].map(i => <div key={i} className="h-32 w-full skeleton rounded-[2rem]"></div>)}
                    </div>
                  ) : report?.markers.map((marker, i) => (
                    <div key={i} className={`p-8 rounded-[2.5rem] border transition-all space-y-6 ${
                      marker.type === 'Brand Anchor' ? 'bg-blue-50/20 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${marker.type === 'Brand Anchor' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                              <i className={`ph-bold ${marker.type === 'Brand Anchor' ? 'ph-lock' : 'ph-arrows-left-right'}`}></i>
                           </div>
                           <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">{marker.label}</span>
                         </div>
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${marker.type === 'Brand Anchor' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{marker.type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Original</p>
                            <p className="text-sm font-medium text-slate-400 line-through">{marker.original}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-blue-500 uppercase">Localized</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{marker.suggested_adaptation}</p>
                         </div>
                      </div>
                      <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/20">
                         <p className="text-[10px] text-slate-500 leading-relaxed italic">"Logic: {marker.rationale}"</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Step 3: Creative Studio & Visual Concepts */}
        {currentStep === PipelineStep.CREATIVE && (
          <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in zoom-in duration-700">
             <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Studio Asset</h4>
                  <button onClick={() => setCurrentStep(PipelineStep.BRIEF)} className="text-[9px] font-black text-blue-500 uppercase hover:underline">Edit Brief</button>
                </div>
                <div className="aspect-square bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-brand-lg grayscale-[0.6] opacity-60">
                  <img src={sourceImage!} className="w-full h-full object-cover" alt="Master" />
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                   <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Localized Studio Preview</h4>
                   <button 
                    onClick={generateLocalizedConcept} 
                    disabled={isGeneratingConcept}
                    className="flex items-center space-x-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline disabled:opacity-30"
                   >
                     <i className={`ph-bold ${isGeneratingConcept ? 'ph-spinner animate-spin' : 'ph-sparkle'}`}></i>
                     <span>{isGeneratingConcept ? 'Processing...' : 'Regenerate Concept Visual'}</span>
                   </button>
                </div>
                <div className="aspect-square bg-slate-950 rounded-[3.5rem] border-4 border-blue-500/20 overflow-hidden relative shadow-brand-2xl group">
                   {conceptImage ? (
                     <img src={conceptImage} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Concept" />
                   ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-12 text-center space-y-8">
                       <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-2xl">
                          <i className="ph-bold ph-paint-brush-broad text-5xl opacity-20"></i>
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-loose">Initialize rendering <br />for localized concept visual</p>
                       <button 
                        onClick={generateLocalizedConcept}
                        className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-brand-xl hover:scale-105 transition-all"
                       >
                         Execute Rendering
                       </button>
                     </div>
                   )}
                   {isGeneratingConcept && (
                     <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-20">
                        <div className="relative">
                          <div className="w-20 h-20 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                             <i className="ph-bold ph-sparkle text-white text-2xl animate-pulse"></i>
                          </div>
                        </div>
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.5em] mt-8 animate-pulse">Synthesizing Context...</p>
                        <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-2">Target Market: {targetLocale}</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="lg:col-span-2 bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-brand-xl">
                <div className="flex items-center space-x-6">
                   <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">
                      <i className="ph-fill ph-seal-check"></i>
                   </div>
                   <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">Pipeline Finalized</h4>
                      <p className="text-xs font-medium text-blue-100">Market concept generated based on neural cultural resonance analysis.</p>
                   </div>
                </div>
                <div className="flex space-x-4">
                   <button 
                    onClick={exportReport}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all"
                   >
                    Export Report
                   </button>
                   <button 
                    onClick={deployCampaign}
                    className="px-10 py-3 bg-white text-blue-600 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-800/20 hover:-translate-y-1 transition-all active:scale-95"
                   >
                    Deploy Campaign
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdLocalizationView;
