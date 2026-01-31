
import React, { useState, useMemo } from 'react';

const DocumentationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: 'ph-rocket-launch' },
    { id: 'translation-engine', label: 'Translation Engine', icon: 'ph-translate' },
    { id: 'live-interpreting', label: 'Live Interpreting', icon: 'ph-microphone-stage' },
    { id: 'acoustic-lab', label: 'Acoustic Lab', icon: 'ph-flask' },
    { id: 'visual-vision', label: 'Visual Vision', icon: 'ph-eye' },
    { id: 'glossary-tm', label: 'Glossary & TM', icon: 'ph-books' },
    { id: 'compliance-standards', label: 'Compliance & Standards', icon: 'ph-shield-check' },
    { id: 'security-whitepaper', label: 'Security Whitepaper', icon: 'ph-file-lock' },
  ];

  const currentSectionIndex = useMemo(() => 
    sections.findIndex(s => s.id === activeTab), 
  [activeTab]);

  const nextSection = useMemo(() => 
    sections[currentSectionIndex + 1] || sections[0], 
  [currentSectionIndex]);

  const handleNextChapter = () => {
    setActiveTab(nextSection.id);
    setFeedbackGiven(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHelpfulClick = () => {
    if (feedbackGiven) return;
    setFeedbackGiven(true);
  };

  const handleShareClick = async () => {
    const shareData = {
      title: 'LingoPro Documentation',
      text: `Check out the ${sections[currentSectionIndex].label} section on LingoPro.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'getting-started':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Platform Initiation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Welcome to LingoPro, the frontier of global localization. Our suite is designed for enterprises requiring high-fidelity adaptation across all modalities: text, audio, and visual assets.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                  <i className="ph-bold ph-key text-xl"></i>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">API Authentication</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All expert modules utilize a secure environment variable for API access. Ensure your workspace is configured with valid credentials to unlock Gemini 3 Pro and Live Native Audio capabilities.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                  <i className="ph-bold ph-globe text-xl"></i>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Multi-Regional Edge</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your target locale from the global region menu. LingoPro automatically optimizes its semantic processing based on cultural variances and regional taboos.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest">Technical Stack</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] font-mono rounded-lg border border-white/10">Gemini 3 Pro-Preview</span>
                <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] font-mono rounded-lg border border-white/10">Gemini 2.5 Live Native Audio</span>
                <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] font-mono rounded-lg border border-white/10">React 19 Concurrent Mode</span>
                <span className="px-3 py-1 bg-white/5 text-white/60 text-[10px] font-mono rounded-lg border border-white/10">Tailwind CSS v3</span>
              </div>
            </div>
          </div>
        );
      case 'translation-engine':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Format Mastery & Studio</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The LingoPro Translation Engine utilizes multi-stage semantic anchoring to preserve document structure while adapting linguistic nuances.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <i className="ph-bold ph-file-doc text-3xl text-blue-500 mb-4 block"></i>
                  <h5 className="font-bold text-sm mb-2 uppercase tracking-tighter">DOCX Processing</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Spatial Layout Awareness. Gemini analyzes character counts to ensure text fits perfectly within original layout containers.</p>
               </div>
               <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <i className="ph-bold ph-code text-3xl text-emerald-500 mb-4 block"></i>
                  <h5 className="font-bold text-sm mb-2 uppercase tracking-tighter">XLIFF Integrity</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Supports XLIFF, XLF, and XLZ. Preserves critical XML tags and context markers while allowing granular segment editing.</p>
               </div>
               <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <i className="ph-bold ph-file-pdf text-3xl text-red-500 mb-4 block"></i>
                  <h5 className="font-bold text-sm mb-2 uppercase tracking-tighter">PDF Reconstruction</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">OCR-enhanced localization. Gemini reconstructs text layers while maintaining background asset fidelity.</p>
               </div>
            </div>

            <div className="space-y-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Expert Workflow Protocols</h4>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <i className="ph-bold ph-magnifying-glass"></i>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Global Project Search</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Entering a query in the Translation Studio automatically triggers a project-wide scan. It aggregates matching segments from all files in your queue, allowing you to edit strings across multiple assets without switching files manually.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <i className="ph-bold ph-shield-check"></i>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Consistency Shield (Drift Audit)</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Use the <strong>Global Consistency Check</strong> to detect "Drift"—segments with identical source text but conflicting translations. The Shield provides AI resolutions and propagates chosen fixes to every file in the project for 100% terminological unity.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <i className="ph-bold ph-lock-simple-open"></i>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Safety Lock Override</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      By default, units marked with <code>translate="no"</code> or context-only segments are locked. Activate the <strong>Override</strong> toggle to perform surgical edits on protected units. Note: Override mode highlights segments in amber to caution against accidental code corruption.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/50">
               <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">Pro-Tip: Source Pre-Flight</h4>
               <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                 Before translating, run the <strong>Source Readiness Report</strong>. Our AI scans for ambiguity, complex idioms, and grammatical flaws that could hinder translation accuracy. Fixing source issues early ensures a 30% higher target quality score.
               </p>
            </div>
          </div>
        );
      case 'security-whitepaper':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Security & Privacy Whitepaper</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise localization requires military-grade protection. This whitepaper outlines our multi-layered approach to securing your global assets and linguistic data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="ph-bold ph-lock-key text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Data Encryption</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We utilize Hardware Security Modules (HSM) for key management, ensuring your proprietary content remains undecipherable to unauthorized parties.
                </p>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="ph-bold ph-shield-check text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Zero-Retention Policy</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  LingoPro operates on a strict ephemeral data model. Content processed through the Gemini APIs is never used to train foundational models and is purged from memory immediately following session termination.
                </p>
              </div>
            </div>

            <div className="p-10 bg-indigo-950 rounded-[3rem] border border-indigo-900/50 space-y-6">
              <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest">PII & Sensitive Information Masking</h4>
              <p className="text-sm text-indigo-100/70 leading-relaxed">
                Our Pre-Processing Engine automatically detects and redacts Personally Identifiable Information (PII) before it ever reaches the neural translation layer.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Masking Type</p>
                  <p className="text-xs text-white font-bold">Regex & NLP</p>
                </div>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Latency Impact</p>
                  <p className="text-xs text-white font-bold">&lt; 15ms</p>
                </div>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Accuracy</p>
                  <p className="text-xs text-white font-bold">99.9% Recall</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Compliance Certifications</h4>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    <i className="ph-bold ph-certificate"></i>
                  </div>
                  <span className="text-xs font-bold">SOC2 Type II</span>
                </div>
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    <i className="ph-bold ph-certificate"></i>
                  </div>
                  <span className="text-xs font-bold">ISO 27001</span>
                </div>
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    <i className="ph-bold ph-certificate"></i>
                  </div>
                  <span className="text-xs font-bold">HIPAA Compliant</span>
                </div>
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                    <i className="ph-bold ph-certificate"></i>
                  </div>
                  <span className="text-xs font-bold">GDPR Ready</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'live-interpreting':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Live Interp. Protocol</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Gemini 2.5 Live Native Audio is the heart of our verbal bridge. By streaming raw PCM audio, we achieve sub-500ms latency for global communication.
            </p>
          </div>
        );
      case 'acoustic-lab':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Vocal DNA Architecture</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our Voiceover Studio integrates Gemini's multimodal reasoning to analyze and synthesize human-like speech with emotional fidelity.
            </p>
          </div>
        );
      case 'visual-vision':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Visual Ad Adaptation</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              LingoPro leverages Gemini 3 Pro Vision to detect localizable assets within complex video and image frames.
            </p>
          </div>
        );
      case 'glossary-tm':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Glossary & TM Sync</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Ensure 100% terminological consistency across thousands of assets using our Expert Terminology Pool and Translation Memory (TM) logic.
            </p>
          </div>
        );
      case 'compliance-standards':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Compliance & Ethics</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              LingoPro maintains the highest standards for data privacy, ethical AI usage, and linguistic accuracy.
            </p>
          </div>
        );
      default:
        return (
          <div className="py-20 flex flex-col items-center text-center opacity-50">
            <i className="ph ph-books text-6xl text-slate-300 mb-4"></i>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Documentation section under active peer review</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 min-h-[700px] animate-in fade-in duration-700 relative">
      {showShareToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-xs flex items-center space-x-3 animate-in slide-in-from-top-4">
          <i className="ph-bold ph-copy text-lg"></i>
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Search & Internal Nav */}
      <div className="lg:w-72 shrink-0 space-y-8">
        <div className="relative group">
           <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors"></i>
           <input 
            type="text" 
            placeholder="Search manual..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none text-sm font-bold shadow-sm focus:ring-4 focus:ring-brand-blue/10 transition-all"
           />
        </div>

        <nav className="space-y-2">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Reference Guide</h4>
           {sections.map((s) => (
             <button
              key={s.id}
              onClick={() => { setActiveTab(s.id); setFeedbackGiven(false); }}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-3xl text-sm font-bold transition-all border ${
                activeTab === s.id 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-none translate-x-2' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
              }`}
             >
               <i className={`ph-bold ${s.icon} text-xl`}></i>
               <span>{s.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-6 glass rounded-[2rem] border-white/20 space-y-4">
           <div className="flex items-center space-x-2">
              <i className="ph-bold ph-seal-check text-brand-blue"></i>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Certified v4.2</span>
           </div>
           <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
             Expert documentation maintained by the LingoPro Localization Board. Last updated: May 2025.
           </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl">
         <div className="bg-white dark:bg-slate-950/30 rounded-[3rem] p-10 lg:p-16 border border-slate-200 dark:border-slate-800 shadow-sm min-h-full">
            {renderContent()}
         </div>
         
         <div className="mt-12 flex items-center justify-between px-8 pb-8">
            <div className="flex items-center space-x-6">
               <button 
                onClick={handleHelpfulClick}
                className={`flex items-center space-x-2 text-xs font-bold transition-all ${
                  feedbackGiven ? 'text-emerald-500' : 'text-slate-400 hover:text-brand-blue'
                }`}
               >
                  <i className={`ph-bold ${feedbackGiven ? 'ph-check-circle' : 'ph-thumbs-up'}`}></i>
                  <span>{feedbackGiven ? 'Thanks for the feedback!' : 'Was this helpful?'}</span>
               </button>
               <button 
                onClick={handleShareClick}
                className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-brand-blue transition-colors"
               >
                  <i className="ph-bold ph-share-network"></i>
                  <span>Share Section</span>
               </button>
            </div>
            <div className="flex items-center space-x-3">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Next Chapter:</span>
               <button 
                 onClick={handleNextChapter}
                 className="text-xs font-black text-brand-blue uppercase tracking-widest hover:underline"
                >
                  {nextSection.label} →
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DocumentationView;
