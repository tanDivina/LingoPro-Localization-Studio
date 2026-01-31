
import React, { useState } from 'react';

const TranscriptionView: React.FC = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<{ time: string; text: string; speaker: string }[]>([]);
  const [knownSpeakers, setKnownSpeakers] = useState<string[]>(['Speaker A', 'Speaker B', 'Interviewer', 'Subject']);

  const mockTranscribe = () => {
    setIsTranscribing(true);
    // Simulate API call to Gemini 3 Flash
    setTimeout(() => {
      setSegments([
        { time: '0:00', speaker: 'Speaker A', text: 'Welcome to the annual tech conference here in San Francisco.' },
        { time: '0:05', speaker: 'Speaker B', text: 'Thank you for having us. It\'s an honor to be on stage.' },
        { time: '0:12', speaker: 'Speaker A', text: 'Today we\'re talking about the future of AI in localization.' },
        { time: '0:18', speaker: 'Speaker B', text: 'Exactly. The speed at which Gemini handles multi-modal inputs is a game changer for real-time diarization.' },
      ]);
      setIsTranscribing(false);
    }, 2000);
  };

  const updateSpeaker = (idx: number, newSpeaker: string) => {
    const updated = [...segments];
    updated[idx].speaker = newSpeaker;
    setSegments(updated);
    
    // Auto-update known speakers list dynamically
    if (newSpeaker.trim() && !knownSpeakers.includes(newSpeaker.trim())) {
      setKnownSpeakers(prev => [...prev, newSpeaker.trim()].sort());
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="w-full md:w-1/3 p-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center group transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
          <svg className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Upload Audio/Video</p>
          <input type="file" className="hidden" id="media-upload" accept="audio/*,video/*" onChange={mockTranscribe} />
          <label htmlFor="media-upload" className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm">Choose File</label>
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Advanced Transcription</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Utilize Gemini's native multi-modal capabilities to extract text with speaker diarization. Supports timestamping and emotional context detection for more accurate localizations.</p>
          <div className="flex space-x-3">
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-100 dark:border-indigo-800 uppercase tracking-tight">Auto-Diarization</span>
            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-100 dark:border-green-800 uppercase tracking-tight">Sentiment Analysis</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Transcript Editor</span>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>Speaker Diarization Active</span>
             </div>
             <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline transition-colors">Export as VTT/SRT</button>
          </div>
        </div>
        
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
          {isTranscribing ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Analyzing audio modalities with Gemini 3 Flash...</p>
            </div>
          ) : segments.length > 0 ? (
            <div className="space-y-10 animate-in fade-in duration-700">
              {segments.map((s, idx) => (
                <div key={idx} className="flex space-x-6 group">
                  <div className="w-16 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-600 pt-1 shrink-0 text-right">{s.time}</div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center space-x-4 mb-3">
                       <div className="relative">
                          <input 
                            list="speakers-list"
                            value={s.speaker}
                            onChange={(e) => updateSpeaker(idx, e.target.value)}
                            className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 border-transparent focus:border-indigo-400 dark:focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all w-36 shadow-sm"
                            placeholder="Assign Speaker"
                          />
                          <datalist id="speakers-list">
                            {knownSpeakers.map(name => <option key={name} value={name} />)}
                          </datalist>
                       </div>
                       <div className="h-px flex-1 bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 transition-colors"></div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed tracking-tight px-1">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300 dark:text-slate-700">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <p className="text-xl font-bold text-slate-400 dark:text-slate-600">No transcript active</p>
              <p className="text-sm mt-2">Upload a master recording to begin expert localization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;
