
import React, { useState, useRef, useEffect } from 'react';
import { AppView, SUPPORTED_LANGUAGES } from '../types';
import { geminiService } from '../services/geminiService';

interface SubtitlingViewProps {
  setView?: (view: AppView) => void;
}

interface Subtitle {
  start: string;
  end: string;
  text: string;
}

const SubtitlingView: React.FC<SubtitlingViewProps> = ({ setView }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [targetLang, setTargetLang] = useState('English');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setVideoUrl(URL.createObjectURL(file));
      setFileName(file.name);
      setSubtitles([]);
    }
  };

  const loadDemoVideo = () => {
    setVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-laptop-34440-large.mp4");
    setFileName("Demo_Expert_Cloud_Infrastructure.mp4");
    setSubtitles([
      { start: '00:00:00,500', end: '00:00:03,000', text: 'Initiating global synchronization sequence...' },
      { start: '00:00:03,500', end: '00:00:06,000', text: 'Neural processing nodes are now online and stable.' }
    ]);
  };

  const handleGenerateSubtitles = async () => {
    if (!fileName) return;
    setIsGenerating(true);
    try {
      const aiSubtitles = await geminiService.generateSubtitles(fileName, targetLang);
      if (aiSubtitles && aiSubtitles.length > 0) {
        setSubtitles(aiSubtitles);
      }
    } catch (error) {
      console.error("Subtitling error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSub = (idx: number, field: keyof Subtitle, val: string) => {
    const updated = [...subtitles];
    updated[idx] = { ...updated[idx], [field]: val };
    setSubtitles(updated);
  };

  const addSub = () => setSubtitles([...subtitles, { start: '00:00:00,000', end: '00:00:00,000', text: '' }]);
  const removeSub = (idx: number) => setSubtitles(subtitles.filter((_, i) => i !== idx));

  const timeToSeconds = (timeStr: string) => {
    const parts = timeStr.replace(',', '.').split(':');
    if (parts.length !== 3) return 0;
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  };

  const currentActiveSub = subtitles.find(s => {
    const start = timeToSeconds(s.start);
    const end = timeToSeconds(s.end);
    return currentTime >= start && currentTime <= end;
  });

  const exportSubtitles = (format: 'srt' | 'vtt') => {
    let content = '';
    if (format === 'vtt') content += 'WEBVTT\n\n';
    subtitles.forEach((sub, index) => {
      const id = index + 1;
      let start = sub.start;
      let end = sub.end;
      if (format === 'vtt') {
        start = start.replace(',', '.');
        end = end.replace(',', '.');
      }
      content += `${id}\n${start} --> ${end}\n${sub.text}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LOCALIZED_${fileName.split('.')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Video Preview Area */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-950 rounded-[2.5rem] aspect-video relative overflow-hidden shadow-brand-xl group border border-slate-800">
          {videoUrl ? (
            <>
              <video 
                ref={videoRef}
                src={videoUrl} 
                controls 
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
              {currentActiveSub && (
                <div className="absolute bottom-16 left-0 right-0 px-8 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center border border-white/10 max-w-[80%]">
                    <p className="text-lg font-bold leading-tight drop-shadow-lg">{currentActiveSub.text}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950/50">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-8">Studio Awaiting Input</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-all">
                  Upload Visual
                  <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                </label>
                <button onClick={loadDemoVideo} className="px-8 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
                  Load Demo
                </button>
              </div>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center">
               <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
               <h3 className="text-white text-sm font-black uppercase tracking-widest">Multi-Modal Analysis...</h3>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Locale</h4>
            <select 
              className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 h-10 text-[10px] font-black uppercase outline-none dark:text-white"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleGenerateSubtitles}
            disabled={isGenerating || !fileName}
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-brand-xl disabled:opacity-30"
          >
            Generate AI Subtitles
          </button>
        </div>
      </div>

      {/* Timeline Editor Area */}
      <div className="lg:col-span-5 flex flex-col h-[700px] space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Timeline Sync</h4>
            <button onClick={addSub} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              <i className="ph-bold ph-plus"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {subtitles.map((sub, idx) => (
              <div key={idx} className={`p-5 rounded-3xl border transition-all space-y-4 ${currentTime >= timeToSeconds(sub.start) && currentTime <= timeToSeconds(sub.end) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 dark:bg-slate-950'}`}>
                <div className="flex items-center space-x-2">
                   <input type="text" value={sub.start} onChange={(e) => updateSub(idx, 'start', e.target.value)} className="bg-white dark:bg-slate-900 border rounded-lg px-2 py-1 text-[10px] font-mono w-24 outline-none" />
                   <span className="text-slate-300">→</span>
                   <input type="text" value={sub.end} onChange={(e) => updateSub(idx, 'end', e.target.value)} className="bg-white dark:bg-slate-900 border rounded-lg px-2 py-1 text-[10px] font-mono w-24 outline-none" />
                   <div className="flex-1" />
                   <button onClick={() => removeSub(idx)} className="text-slate-300 hover:text-red-500"><i className="ph-bold ph-trash-simple text-lg"></i></button>
                </div>
                <textarea value={sub.text} onChange={(e) => updateSub(idx, 'text', e.target.value)} className="w-full bg-white dark:bg-slate-900 border rounded-2xl p-4 text-xs font-medium resize-none outline-none focus:border-blue-500" rows={2} />
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-4">
            <button onClick={() => exportSubtitles('srt')} disabled={subtitles.length === 0} className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-brand-xl disabled:opacity-30">Export SRT</button>
            <button onClick={() => exportSubtitles('vtt')} disabled={subtitles.length === 0} className="flex-1 h-12 bg-white text-slate-800 border rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-brand-lg disabled:opacity-30">Export VTT</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitlingView;
