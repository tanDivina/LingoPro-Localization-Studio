
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import ProductTourModal from './ProductTourModal';

interface LandingPageProps {
  onEnter: (view?: AppView) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, toggleTheme, isDarkMode }) => {
  const [beamActive, setBeamActive] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setBeamActive(prev => !prev);
    }, 4000); 
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featureCards = [
    {
      id: AppView.FILE_TRANSLATOR,
      title: "File Translator",
      desc: "Process regular DOCX, XLIFF, and PDF with AI-powered source quality checks and consistency analysis.",
      icon: "ph-file-doc",
      color: "bg-blue-500"
    },
    {
      id: AppView.LIVE_INTERPRETER,
      title: "Live Interpreter",
      desc: "Zero-latency verbal translation via Gemini Live API. Real-time global communication redefined.",
      icon: "ph-microphone-stage",
      color: "bg-indigo-500"
    },
    {
      id: AppView.VOICEOVER_STUDIO,
      title: "Voiceover Studio",
      desc: "Neural synthesis and vocal cloning. Generate high-fidelity localized audio for global assets.",
      icon: "ph-broadcast",
      color: "bg-violet-500"
    },
    {
      id: AppView.AD_LOCALIZATION,
      title: "Ad Localization",
      desc: "Automated VFX overlays for marketing material. Adapt visual markers for any market locale.",
      icon: "ph-eye",
      color: "bg-emerald-500"
    },
    {
      id: AppView.TRANSCRIPTION,
      title: "Smart Transcription",
      desc: "Expert speaker diarization and temporal anchoring for complex multi-modal media.",
      icon: "ph-list-numbers",
      color: "bg-amber-500"
    },
    {
      id: AppView.NUANCE_GUARD,
      title: "Nuance Guard",
      desc: "Cultural suitability analysis. Detect taboos and idiomatic friction before deployment.",
      icon: "ph-shield-check",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="relative min-h-screen bg-brand-mist dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <div className="spotlight-overlay"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-float"></div>
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass px-8 py-5 rounded-[2rem] shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">L</div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">LingoPro <span className="text-slate-400 font-light hidden sm:inline">Localization Suite</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            <button 
              onClick={() => onEnter(AppView.DASHBOARD)} 
              className="text-[10px] font-black text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-[0.2em]"
            >
              Platform
            </button>
            <button 
              onClick={() => onEnter(AppView.DOCUMENTATION)} 
              className="text-[10px] font-black text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-[0.2em]"
            >
              Knowledge Base
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-[10px] font-black text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-[0.2em]"
            >
              Expert Suite
            </button>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
              <i className={`ph-bold ${isDarkMode ? 'ph-sun' : 'ph-moon'} text-2xl`}></i>
            </button>
            <button 
              onClick={() => onEnter(AppView.DASHBOARD)}
              className="px-8 py-3 bg-brand-blue text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-brand-blue/40 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-[200px] pb-[160px] px-8 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          <div className="lg:col-span-5 flex flex-col justify-center space-y-12 animate-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center space-x-3 bg-indigo-500/10 border border-indigo-500/20 px-5 py-2 rounded-full text-brand-blue text-[10px] font-black uppercase tracking-[0.3em] sticker-gloss">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
              </span>
              <span>Gemini 3 Expert Architecture</span>
            </div>
            <h1 className="text-8xl font-black text-slate-900 dark:text-white leading-[0.85] tracking-tighter">
              The World <br /> <span className="text-brand-blue">In Every Tongue.</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
              Enterprise-grade localization engine powered by Gemini Live API. From sub-millisecond interpreting to visual ad adaptation—LingoPro is the global standard.
            </p>
            <div className="flex items-center space-x-10">
              <button 
                onClick={() => onEnter(AppView.DASHBOARD)}
                className="liquid-fill px-12 py-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-[2rem] transition-all transform hover:-translate-y-2 shadow-[0_20px_40px_rgba(59,130,246,0.3)] active:scale-95 button-primary"
              >
                Launch Console
              </button>
              <button 
                onClick={() => setShowTourModal(true)}
                className="flex items-center space-x-4 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors group"
              >
                <div className="w-14 h-14 glass rounded-full flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all shadow-2xl">
                  <i className="ph-fill ph-play text-xl ml-1"></i>
                </div>
                <span>Product Tour</span>
              </button>
            </div>
          </div>

          {/* REFINED HERO GRAPHIC SECTION */}
          <div className="lg:col-span-7 relative h-[650px] animate-in zoom-in duration-1000">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-10">
              
              {/* STUDIO MASTER CARD (SOURCE) */}
              <div className="col-span-1 row-span-2 glass rounded-[4rem] p-12 flex flex-col justify-between shadow-2xl relative z-10 overflow-hidden border-white/30 border-2">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="w-18 h-18 bg-brand-blue rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ring-4 ring-brand-blue/20">
                      <i className="ph-bold ph-broadcast text-4xl"></i>
                    </div>
                    <div className="text-right">
                       <span className="block text-[10px] font-black text-brand-blue uppercase tracking-widest">Studio Master</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EN-US Audio/Text</span>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Global <br />Source</h3>
                  
                  <div className="bg-white/50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue/20">
                       <div className="h-full bg-brand-blue animate-shimmer" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-[10px] text-brand-blue font-black uppercase mb-4 tracking-widest">Context Anchor Injection</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight italic tracking-tight">"Empowering the world through seamless AI communication."</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span>Master Stream Active</span>
                  </div>
                </div>
                
                {/* NEURAL BEAM CONNECTION */}
                <svg className="absolute top-1/2 left-full -translate-y-1/2 overflow-visible pointer-events-none" width="400" height="400" viewBox="0 0 400 400">
                  <path d="M0,0 Q150,-100 300,-150" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-blue/10" />
                  <path d="M0,0 Q150,100 300,150" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-blue/10" />
                  
                  {/* Animated Beams */}
                  <path d="M0,0 Q150,-100 300,-150" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="20 1000" className="animate-beam-flow opacity-60 shadow-[0_0_10px_#3b82f6]" />
                  <path d="M0,0 Q150,100 300,150" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="20 1000" className="animate-beam-flow opacity-60 shadow-[0_0_10px_#3b82f6]" style={{ animationDelay: '1.5s' }} />
                </svg>
              </div>

              {/* ADAPTED LOCALE NODES */}
              <div className="space-y-10">
                {/* TOKYO CLUSTER */}
                <div className={`glass rounded-[3rem] p-10 shadow-xl transform hover:-translate-y-2 transition-all border-white/30 border-2 relative overflow-hidden ${beamActive ? 'ring-4 ring-brand-blue/10' : ''}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black">JP</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tokyo Node</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">99.8% FIDELITY</span>
                  </div>
                  
                  <div className="relative">
                    {!beamActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100/10 backdrop-blur-sm z-10 animate-pulse">
                        <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Localizing...</span>
                      </div>
                    )}
                    <p className={`text-xl font-black text-slate-800 dark:text-white transition-all duration-700 leading-snug ${beamActive ? 'opacity-100 blur-none translate-y-0' : 'opacity-10 blur-md translate-y-2'}`}>
                      シームレスなAI通信を通じて世界を力づける。
                    </p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 opacity-40">
                     <span className="text-[8px] font-black uppercase tracking-tighter">Latency: 12ms</span>
                     <i className="ph-bold ph-check-circle text-emerald-500"></i>
                  </div>
                </div>

                {/* MADRID CLUSTER */}
                <div className={`glass rounded-[3rem] p-10 shadow-xl transform hover:-translate-y-2 transition-all border-white/30 border-2 relative overflow-hidden ${beamActive ? 'ring-4 ring-indigo-500/10' : ''}`} style={{ transitionDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg">ES</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Madrid Node</span>
                    </div>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">99.6% FIDELITY</span>
                  </div>
                  
                  <div className="relative">
                    {!beamActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100/10 backdrop-blur-sm z-10 animate-pulse">
                        <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Adapting...</span>
                      </div>
                    )}
                    <p className={`text-xl font-black text-slate-800 dark:text-white transition-all duration-700 leading-snug ${beamActive ? 'opacity-100 blur-none translate-y-0' : 'opacity-10 blur-md translate-y-2'}`}>
                      Empoderando al mundo a través de la comunicación fluida de la IA.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 opacity-40">
                     <span className="text-[8px] font-black uppercase tracking-tighter">Spatial Fit: OK</span>
                     <i className="ph-bold ph-shield-check text-indigo-500"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="relative z-10 px-8 py-40 sm:py-48 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32 space-y-6">
             <h2 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]">Expert Infrastructure</h2>
             <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">The Frontier of AI Localization</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl font-medium">A unified, military-grade suite for high-fidelity adaptation across every medium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {featureCards.map((f, i) => (
               <div 
                 key={i} 
                 onClick={() => onEnter(f.id)}
                 className="group p-14 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer hover:-translate-y-3 feature-card"
               >
                  <div className={`w-14 h-14 ${f.color} rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl mb-[32px] group-hover:scale-110 transition-transform duration-500`}>
                     <i className={`ph-bold ${f.icon} text-2xl`}></i>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">{f.title}</h4>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-10 font-medium">{f.desc}</p>
                  <div className="flex items-center space-x-3 text-brand-blue text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                     <span>Launch Console Module</span>
                     <i className="ph-bold ph-arrow-right text-lg"></i>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-8 py-32 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Core Platform</h4>
              <ul className="space-y-3">
                <li><button onClick={() => onEnter(AppView.FILE_TRANSLATOR)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Document Processing</button></li>
                <li><button onClick={() => onEnter(AppView.LIVE_INTERPRETER)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Real-time Interpreting</button></li>
                <li><button onClick={() => onEnter(AppView.VOICEOVER_STUDIO)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Voice Synthesis</button></li>
                <li><button onClick={() => onEnter(AppView.AD_LOCALIZATION)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Visual Ad Adaptation</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Knowledge Resources</h4>
              <ul className="space-y-3">
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Localization Board Docs</button></li>
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Gemini 3 Integration</button></li>
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors text-left">Security Protocol</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Company Trace</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors">Global Network</a></li>
                <li><a href="#" className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors">Career Pathways</a></li>
                <li><a href="#" className="text-sm font-medium text-slate-400 hover:text-brand-blue transition-colors">Contact Intelligence</a></li>
              </ul>
            </div>
            <div className="space-y-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-blue rounded flex items-center justify-center text-white font-black italic shadow-xl">L</div>
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">LingoPro</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                The definitive suite for global localized assets. Built on Gemini 3 architecture for unmatched linguistic precision and zero-latency performance.
              </p>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2025 LingoPro International • Enterprise v4.2.0-Production Build</p>
            <div className="flex space-x-8">
              <i className="ph-bold ph-twitter-logo text-xl text-slate-300 hover:text-brand-blue cursor-pointer transition-colors"></i>
              <i className="ph-bold ph-linkedin-logo text-xl text-slate-300 hover:text-brand-blue cursor-pointer transition-colors"></i>
              <i className="ph-bold ph-github-logo text-xl text-slate-300 hover:text-brand-blue cursor-pointer transition-colors"></i>
            </div>
          </div>
        </div>
      </footer>

      {showTourModal && <ProductTourModal onClose={() => setShowTourModal(false)} />}
    </div>
  );
};

export default LandingPage;
