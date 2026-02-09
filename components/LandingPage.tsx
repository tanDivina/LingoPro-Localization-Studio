import React, { useState, useEffect, useMemo } from 'react';
import { AppView } from '../types';
import ProductTourModal from './ProductTourModal';

interface LandingPageProps {
  onEnter: (view?: AppView) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, toggleTheme, isDarkMode }) => {
  const [showTourModal, setShowTourModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for the shrinking logo effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing Effect Logic
  const phrases = useMemo(() => [
    "The World In Every Tongue.",
    "El Mundo En Cada Lengua.",
    "あらゆる言語で、世界を。",
    "Le Monde Dans Chaque Langue.",
    "Die Welt In Jeder Sprache."
  ], []);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[phraseIndex];
      
      if (!isDeleting) {
        setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
        setTypingSpeed(100);
        if (displayedText === currentPhrase) {
          setIsDeleting(true);
          setTypingSpeed(2500);
        }
      } else {
        setDisplayedText(currentPhrase.substring(0, displayedText.length - 1));
        setTypingSpeed(40);
        if (displayedText === "") {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(500);
        }
      }
    };
    const timeout = setTimeout(handleTyping, typingSpeed);
    return () => timeout && clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex, phrases, typingSpeed]);

  const featureCards = [
    { id: AppView.FILE_TRANSLATOR, title: "File Translator", desc: "Process regular DOCX, XLIFF, and PDF with AI-powered source quality checks and consistency analysis.", icon: "ph-file-doc", color: "bg-blue-500" },
    { id: AppView.LIVE_INTERPRETER, title: "Live Interpreter", desc: "Zero-latency verbal translation via Gemini Live API. Real-time global communication redefined.", icon: "ph-microphone-stage", color: "bg-blue-600" },
    { id: AppView.VOICEOVER_STUDIO, title: "Voiceover Studio", desc: "Neural synthesis and vocal cloning. Generate high-fidelity localized audio for global assets.", icon: "ph-broadcast", color: "bg-sky-500" },
    { id: AppView.AD_LOCALIZATION, title: "Ad Localization", desc: "Automated VFX overlays for marketing material. Adapt visual markers for any market locale.", icon: "ph-eye", color: "bg-emerald-500" },
    { id: AppView.TRANSCRIPTION, title: "Smart Transcription", desc: "Expert speaker diarization and temporal anchoring for complex multi-modal media.", icon: "ph-list-numbers", color: "bg-amber-500" },
    { id: AppView.NUANCE_GUARD, title: "Nuance Guard", desc: "Cultural suitability analysis. Detect taboos and idiomatic friction before deployment.", icon: "ph-shield-check", color: "bg-red-500" }
  ];

  const techSpecs = [
    { label: "Perfect Document Layout", icon: "ph-layout" },
    { label: "Global Brand Consistency", icon: "ph-seal-check" },
    { label: "Natural Sounding Audio", icon: "ph-speaker-high" },
    { label: "Expert Human Review", icon: "ph-user-check" },
    { label: "Any Language Any Market", icon: "ph-globe" },
    { label: "Instant Global Reach", icon: "ph-rocket" }
  ];

  return (
    <div className="relative min-h-screen bg-brand-mist dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <div className="spotlight-overlay"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-float"></div>
      </div>

      <nav className={`fixed top-0 left-0 w-full z-50 px-4 sm:px-8 transition-all duration-500 ${isScrolled ? 'py-4 sm:py-6' : 'py-8 sm:py-12'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between glass px-6 sm:px-8 rounded-full shadow-brand-xl border border-white/20 dark:border-slate-800/30 transition-all duration-500 ${isScrolled ? 'py-3 sm:py-4' : 'py-5 sm:py-8'}`}>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className={`bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg relative transition-all duration-500 ${isScrolled ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-14 h-14 sm:w-20 sm:h-20'}`}>
              <i className={`ph-bold ph-globe animate-spin-slow transition-all duration-500 ${isScrolled ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-5xl'}`}></i>
            </div>
            <div className="transition-all duration-500">
              <span className={`block font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-all duration-500 ${isScrolled ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>LingoPro</span>
              <span className={`block font-black text-slate-400 uppercase tracking-widest transition-all duration-500 ${isScrolled ? 'text-[7px] sm:text-[9px] mt-0.5' : 'text-[9px] sm:text-xs mt-1'}`}>Localization Suite</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-8">
            <button onClick={toggleTheme} className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-blue transition-colors">
              <i className={`ph-bold ${isDarkMode ? 'ph-sun' : 'ph-moon'} text-xl sm:text-2xl`}></i>
            </button>
            <button onClick={() => onEnter(AppView.DASHBOARD)} className={`bg-brand-blue text-white font-black uppercase tracking-widest rounded-full shadow-xl hover:shadow-brand-blue/40 transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap border border-white/10 ${isScrolled ? 'px-6 py-2.5 text-[9px]' : 'px-10 py-4 text-[11px]'}`}>Enter App</button>
          </div>
        </div>
      </nav>

      <section className="relative pt-[280px] pb-[160px] px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <div className="flex flex-col items-center space-y-12 animate-in slide-in-from-bottom duration-1000 w-full">
            <h1 className="text-6xl sm:text-9xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter min-h-[1.5em] w-full max-w-6xl">
              <span className="inline-block">
                {displayedText}
                <span className="text-brand-blue animate-pulse ml-1">|</span>
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed font-medium">
              Enterprise-grade localization engine powered by Gemini 3. High-precision document reconstruction and zero-latency vocal interpreting.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-12 mb-12">
              <button onClick={() => onEnter(AppView.DASHBOARD)} className="w-full sm:w-auto px-16 py-7 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-3xl transition-all transform hover:-translate-y-1.5 shadow-brand-xl active:scale-95">Launch Console</button>
              <button onClick={() => setShowTourModal(true)} className="flex items-center space-x-4 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors group">
                <div className="w-14 h-14 glass rounded-full flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl border border-white/20"><i className="ph-fill ph-play text-xl ml-1"></i></div>
                <span>Product Tour</span>
              </button>
            </div>
          </div>

          {/* Neural Feature Marquee Visual */}
          <div className="w-full relative mt-20 animate-in zoom-in duration-1000 flex flex-col items-center justify-center overflow-hidden py-12">
            <div className="w-screen space-y-8 relative">
              
              {/* Fade Edges Mask */}
              <div className="absolute inset-y-0 left-0 w-48 sm:w-80 bg-gradient-to-r from-brand-mist dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-48 sm:w-80 bg-gradient-to-l from-brand-mist dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>

              {/* Row 1: Core Features (Primary Focus) - Clickable */}
              <div className="flex space-x-8 animate-marquee whitespace-nowrap">
                {[...featureCards, ...featureCards].map((f, i) => (
                  <button 
                    key={i} 
                    onClick={() => onEnter(f.id)}
                    className="inline-flex items-center space-x-6 glass px-12 py-8 rounded-[3rem] border-white/40 border shadow-brand-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all hover:scale-105 group active:scale-95"
                  >
                    <div className={`w-14 h-14 ${f.color} rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:shadow-brand-blue/20 transition-all`}>
                      <i className={`ph-bold ${f.icon} text-3xl`}></i>
                    </div>
                    <span className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{f.title}</span>
                  </button>
                ))}
              </div>

              {/* Row 2: Approachable Benefits (Secondary focus - Smaller scale) - Non-clickable */}
              <div className="flex space-x-6 animate-marquee whitespace-nowrap" style={{ animationDirection: 'reverse', animationDuration: '50s' }}>
                {[...techSpecs, ...techSpecs].map((s, i) => (
                  <div key={i} className="inline-flex items-center space-x-4 glass px-8 py-5 rounded-[2rem] border-white/40 border shadow-brand-md opacity-80">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
                      <i className={`ph-bold ${s.icon} text-xl`}></i>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{s.label}</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 dark:opacity-10">
               <div className="w-[800px] h-[800px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-full animate-spin-slow"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-8 py-40 sm:py-48 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32 space-y-6">
             <h2 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]">Expert Infrastructure</h2>
             <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">The Frontier of AI Localization</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl font-medium">An expert-grade localization platform for high-precision content adaptation across every medium.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {featureCards.map((f, i) => (
               <div key={i} onClick={() => onEnter(f.id)} className="group p-14 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer hover:-translate-y-3 feature-card">
                  <div className={`w-14 h-14 ${f.color} rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl mb-[32px] group-hover:scale-110 transition-transform duration-500`}><i className={`ph-bold ${f.icon} text-2xl`}></i></div>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">{f.title}</h4>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-10 font-medium">{f.desc}</p>
                  <div className="flex items-center space-x-3 text-brand-blue text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                     <span>Launch Module</span>
                     <i className="ph-bold ph-arrow-right text-lg"></i>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-8 py-32 sm:py-48 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 overflow-hidden min-h-[500px] flex items-center justify-center">
        {/* Massive Background Marquee: "LINGOPRO" layer */}
        <div className="absolute inset-0 flex items-center overflow-hidden opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="animate-marquee flex whitespace-nowrap" style={{ animationDuration: '60s' }}>
            {[...Array(2)].map((_, i) => (
              <span key={i} className="text-[15rem] sm:text-[28rem] font-black uppercase tracking-tighter px-20">
                LINGOPRO
              </span>
            ))}
          </div>
        </div>

        {/* Foreground Layer: "FOR AND BY TRANSLATORS" lowered relative to the background LingoPro */}
        <div className="relative z-10 w-full flex flex-col items-center text-center">
          <div className="w-full overflow-hidden py-10 opacity-40 hover:opacity-100 transition-all duration-500 transform translate-y-16 sm:translate-y-24">
            <div className="animate-marquee flex whitespace-nowrap" style={{ animationDuration: '40s' }}>
              {[...Array(3)].map((_, i) => (
                <span key={i} className="text-5xl sm:text-8xl font-black uppercase tracking-tighter px-32 flex items-center">
                  <span className="text-brand-blue">FOR AND BY TRANSLATORS</span>
                </span>
              ))}
            </div>
          </div>

          <div className="max-w-xl mx-auto mt-24">
            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 w-full flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  © 2026 LingoPro • Built by <a href="https://www.linkedin.com/in/dorien-van-den-abbeele-136170b/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition-colors underline decoration-brand-blue/30">Dorien Van den Abbeele</a>
                </p>
                <a 
                  href="https://github.com/tanDivina/LingoPro-Localization-Studio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-300 hover:text-brand-blue transition-all transform hover:scale-110 active:scale-95"
                  title="View on GitHub"
                >
                  <i className="ph-fill ph-github-logo text-2xl"></i>
                </a>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-40">
                Powered by Gemini 3 architecture for unmatched linguistic precision.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {showTourModal && <ProductTourModal onClose={() => setShowTourModal(false)} />}
    </div>
  );
};

export default LandingPage;
