
import React, { useState } from 'react';
import { AppView } from '../types';

interface TranscriptionViewProps {
  setView?: (view: AppView) => void;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ setView }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<{ time: string; text: string; speaker: string }[]>([]);
  const [knownSpeakers, setKnownSpeakers] = useState<string[]>(['Speaker A', 'Speaker B', 'Interviewer', 'Subject']);

  const mockTranscribe = () => {
    setIsTranscribing(true);
    setSegments([]);
    setTimeout(() => {
      setSegments([
        { time: '0:00', speaker: 'Speaker A', text: 'Welcome to the annual tech conference here in San Francisco.' },
        { time: '0:05', speaker: 'Speaker B', text: 'Thank you for having us. It\'s an honor to be on stage.' },
        { time: '0:12', speaker: 'Speaker A', text: 'Today we\'re talking about the future of AI in localization.' },
        { time: '0:18', speaker: 'Speaker B', text: 'Exactly. The speed at which Gemini handles multi-modal inputs is a game changer for real-time diarization.' },
      ]);
      setIsTranscribing(false);
    }, 2500);
  };

  const loadSample = () => {
    setSegments([
      { time: '0:00', speaker: 'Interviewer', text: 'Could you explain the impact of Gemini 3 on legal transcription?' },
      { time: '0:08', speaker: 'Expert A', text: 'The fidelity of legal jargon interpretation has increased by 40% in our latest tests.' },
      { time: '0:15', speaker: 'Interviewer', text: 'And regarding speaker diarization in courtrooms?' },
      { time: '0:22', speaker: 'Expert A', text: 'The system now correctly identifies overlapping speech with sub-millisecond precision.' }
    ]);
    setKnownSpeakers(['Interviewer', 'Expert A', 'Speaker B']);
  };

  const updateSpeaker = (idx: number, newSpeaker: string) => {
    const updated = [...segments];
    updated[idx].speaker = newSpeaker;
    setSegments(updated);
    if (newSpeaker.trim() && !knownSpeakers.includes(newSpeaker.trim())) {
      setKnownSpeakers(prev => [...prev, newSpeaker.trim()].sort());
    }
  };

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-md flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-12">
        <div className="w-full md:w-1/3 h-48 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center group transition-all hover:border-blue-400 relative overflow-hidden">
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" id="media-upload" accept="audio/*,video/*" onChange={mockTranscribe} />
          <div className="relative z-0 space-y-3">
             <i className="ph-bold ph-upload-simple text-5xl text-slate-300 group-hover:text-blue-400 transition-colors"></i>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Recording</p>
          </div>
        </div>
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => setView?.(AppView.DASHBOARD)}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-blue-600 transition-all shadow-brand-sm flex items-center justify-center"
                title="Home"
              >
                <i className="ph-bold ph-house"></i>
              </button>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Advanced Diarization</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
              Extract context and speaker mapping from complex multi-modal media.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={loadSample} className="px-6 py-2.5 bg-slate-800 text-white text-[10px] font-black rounded-xl border border-slate-700 uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all flex items-center space-x-2">
              <i className="ph ph-magic-wand"></i>
              <span>Load Sample</span>
            </button>
            <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-black rounded-lg border border-blue-100 dark:border-blue-800 uppercase tracking-widest">Diarization v2</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div><span className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Transcript Engine</span></div>
          <button className="h-[44px] px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-brand-md transition-all flex items-center justify-center">Export Results</button>
        </div>
        
        <div className="flex-1 p-6 sm:p-10 space-y-12 max-w-4xl mx-auto w-full">
          {isTranscribing ? (
            <div className="space-y-12 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-6 animate-in fade-in duration-500">
                  <div className="w-16 h-6 skeleton rounded-sm shrink-0"></div>
                  <div className="flex-1 space-y-4">
                    <div className="w-32 h-8 skeleton rounded-sm"></div>
                    <div className="space-y-2"><div className="w-full h-4 skeleton rounded-sm"></div></div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                 <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Running Analysis...</p>
              </div>
            </div>
          ) : segments.length > 0 ? (
            <div className="space-y-12 animate-in fade-in duration-700">
              {segments.map((s, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-8 group">
                  <div className="w-16 text-[11px] font-black font-mono text-slate-300 dark:text-slate-600 sm:pt-4 shrink-0 sm:text-right">{s.time}</div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center space-x-4 mb-4">
                       <input 
                         list="speakers-list"
                         value={s.speaker}
                         onChange={(e) => updateSpeaker(idx, e.target.value)}
                         className="bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest h-[40px] px-4 rounded-xl border border-transparent focus:border-blue-400 focus:bg-white transition-all w-44 shadow-brand-sm min-h-[44px]"
                       />
                       <datalist id="speakers-list">{knownSpeakers.map(name => <option key={name} value={name} />)}</datalist>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 transition-colors"></div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed tracking-tight font-medium px-1 group-hover:text-slate-900 transition-colors">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300 text-center">
              <i className="ph ph-waveform-slash text-6xl mb-6"></i>
              <p className="text-xl font-black text-slate-400 uppercase tracking-tighter">Queue Empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
