
import React, { useState, useMemo, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { decode, encodeWAV } from '../utils/audio';
import { StyleguideRule, AppView, LocalizationAsset } from '../types';
import StyleguideConfig from './StyleguideConfig';
import { safeLocalStorage } from '../utils/storage';

type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
type EmotionName = 'Neutral' | 'Happy' | 'Sad' | 'Angry' | 'Excited' | 'Serious';

interface VoiceProfile {
  pitch: string;
  timbre: string;
  pace: string;
  match: VoiceName;
  cloning_prompt: string;
}

interface AudioHistoryEntry {
  id: string;
  url: string;
  text: string;
  voice: string;
  emotion: string;
  timestamp: string;
  duration: number;
}

interface VoiceoverStudioProps {
  setView?: (view: AppView) => void;
}

const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({ setView }) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName>('Neutral');
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<LocalizationAsset[]>([]);
  
  const [clonedProfile, setClonedProfile] = useState<VoiceProfile | null>(null);
  const [isVoiceLabOpen, setIsVoiceLabOpen] = useState(false);
  const [history, setHistory] = useState<AudioHistoryEntry[]>([]);

  const [brandGuardActive, setBrandGuardActive] = useState(false);
  const [showStyleguideConfig, setShowStyleguideConfig] = useState(false);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);

  useEffect(() => {
    const savedStyleguide = safeLocalStorage.getItem('lingopro_styleguide');
    if (savedStyleguide) {
      try { setStyleguideRules(JSON.parse(savedStyleguide)); } catch (e) {}
    }
  }, []);

  const loadDemoScript = () => {
    setText("The future of localization is not just about words, it's about context. With Gemini's neural architecture, we are bridges across cultures. From Tokyo to Madrid, every tone and timbre is preserved with 99.8% fidelity.");
    setSelectedVoice('Zephyr');
    setSelectedEmotion('Serious');
  };

  const openAssetPicker = () => {
    const saved = safeLocalStorage.getItem('lingopro_assets');
    if (saved) {
      try {
        setAvailableAssets(JSON.parse(saved));
        setShowAssetPicker(true);
      } catch (e) {}
    } else {
      alert("No workspace assets found in local memory.");
    }
  };

  const importAssetContent = (asset: LocalizationAsset) => {
    const targetMatch = asset.content.match(/<target[^>]*>(.*?)<\/target>/g);
    if (targetMatch && targetMatch.length > 0) {
      const extracted = targetMatch.map(m => m.replace(/<\/?target[^>]*>/g, '')).filter(t => t.trim().length > 0).join('\n\n');
      setText(extracted);
    } else {
      setText(asset.content);
    }
    setShowAssetPicker(false);
  };

  const voices: { id: VoiceName; desc: string; tone: string; tooltip: string }[] = [
    { id: 'Kore', desc: 'Professional & Clear', tone: 'Corporate', tooltip: 'High-fidelity neural voice tuned for executive reports.' },
    { id: 'Puck', desc: 'Youthful & Energetic', tone: 'Marketing', tooltip: 'Dynamic prosody for consumer-facing ads.' },
    { id: 'Charon', desc: 'Deep & Authoritative', tone: 'Legal/News', tooltip: 'Deep frequency timbre for briefings.' },
    { id: 'Fenrir', desc: 'Warm & Friendly', tone: 'Support', tooltip: 'Compassionate tone for customer service.' },
    { id: 'Zephyr', desc: 'Whispery & Narrative', tone: 'Audiobooks', tooltip: 'Intimate delivery for storytelling.' },
  ];

  const emotions: { id: EmotionName; icon: string; tooltip: string; label: string }[] = [
    { id: 'Neutral', icon: 'ph-smiley-blank', label: 'Neutral', tooltip: 'Baseline neural prosody for informative reports.' },
    { id: 'Happy', icon: 'ph-smiley', label: 'Affable', tooltip: 'Positive inflection shifts for high engagement.' },
    { id: 'Sad', icon: 'ph-smiley-sad', label: 'Somber', tooltip: 'Empathetic tonal shifts with measured cadence.' },
    { id: 'Angry', icon: 'ph-smiley-angry', label: 'Forceful', tooltip: 'High-energy staccato delivery for impact.' },
    { id: 'Excited', icon: 'ph-shooting-star', label: 'Vibrant', tooltip: 'Maximum dynamic range for promotional assets.' },
    { id: 'Serious', icon: 'ph-briefcase', label: 'Authoritative', tooltip: 'Low-variance frequency for gravity and trust.' },
  ];

  const metrics = useMemo(() => {
    const chars = text.length;
    const readingTimeSec = Math.ceil(chars / 15);
    return { chars, readingTimeSec };
  }, [text]);

  const handleGenerate = async () => {
    if (!text) return;
    setIsGenerating(true);
    try {
      const voiceToUse = clonedProfile ? clonedProfile.match : selectedVoice;
      const cloningPrompt = clonedProfile ? clonedProfile.cloning_prompt : undefined;
      const base64 = await geminiService.generateSpeech(text, voiceToUse, selectedEmotion, cloningPrompt);
      if (base64) {
        const pcmData = decode(base64);
        const wavBlob = encodeWAV(pcmData, 24000);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
        const newEntry: AudioHistoryEntry = {
          id: Date.now().toString(),
          url,
          text: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
          voice: clonedProfile ? `Clone (${clonedProfile.match})` : selectedVoice,
          emotion: selectedEmotion,
          timestamp: new Date().toLocaleTimeString(),
          duration: metrics.readingTimeSec
        };
        setHistory(prev => [newEntry, ...prev]);
      }
    } catch (e) {
      alert('Speech generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 pb-20 relative">
      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Workspace Synthesis Source</h3>
                 <button onClick={() => setShowAssetPicker(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <i className="ph-bold ph-x"></i>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                 {availableAssets.map(asset => (
                   <button 
                    key={asset.id} 
                    onClick={() => importAssetContent(asset)}
                    className="w-full text-left p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-center space-x-4 group"
                   >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <i className={`ph-bold ${asset.type === 'docx' ? 'ph-file-doc' : 'ph-file'}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{asset.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.type} • {(asset.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <i className="ph-bold ph-caret-right text-slate-300 group-hover:text-blue-500"></i>
                   </button>
                 ))}
                 {availableAssets.length === 0 && (
                   <div className="py-20 text-center opacity-20 flex flex-col items-center">
                      <i className="ph-bold ph-database text-5xl mb-4"></i>
                      <p className="text-sm font-black uppercase tracking-widest">Workspace is Empty</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Studio Manual</h3>
                 <button onClick={() => setShowHelp(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <i className="ph-bold ph-x"></i>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 space-y-6 no-scrollbar text-sm text-slate-500">
                 <p>Input your script and select a voice profile. Gemini-powered TTS engine generates raw PCM 24kHz audio in real-time wrapping it in high-fidelity WAV containers.</p>
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Expert Tip</h5>
                    <p className="text-xs text-blue-800 dark:text-blue-300">For marketing content, select 'Puck' with 'Vibrant' (Excited) emotion to maximize consumer retention.</p>
                 </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest mt-8 shadow-brand-xl">Understood</button>
           </div>
        </div>
      )}

      {/* Optimized Utility Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm gap-4">
         <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Node Core v2.5</span>
            </div>
            <button 
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-800/40"
              title="Open Expert Studio Guide and Neural Specifications"
            >
              ?
            </button>
         </div>
         <div className="flex items-center space-x-3 w-full sm:w-auto">
           <button 
             onClick={loadDemoScript}
             className="h-10 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-all shadow-brand-sm flex items-center justify-center space-x-2"
           >
             <i className="ph-bold ph-magic-wand"></i>
             <span>Load Demo</span>
           </button>
           <button 
             onClick={() => setBrandGuardActive(!brandGuardActive)}
             title="Activate real-time Brand Compliance scanning on your synthesis script."
             className={`flex-1 sm:flex-none h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-sm ${
               brandGuardActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
             }`}
           >
             <i className="ph-bold ph-shield-check text-lg"></i>
             <span>{brandGuardActive ? 'Guard Active' : 'Check Brand'}</span>
           </button>
           <button 
             onClick={() => setIsVoiceLabOpen(!isVoiceLabOpen)}
             title="Open the Advanced Voice Lab for custom timbre mapping and stylistic cloning."
             className={`flex-1 sm:flex-none h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-sm ${
               isVoiceLabOpen ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-slate-800 text-blue-600 border-slate-200 dark:border-slate-700 hover:border-blue-500/50'
             }`}
           >
             <i className="ph-bold ph-flask text-lg"></i>
             <span>{isVoiceLabOpen ? 'Close Lab' : 'Voice Lab'}</span>
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-7 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm space-y-8">
            <div className="space-y-6">
               <div className="flex justify-between items-center px-2">
                 <div className="flex items-center space-x-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Acoustic Logic</h3>
                    <button 
                      onClick={openAssetPicker}
                      className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg flex items-center justify-center transition-all shadow-brand-sm border border-slate-100 dark:border-slate-700"
                      title="Import localized text from browser workspace memory"
                    >
                      <i className="ph-bold ph-folder-open text-sm"></i>
                    </button>
                 </div>
                 
                 {/* Refined Emotion Selector with Custom Tooltips */}
                 <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                   {emotions.map((e) => (
                     <div key={e.id} className="relative group/emotion">
                       <button 
                         onClick={() => setSelectedEmotion(e.id)}
                         onMouseEnter={() => setHoveredEmotion(e.id)}
                         onMouseLeave={() => setHoveredEmotion(null)}
                         aria-label={`Switch to ${e.label} emotion`}
                         className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${selectedEmotion === e.id ? 'bg-blue-600 text-white shadow-brand-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800'}`}
                       >
                         <i className={`ph-bold ${e.icon} text-lg`}></i>
                       </button>
                       
                       {/* Custom Tooltip */}
                       {hoveredEmotion === e.id && (
                         <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                           <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-2xl border border-white/10 min-w-[140px] text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{e.label}</p>
                             <p className="text-[9px] font-medium leading-tight opacity-80">{e.tooltip}</p>
                           </div>
                           <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/10"></div>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
               <div className="relative">
                 <textarea 
                   className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] outline-none text-sm leading-relaxed transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-slate-200 resize-none font-medium"
                   placeholder="Paste the localized adaptation script here..."
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                 />
                 <div className="absolute bottom-6 right-8 flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{metrics.chars} Chars</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">~{metrics.readingTimeSec}s Runtime</span>
                    </div>
                 </div>
               </div>
               <button 
                 onClick={handleGenerate} 
                 disabled={isGenerating || !text}
                 className="h-16 w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.5rem] shadow-brand-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center space-x-4"
               >
                 {isGenerating ? <><i className="ph-bold ph-spinner animate-spin"></i><span>Synthesizing...</span></> : <><i className="ph-fill ph-sparkle text-lg"></i><span>Execute Synthesis</span></>}
               </button>
            </div>
          </div>

          {isVoiceLabOpen && (
             <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-brand-xl space-y-8 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <i className="ph-fill ph-flask text-[160px]"></i>
                </div>
                <div className="relative z-10">
                   <h3 className="text-xl font-black uppercase tracking-tighter">Neural Lab: Custom Timbre</h3>
                   <p className="text-xs font-medium text-blue-100 mt-2 opacity-80">Describe a stylistic wrapper to apply over the base acoustic profile.</p>
                </div>
                <textarea 
                 className="relative z-10 w-full h-28 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-xs font-bold text-white placeholder:text-white/40 outline-none focus:ring-4 focus:ring-white/10"
                 placeholder="e.g. 'A raspy, tired voice of a detective with a slight Midwestern accent...'"
                 value={clonedProfile?.cloning_prompt || ''}
                 onChange={(e) => setClonedProfile(prev => ({ ...(prev || { pitch: 'Normal', timbre: 'Warm', pace: 'Steady', match: 'Kore', cloning_prompt: '' }), cloning_prompt: e.target.value }))}
                />
             </div>
          )}
        </div>

        <div className="xl:col-span-5 space-y-8">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden flex flex-col h-[650px]">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Acoustic Profiles</h4>
                 <span className="text-[9px] font-black text-blue-500 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-800/40">Neural v2.5</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                 {voices.map((v) => (
                   <button 
                    key={v.id} 
                    onClick={() => setSelectedVoice(v.id)}
                    className={`w-full text-left p-5 rounded-3xl border transition-all relative group/voice ${selectedVoice === v.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 ring-4 ring-blue-500/5 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}
                   >
                     <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${selectedVoice === v.id ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <i className={`ph-bold ${selectedVoice === v.id ? 'ph-user-sound' : 'ph-microphone'} text-xl`}></i>
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{v.id}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{v.tone}</p>
                        </div>
                     </div>

                     {/* Profile Tooltip */}
                     <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/voice:opacity-100 pointer-events-none transition-opacity hidden sm:block">
                        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-2xl border border-white/10 w-48 text-center">
                          <p className="text-[9px] font-medium leading-tight">{v.tooltip}</p>
                        </div>
                     </div>
                   </button>
                 ))}
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset History</h4>
                    <span className="text-[9px] font-black text-slate-300 uppercase">{history.length} Files</span>
                 </div>
                 <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar">
                    {history.map((entry) => (
                      <div key={entry.id} className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group animate-in slide-in-from-right duration-500">
                         <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate pr-4 italic">"{entry.text}"</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">{entry.voice} • {entry.emotion}</p>
                         </div>
                         <div className="flex items-center space-x-2">
                           <button 
                            onClick={() => new Audio(entry.url).play()} 
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-800/50"
                            title="Playback generated asset"
                           >
                             <i className="ph-bold ph-play"></i>
                           </button>
                           <a 
                            href={entry.url} 
                            download={`LOCALIZED_VO_${entry.id}.wav`} 
                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                            title="Export high-fidelity WAV"
                           >
                             <i className="ph-bold ph-download-simple"></i>
                           </a>
                         </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="py-12 flex flex-col items-center opacity-20 grayscale">
                         <i className="ph-bold ph-waveform text-4xl"></i>
                         <p className="text-[8px] font-black uppercase tracking-widest mt-3">Studio Queue Empty</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {showStyleguideConfig && <StyleguideConfig onClose={() => setShowStyleguideConfig(false)} />}
    </div>
  );
};

export default VoiceoverStudio;
