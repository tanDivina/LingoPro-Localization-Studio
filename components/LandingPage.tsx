
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
    }, 3000);
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
      
      {/* Background Animated Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-float"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass px-6 py-4 rounded-3xl shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">L</div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">LingoPro <span className="text-slate-400 font-light hidden sm:inline">Localization Suite</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onEnter(AppView.DASHBOARD)} 
              className="text-sm font-bold text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-widest"
            >
              Platform
            </button>
            <button 
              onClick={() => onEnter(AppView.DOCUMENTATION)} 
              className="text-sm font-bold text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-widest"
            >
              Documentation
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-bold text-slate-500 hover:text-brand-blue transition-colors uppercase tracking-widest"
            >
              Features
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-brand-blue transition-colors">
              <i className={`ph-bold ${isDarkMode ? 'ph-sun' : 'ph-moon'} text-xl`}></i>
            </button>
            <button 
              onClick={() => onEnter(AppView.DASHBOARD)}
              className="px-6 py-2.5 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:shadow-brand-blue/30 transition-all transform hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-8 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Hero Left */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8 animate-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-brand-blue text-xs font-black uppercase tracking-[0.2em] sticker-gloss">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
              </span>
              <span>Gemini 3 Powered Suite</span>
            </div>
            <h1 className="text-7xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
              The World <br /> <span className="text-brand-blue">In Every Tongue.</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-medium">
              Enterprise-grade translation engine powered by Gemini Live API. From live interpreting to visual ad adaptation—LingoPro is your global bridge.
            </p>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => onEnter(AppView.DASHBOARD)}
                className="liquid-fill px-10 py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 hover:shadow-brand-blue/20"
              >
                Launch Console
              </button>
              <button 
                onClick={() => setShowTourModal(true)}
                className="flex items-center space-x-3 text-slate-900 dark:text-white font-bold hover:text-brand-blue transition-colors group"
              >
                <div className="w-12 h-12 glass rounded-full flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl">
                  <i className="ph-bold ph-play"></i>
                </div>
                <span>Watch Product Tour</span>
              </button>
            </div>
          </div>

          {/* Hero Right - Logic Metaphor */}
          <div className="lg:col-span-7 relative h-[600px] animate-in zoom-in duration-1000">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-6">
              
              {/* Source Card */}
              <div className="col-span-1 row-span-2 glass rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl relative z-10 overflow-hidden">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-brand-blue rounded-3xl flex items-center justify-center text-white shadow-xl">
                    <i className="ph-bold ph-globe text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Source <br />Origin</h3>
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-2 tracking-widest">Original Context</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight italic">"Empowering the world through seamless AI communication."</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">
                  <span>US-EN Cluster</span>
                </div>
                {/* Connector Beam SVG */}
                <svg className="absolute top-1/2 left-full -translate-y-1/2 overflow-visible pointer-events-none" width="400" height="400" viewBox="0 0 400 400">
                  <path d="M0,0 Q200,0 300,100" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-blue/20" />
                  <path d="M0,0 Q200,0 300,100" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 1000" className="animate-beam-flow" />
                </svg>
              </div>

              {/* Output Cards */}
              <div className="space-y-6">
                <div className="glass rounded-[2rem] p-8 shadow-xl transform hover:-translate-y-2 transition-transform">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs">JP</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tokyo Hub</span>
                  </div>
                  <p className={`text-lg font-bold text-slate-800 dark:text-white kinetic-text ${beamActive ? 'opacity-100 blur-0' : 'opacity-40 blur-sm'}`}>
                    シームレスなAI通信を通じて世界を力づける。
                  </p>
                </div>
                <div className="glass rounded-[2rem] p-8 shadow-xl transform hover:-translate-y-2 transition-transform" style={{ transitionDelay: '0.1s' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs">ES</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Madrid Hub</span>
                  </div>
                  <p className={`text-lg font-bold text-slate-800 dark:text-white kinetic-text ${beamActive ? 'opacity-100 blur-0' : 'opacity-40 blur-sm'}`}>
                    Empoderando al mundo a través de la comunicación fluida de la IA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="relative z-10 px-8 py-32 bg-slate-50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em]">Expert Architecture</h2>
             <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">The Frontier of AI Localization</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">A unified suite designed for high-fidelity content adaptation across every medium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {featureCards.map((f, i) => (
               <div 
                 key={i} 
                 onClick={() => onEnter(f.id)}
                 className="group p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2"
               >
                  <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-white shadow-xl mb-8 group-hover:scale-110 transition-transform`}>
                     <i className={`ph-bold ${f.icon} text-2xl`}></i>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{f.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{f.desc}</p>
                  <div className="flex items-center space-x-2 text-brand-blue text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                     <span>Launch Module</span>
                     <i className="ph-bold ph-arrow-right"></i>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="space-y-4">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Platform</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onEnter(AppView.FILE_TRANSLATOR)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">File Translation</button></li>
                <li><button onClick={() => onEnter(AppView.LIVE_INTERPRETER)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Live Interpreting</button></li>
                <li><button onClick={() => onEnter(AppView.VOICEOVER_STUDIO)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Voiceover Studio</button></li>
                <li><button onClick={() => onEnter(AppView.AD_LOCALIZATION)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Ad Adaptation</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Resources</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Knowledge Base</button></li>
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Developer Docs</button></li>
                <li><button onClick={() => onEnter(AppView.DOCUMENTATION)} className="text-sm text-slate-500 hover:text-brand-blue transition-colors text-left">Security Whitepaper</button></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-slate-500 hover:text-brand-blue transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-brand-blue transition-colors">Global Network</a></li>
                <li><a href="#" className="text-sm text-slate-500 hover:text-brand-blue transition-colors">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-blue rounded flex items-center justify-center text-white font-black italic">L</div>
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">LingoPro</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The definitive suite for global localized assets. Built on Gemini 3 architecture for unmatched linguistic precision.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2025 LingoPro Localization Suite • v4.2.0-Production</p>
            <div className="flex space-x-6">
              <i className="ph-bold ph-twitter-logo text-slate-400 hover:text-brand-blue cursor-pointer"></i>
              <i className="ph-bold ph-linkedin-logo text-slate-400 hover:text-brand-blue cursor-pointer"></i>
              <i className="ph-bold ph-github-logo text-slate-400 hover:text-brand-blue cursor-pointer"></i>
            </div>
          </div>
        </div>
      </footer>

      {showTourModal && <ProductTourModal onClose={() => setShowTourModal(false)} />}
    </div>
  );
};

export default LandingPage;
