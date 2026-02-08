
import React, { useState, useEffect, useRef } from 'react';

interface Subtitle {
  id: number;
  time: number;
  text: {
    en: string;
    es: string;
    jp: string;
  };
  aiInsight: {
    mapping: number;
    neutrality: number;
    arc: number;
    comment: string;
  };
}

const tourMetadata: Subtitle[] = [
  { 
    id: 1, 
    time: 1, 
    text: { en: "Welcome to LingoPro, the frontier of global communication.", es: "Bienvenido a LingoPro, la frontera de la comunicación global.", jp: "グローバル・コミュニケーションの最前線、LingoProへようこそ。" },
    aiInsight: { mapping: 98, neutrality: 100, arc: 40, comment: "Detecting brand tone: Professional & Innovative." }
  },
  { 
    id: 2, 
    time: 5, 
    text: { en: "Powered by Gemini 3, we offer zero-latency interpreting.", es: "Impulsado por Gemini 3, ofrecemos interpretación de latencia cero.", jp: "Gemini 3を搭載し、遅延ゼロの通訳を提供します。" },
    aiInsight: { mapping: 99, neutrality: 95, arc: 65, comment: "Live Audio Modality processing active." }
  },
  { 
    id: 3, 
    time: 9, 
    text: { en: "Scale your message to every market with visual fidelity.", es: "Escala tu mensaje a todos los mercados con fidelidad visual.", jp: "視覚的な忠実度を保ちながら、あらゆる市場にメッセージを拡大します。" },
    aiInsight: { mapping: 92, neutrality: 98, arc: 85, comment: "Analyzing visual semantic anchors in the ad view." }
  },
  { 
    id: 4, 
    time: 13, 
    text: { en: "LingoPro: The World in Every Tongue.", es: "LingoPro: El Mundo en Cada Lengua.", jp: "LingoPro：あらゆる言語で世界を。" },
    aiInsight: { mapping: 100, neutrality: 100, arc: 95, comment: "Global compliance check: 100% suitability." }
  },
];

const ProductTourModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lang, setLang] = useState<'en' | 'es' | 'jp'>('en');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentData, setCurrentData] = useState<Subtitle | null>(null);

  useEffect(() => {
    // Cleanup function to prevent "interrupted by media removal" errors
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        // Remove source and load to fully stop the element
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setProgress(time);
      
      // Find the metadata entry for the current time
      const active = [...tourMetadata].reverse().find(s => time >= s.time);
      setCurrentData(active || null);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Play was prevented (e.g. by closing the modal or browser policy)
            console.debug("Playback interrupted or prevented:", error);
          });
        }
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setProgress(val);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-6xl aspect-video bg-slate-900 rounded-[3rem] shadow-[0_64px_128px_-16px_rgba(0,0,0,0.6)] overflow-hidden border border-slate-800 flex flex-col group animate-in zoom-in duration-700">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 w-12 h-12 glass rounded-full flex items-center justify-center text-white hover:bg-brand-blue transition-all"
        >
          <i className="ph-bold ph-x text-2xl"></i>
        </button>

        {/* Video Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center">
          
          {/* THE REAL VIDEO ELEMENT */}
          <video 
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            className="w-full h-full object-cover opacity-60"
            playsInline
            poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000"
          >
            {/* User: Replace the src below with your uploaded .mp4 URL */}
            <source src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-laptop-34440-large.mp4" type="video/mp4" />
          </video>

          {/* Overlay Graphics for "High Tech" feel */}
          <div className="absolute inset-0 pointer-events-none border-[24px] border-slate-950/20">
             <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-brand-blue/40"></div>
             <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brand-blue/40"></div>
             <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brand-blue/40"></div>
             <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-brand-blue/40"></div>
          </div>

          {!isPlaying && progress === 0 && (
             <button onClick={togglePlay} className="absolute z-10 w-24 h-24 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <i className="ph-fill ph-play text-4xl ml-1"></i>
             </button>
          )}

          {/* Cinematic Subtitles Overlay */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center px-6 z-20">
            <div className={`transition-all duration-500 transform ${currentData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-block px-8 py-4 glass text-white text-xl font-bold rounded-2xl shadow-2xl border-white/10">
                {currentData?.text[lang]}
              </span>
            </div>
          </div>

          {/* AI Insight Sidebar (Synced to Video Metadata) */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-950/40 backdrop-blur-md border-l border-white/5 p-8 flex flex-col justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-700 delay-150 z-30">
             <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] mb-6">AI Context Stream</h4>
             <div className="space-y-6">
                <div className="space-y-2">
                   <div className="flex justify-between">
                     <p className="text-white text-xs font-bold">Semantic Depth</p>
                     <span className="text-brand-blue text-[10px] font-black">{currentData?.aiInsight.mapping || 0}%</span>
                   </div>
                   <div className="h-1 w-full bg-slate-800 rounded-full">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${currentData?.aiInsight.mapping || 0}%` }}></div>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between">
                     <p className="text-white text-xs font-bold">Cultural Variance</p>
                     <span className="text-brand-blue text-[10px] font-black">{currentData?.aiInsight.neutrality || 0}%</span>
                   </div>
                   <div className="h-1 w-full bg-slate-800 rounded-full">
                      <div className="h-full bg-brand-blue rounded-full transition-all duration-500" style={{ width: `${currentData?.aiInsight.neutrality || 0}%` }}></div>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between">
                     <p className="text-white text-xs font-bold">Emotional Arc</p>
                     <span className="text-brand-blue text-[10px] font-black">{currentData?.aiInsight.arc || 0}%</span>
                   </div>
                   <div className="h-1 w-full bg-slate-800 rounded-full">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${currentData?.aiInsight.arc || 0}%` }}></div>
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic mt-8 border-t border-white/5 pt-6 h-20">
                  {currentData?.aiInsight.comment || "Waiting for stream start..."}
                </p>
                <div className="flex items-center space-x-2 bg-brand-blue/5 border border-brand-blue/10 p-3 rounded-xl">
                   <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></div>
                   <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Processing Frames</span>
                </div>
             </div>
          </div>
        </div>

        {/* Custom Controls Bar */}
        <div className="p-8 bg-slate-900 border-t border-slate-800 flex items-center space-x-8 z-40 relative">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 hover:scale-105 transition-transform"
          >
            <i className={`ph-fill ${isPlaying ? 'ph-pause' : 'ph-play'} text-2xl`}></i>
          </button>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span>LingoPro Technical Deep Dive</span>
              <span>0:{Math.floor(progress).toString().padStart(2, '0')} / 0:{Math.floor(duration).toString().padStart(2, '0')}</span>
            </div>
            <div className="relative flex items-center h-2">
               <input 
                type="range" 
                min="0" 
                max={duration} 
                step="0.1"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
               />
               <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-brand-blue shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                   style={{ width: `${(progress / duration) * 100}%` }}
                 ></div>
               </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
             {(['en', 'es', 'jp'] as const).map(l => (
               <button 
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  lang === l ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
               >
                 {l}
               </button>
             ))}
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
             <i className="ph-bold ph-closed-captioning text-2xl text-brand-blue"></i>
             <i className="ph-bold ph-speaker-high text-2xl"></i>
             <i className="ph-bold ph-corners-out text-2xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTourModal;
