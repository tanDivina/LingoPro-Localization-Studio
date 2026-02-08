
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { decode, encodeWAV } from '../utils/audio';
import { StyleguideRule, StyleguideReport, AppView } from '../types';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsGeneratingExport] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isCloning, setIsCloning] = useState(false);
  const [clonedProfile, setClonedProfile] = useState<VoiceProfile | null>(null);
  const [isVoiceLabOpen, setIsVoiceLabOpen] = useState(false);
  const [history, setHistory] = useState<AudioHistoryEntry[]>([]);

  const [brandGuardActive, setBrandGuardActive] = useState(false);
  const [showStyleguideConfig, setShowStyleguideConfig] = useState(false);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);
  const [complianceReport, setComplianceReport] = useState<StyleguideReport | null>(null);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  useEffect(() => {
    const savedStyleguide = safeLocalStorage.getItem('lingopro_styleguide');
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

  const handleExport = async (format: 'wav' | 'mp3', urlToExport?: string) => {
    const targetUrl = urlToExport || audioUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `LingoPro_VO_${format.toUpperCase()}_${Date.now()}.${format}`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-brand-sm gap-4">
         <div className="flex items-center space-x-4 w-full">
            <button 
              onClick={() => setView?.(AppView.DASHBOARD)}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-indigo-600 transition-all shadow-brand-sm flex items-center justify-center shrink-0"
              title="Home"
            >
              <i className="ph-bold ph-house text-2xl"></i>
            </button>
            <div className="min-w-0">
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">Voiceover Studio</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Neural Synthesis Core</p>
            </div>
         </div>
         <div className="flex items-center space-x-2 w-full sm:w-auto">
           <button 
             onClick={() => setBrandGuardActive(!brandGuardActive)}
             className={`flex-1 sm:flex-none h-[44px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-brand-sm ${
               brandGuardActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
             }`}
           >
             <i className="ph-bold ph-shield-check text-lg"></i>
             <span>{brandGuardActive ? 'Active' : 'Check'}</span>
           </button>
           <button 
             onClick={() => setIsVoiceLabOpen(!isVoiceLabOpen)}
             className={`flex-1 sm:flex-none h-[44px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border shadow-brand-sm ${
               isVoiceLabOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700'
             }`}
           >
             <i className="ph-bold ph-flask text-lg"></i>
             <span>{isVoiceLabOpen ? 'Close' : 'Lab'}</span>
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-md sm:rounded-lg border border-slate-200 dark:border-slate-800 shadow-brand-sm space-y-8">
            <div className="flex flex-col gap-8">
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Synthesis Script</h3>
                    <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      {emotions.map((e) => (
                        <button key={e.id} onClick={() => setSelectedEmotion(e.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedEmotion === e.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-brand-sm' : 'text-slate-400'}`}>
                          {e.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-200 resize-none"
                    placeholder="Enter vocal script..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button 
                    onClick={handleGenerate} disabled={isGenerating || !text}
                    className="h-[52px] w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-md shadow-brand-xl hover:shadow-brand-lg transition-all active:scale-95 disabled:opacity-30"
                  >
                    {isGenerating ? 'Rendering...' : 'Generate Synthesis'}
                  </button>
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
