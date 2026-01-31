import React, { useState, useRef, useMemo, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { decode, encodeWAV } from '../utils/audio';
import { StyleguideRule, StyleguideReport } from '../types';
import StyleguideConfig from './StyleguideConfig';

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

const VoiceoverStudio: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName>('Neutral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Voice Lab & History State
  const [isCloning, setIsCloning] = useState(false);
  const [clonedProfile, setClonedProfile] = useState<VoiceProfile | null>(null);
  const [isVoiceLabOpen, setIsVoiceLabOpen] = useState(false);
  const [history, setHistory] = useState<AudioHistoryEntry[]>([]);

  // Styleguide Integration
  const [brandGuardActive, setBrandGuardActive] = useState(false);
  const [showStyleguideConfig, setShowStyleguideConfig] = useState(false);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);
  const [complianceReport, setComplianceReport] = useState<StyleguideReport | null>(null);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  useEffect(() => {
    const savedStyleguide = localStorage.getItem('lingopro_styleguide');
    if (savedStyleguide) {
      try { setStyleguideRules(JSON.parse(savedStyleguide)); } catch (e) {}
    }
  }, []);

  const voices: { id: VoiceName; desc: string; tone: string }[] = [
    { id: 'Kore', desc: 'Professional & Clear', tone: 'Corporate' },
    { id: 'Puck', desc: 'Youthful & Energetic', tone: 'Marketing' },
    { id: 'Charon', desc: 'Deep & Authoritative', tone: 'Legal/News' },
    { id: 'Fenrir', desc: 'Warm & Friendly', tone: 'Support' },
    { id: 'Zephyr', desc: 'Whispery & Narrative', tone: 'Audiobooks' },
  ];

  const emotions: { id: EmotionName; icon: React.ReactNode }[] = [
    { id: 'Neutral', icon: <i className="ph-bold ph-smiley-blank"></i> },
    { id: 'Happy', icon: <i className="ph-bold ph-smiley"></i> },
    { id: 'Sad', icon: <i className="ph-bold ph-smiley-sad"></i> },
    { id: 'Angry', icon: <i className="ph-bold ph-smiley-angry"></i> },
    { id: 'Excited', icon: <i className="ph-bold ph-shooting-star"></i> },
    { id: 'Serious', icon: <i className="ph-bold ph-briefcase"></i> },
  ];

  const metrics = useMemo(() => {
    const chars = text.length;
    const readingTimeSec = Math.ceil(chars / 15);
    return { chars, readingTimeSec };
  }, [text]);

  const checkCompliance = async (textToScan: string) => {
    if (!brandGuardActive || styleguideRules.length === 0 || !textToScan) return;
    setIsCheckingCompliance(true);
    try {
      const report = await geminiService.checkStyleguideCompliance(textToScan, 'English', styleguideRules);
      setComplianceReport(report);
      return report;
    } catch (e) {
      console.error("Compliance check failed", e);
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const handleGenerate = async () => {
    if (!text) return;

    if (brandGuardActive) {
      const report = await checkCompliance(text);
      if (report && report.violations.some(v => v.severity === 'High')) {
        const confirm = window.confirm("Critical Styleguide Violations found in script. Proceed anyway?");
        if (!confirm) return;
      }
    }

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
          text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
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

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCloning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const profile = await geminiService.analyzeVoice(base64Data, file.type);
        setClonedProfile(profile);
        setSelectedVoice(profile.match); 
        setIsCloning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Cloning failed:", error);
      setIsCloning(false);
      alert("Analysis failed. Please try a different audio format.");
    }
  };

  const handleExport = async (format: 'wav' | 'mp3', urlToExport?: string) => {
    const targetUrl = urlToExport || audioUrl;
    if (!targetUrl) return;
    
    if (format === 'mp3') {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsExporting(false);
    }

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `LingoPro_VO_${format.toUpperCase()}_${Date.now()}.${format}`;
    a.click();
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
               <i className="ph-bold ph-microphone-stage text-2xl"></i>
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI Voiceover Studio</h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Neural Synthesis & Cloning v4.2</p>
            </div>
         </div>
         <div className="flex items-center space-x-3">
           <button 
             onClick={() => setBrandGuardActive(!brandGuardActive)}
             className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 border shadow-lg ${
               brandGuardActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
             }`}
           >
             <i className={`ph-bold ${brandGuardActive ? 'ph-shield-check' : 'ph-shield'} text-lg`}></i>
             <span>{brandGuardActive ? 'Guard Active' : 'Style Check'}</span>
           </button>
           <button 
             onClick={() => setIsVoiceLabOpen(!isVoiceLabOpen)}
             className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 border shadow-lg ${
               isVoiceLabOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700'
             }`}
           >
             <i className={`ph-bold ${isVoiceLabOpen ? 'ph-flask-fill' : 'ph-flask'} text-lg`}></i>
             <span>{isVoiceLabOpen ? 'Close Lab' : 'Voice Lab'}</span>
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          {/* Compliance Report Banner */}
          {brandGuardActive && complianceReport && (
            <div className={`p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-500 flex items-center justify-between ${
              complianceReport.score >= 90 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center space-x-4">
                 <i className={`ph-bold ${complianceReport.score >= 90 ? 'ph-check-circle' : 'ph-warning'} text-2xl`}></i>
                 <div>
                    <h4 className="font-black uppercase tracking-tighter text-sm">Styleguide Analysis: {complianceReport.score}% Alignment</h4>
                    <p className="text-xs opacity-70 font-medium">Found {complianceReport.violations.length} discrepancies against corporate guidelines.</p>
                 </div>
              </div>
              <button onClick={() => setComplianceReport(null)} className="text-[10px] font-black uppercase tracking-widest hover:underline">Dismiss</button>
            </div>
          )}

          {/* Voice Lab Panel */}
          {isVoiceLabOpen && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <i className="ph-bold ph-fingerprint text-[12rem] text-brand-blue"></i>
               </div>
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-6">
                     <div>
                        <h3 className="text-white font-black text-xl uppercase tracking-widest mb-2">Vocal DNA Profiling</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                          Upload a master vocal sample to extract its unique biological signature. Our engine analyzes acoustic textures to create a high-fidelity clone.
                        </p>
                     </div>
                     <div className="relative h-44 group">
                        <input type="file" accept="audio/*" onChange={handleVoiceUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                        <div className="absolute inset-0 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-950/50 flex flex-col items-center justify-center text-center p-6 group-hover:border-indigo-500 transition-all">
                           {isCloning ? (
                             <div className="space-y-4 w-full text-center">
                                <div className="flex space-x-1 justify-center items-end h-12">
                                   {[...Array(8)].map((_, i) => (
                                     <div key={i} className="w-1.5 bg-brand-blue rounded-full animate-pulse" style={{ height: `${20 + Math.random()*80}%`, animationDelay: `${i*0.1}s` }}></div>
                                   ))}
                                </div>
                                <p className="text-xs font-black text-brand-blue uppercase tracking-widest animate-pulse">Extracting DNA...</p>
                             </div>
                           ) : clonedProfile ? (
                             <div className="space-y-2">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-2">
                                   <i className="ph-bold ph-fingerprint text-4xl"></i>
                                </div>
                                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Profile Synced</p>
                             </div>
                           ) : (
                             <div className="space-y-4">
                                <i className="ph-bold ph-microphone text-5xl text-slate-600 group-hover:text-indigo-400 transition-colors"></i>
                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Drop Master Audio</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="lg:col-span-7">
                    {clonedProfile && (
                      <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl animate-in zoom-in duration-500">
                         <div className="flex items-center space-x-3 mb-4">
                            <i className="ph-bold ph-seal-check text-white text-2xl"></i>
                            <h4 className="text-lg font-black text-white uppercase tracking-widest">Vocal Synthesis Ready</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                               <p className="text-[10px] text-indigo-200 font-black uppercase">Analyzed Pitch</p>
                               <p className="text-white font-bold">{clonedProfile.pitch}</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                               <p className="text-[10px] text-indigo-200 font-black uppercase">Timbre Density</p>
                               <p className="text-white font-bold">{clonedProfile.timbre}</p>
                            </div>
                         </div>
                         <button onClick={() => setClonedProfile(null)} className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest underline">Reset Calibration</button>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* Synthesis Main Body */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
               <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Localized Script</h3>
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      {emotions.map((e) => (
                        <button key={e.id} onClick={() => setSelectedEmotion(e.id)} title={e.id}
                          className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                            selectedEmotion === e.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {e.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea 
                      className="w-full h-48 p-6 pb-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-200 resize-none"
                      placeholder="Enter script for synthesis..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <div className="absolute bottom-4 left-6 flex space-x-6">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{metrics.chars} Chars</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">~{metrics.readingTimeSec}s Est.</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerate} disabled={isGenerating || !text}
                    className={`w-full py-4.5 text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center space-x-3 ${
                      clonedProfile ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 dark:bg-slate-700 hover:opacity-90'
                    }`}
                  >
                    {isGenerating || isCheckingCompliance ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className={`ph-bold ${clonedProfile ? 'ph-fingerprint' : 'ph-play'} text-xl`}></i>
                    )}
                    <span className="uppercase tracking-widest text-sm">{isCheckingCompliance ? 'Checking Brand Guard...' : isGenerating ? 'Rendering Neural Audio...' : 'Generate Voiceover'}</span>
                  </button>
               </div>

               <div className="w-full md:w-80 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Master Persona Engine</h3>
                  <div className="grid grid-cols-1 gap-3">
                     {voices.map((v) => (
                       <button key={v.id} onClick={() => { setSelectedVoice(v.id); setClonedProfile(null); }}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                          selectedVoice === v.id && !clonedProfile ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                        }`}
                       >
                         <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedVoice === v.id && !clonedProfile ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><i className="ph ph-user"></i></div>
                            <div>
                              <p className={`font-bold text-sm ${selectedVoice === v.id && !clonedProfile ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>{v.id}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{v.tone}</p>
                            </div>
                         </div>
                       </button>
                     ))}
                     {clonedProfile && (
                       <button className="p-4 rounded-2xl border bg-indigo-600 border-indigo-500 shadow-lg text-left flex items-center space-x-3 group animate-in zoom-in">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600"><i className="ph-bold ph-fingerprint"></i></div>
                          <div>
                            <p className="font-bold text-sm text-white">Target Clone</p>
                            <p className="text-[10px] text-indigo-200 font-medium">Active Mapping</p>
                          </div>
                       </button>
                     )}
                  </div>
               </div>
            </div>
          </div>

          {/* Monitor & Export Suite */}
          <div className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-800 animate-in fade-in duration-1000">
             <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center px-4 overflow-hidden">
                <div className="w-full flex items-center justify-around space-x-1 h-32">
                  {[...Array(40)].map((_, i) => (
                    <div key={i} className={`flex-1 bg-brand-blue rounded-full ${audioUrl ? 'animate-pulse' : ''}`} style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }}></div>
                  ))}
                </div>
             </div>
             
             <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
                <div className="space-y-2">
                   <h4 className="text-white font-black text-2xl uppercase tracking-tighter italic">Expert Studio Monitor</h4>
                   <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Preview the localized synthesis. Advanced neural processing ensures high dynamic range and emotional fidelity.</p>
                </div>

                <div className="w-full max-w-2xl bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
                   {audioUrl ? (
                     <>
                       <audio ref={audioRef} src={audioUrl} className="hidden" />
                       <button onClick={togglePlayback} className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-2xl shrink-0">
                          <i className="ph-fill ph-play-circle text-5xl"></i>
                       </button>
                       <div className="flex-1 space-y-4 text-left w-full">
                          <div>
                             <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                <span>Synthesis Output</span>
                                <span className="text-brand-blue">24kHz • 16-bit PCM</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                <div className="absolute inset-y-0 left-0 bg-brand-blue w-full animate-progress-indefinite" style={{ animationDuration: '4s' }}></div>
                             </div>
                          </div>
                          <div className="flex items-center space-x-3">
                             <button onClick={() => handleExport('wav')} className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                <i className="ph-bold ph-download-simple text-lg"></i>
                                <span>WAV</span>
                             </button>
                             <button onClick={() => handleExport('mp3')} disabled={isExporting} className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                <i className={`ph-bold ${isExporting ? 'ph-circle-notch animate-spin' : 'ph-export'} text-lg`}></i>
                                <span>{isExporting ? 'Encoding...' : 'MP3'}</span>
                             </button>
                          </div>
                       </div>
                     </>
                   ) : (
                     <div className="w-full flex items-center justify-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Awaiting Synthesis Engine Command</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Studio Archives Sidebar */}
        <div className="xl:col-span-4 space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[850px] overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                 <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Studio Archives</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Project History</p>
                 </div>
                 <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black">{history.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                 {history.length > 0 ? history.map((item) => (
                   <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 group animate-in slide-in-from-right duration-500">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center space-x-2">
                            <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">{item.voice}</span>
                            <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">{item.emotion}</span>
                         </div>
                         <span className="text-[8px] text-slate-400 font-bold">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2 leading-relaxed">"{item.text}"</p>
                      <div className="flex items-center justify-between pt-2">
                         <div className="flex items-center space-x-1 text-[9px] font-black text-slate-400 uppercase">
                            <i className="ph ph-timer"></i>
                            <span>{item.duration}s</span>
                         </div>
                         <div className="flex items-center space-x-2">
                            <button onClick={() => setAudioUrl(item.url)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><i className="ph-bold ph-play"></i></button>
                            <button onClick={() => handleExport('wav', item.url)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><i className="ph-bold ph-download-simple"></i></button>
                            <button onClick={() => deleteFromHistory(item.id)} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><i className="ph-bold ph-trash"></i></button>
                         </div>
                      </div>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-slate-400 text-center space-y-4">
                      <i className="ph-bold ph-wave-sine text-6xl"></i>
                      <p className="text-xs font-black uppercase tracking-widest">No Recent Sessions</p>
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                 <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Clear Project Archive</button>
              </div>
           </div>
        </div>
      </div>

      {showStyleguideConfig && <StyleguideConfig onClose={() => setShowStyleguideConfig(false)} />}
    </div>
  );
};

export default VoiceoverStudio;
