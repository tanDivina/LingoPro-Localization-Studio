
import React, { useState } from 'react';

const SubtitlingView: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<{ start: string; end: string; text: string }[]>([
    { start: '00:00:01,000', end: '00:00:04,500', text: 'Welcome to the LingoPro Localization Suite global summit.' },
    { start: '00:00:05,000', end: '00:00:08,000', text: 'We are revolutionizing how content is localized using Gemini 3.' }
  ]);
  
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoUrl(URL.createObjectURL(file));
  };

  const updateSub = (idx: number, field: 'start' | 'end' | 'text', val: string) => {
    const updated = [...subtitles];
    updated[idx] = { ...updated[idx], [field]: val };
    setSubtitles(updated);
  };

  const addSub = () => setSubtitles([...subtitles, { start: '00:00:00,000', end: '00:00:00,000', text: '' }]);
  const removeSub = (idx: number) => setSubtitles(subtitles.filter((_, i) => i !== idx));

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
    a.download = `lingopro_subtitles.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-black rounded-2xl aspect-video relative overflow-hidden shadow-2xl group border border-slate-800">
          {videoUrl ? (
            <video src={videoUrl} controls className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <i className="ph-bold ph-video-camera-slash text-6xl mb-4"></i>
              <p className="text-sm font-bold uppercase tracking-widest">No Video Loaded</p>
              <label className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-700 shadow-xl">
                Upload Master Video
                <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
              </label>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Automated Temporal Analysis</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">LingoPro uses Gemini 3 to automatically generate perfectly timed subtitles from video audio, optimized for localized reading speeds.</p>
          <button className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
            Generate Subtitles with Gemini
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[700px]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Timeline Editor</span>
          <div className="flex space-x-2">
            <button onClick={() => exportSubtitles('srt')} title="Download SRT" className="p-1.5 text-slate-400 hover:text-indigo-600"><i className="ph-bold ph-download-simple text-xl"></i></button>
            <button onClick={() => exportSubtitles('vtt')} title="Download VTT" className="p-1.5 text-slate-400 hover:text-brand-blue"><i className="ph-bold ph-export text-xl"></i></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {subtitles.map((sub, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <input type="text" value={sub.start} onChange={(e) => updateSub(idx, 'start', e.target.value)} className="bg-white dark:bg-slate-800 text-[10px] font-mono border border-slate-200 rounded px-2 py-1 w-24 outline-none" />
                <span className="text-slate-400">→</span>
                <input type="text" value={sub.end} onChange={(e) => updateSub(idx, 'end', e.target.value)} className="bg-white dark:bg-slate-800 text-[10px] font-mono border border-slate-200 rounded px-2 py-1 w-24 outline-none" />
                <div className="flex-1"></div>
                <button onClick={() => removeSub(idx)} className="text-slate-300 hover:text-red-500"><i className="ph-bold ph-trash text-lg"></i></button>
              </div>
              <textarea value={sub.text} onChange={(e) => updateSub(idx, 'text', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-lg p-3 text-sm resize-none outline-none focus:border-indigo-500 dark:text-slate-100" rows={2} />
            </div>
          ))}
          <button onClick={addSub} className="w-full py-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 text-xs font-bold hover:border-indigo-300 hover:text-indigo-500">+ Add Segment</button>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
          <div className="flex-1">
             <button 
              onClick={() => exportSubtitles('srt')} 
              className="w-full py-3.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
            >
              <i className="ph-bold ph-file-text text-lg"></i>
              <span>Export SRT</span>
            </button>
          </div>
          <div className="flex-1">
            <button 
              onClick={() => exportSubtitles('vtt')} 
              className="w-full py-3.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center space-x-2"
            >
              <i className="ph-bold ph-broadcast text-lg"></i>
              <span>Export VTT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtitlingView;
