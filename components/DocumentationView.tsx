
import React, { useState, useMemo } from 'react';
import { AppView } from '../types';

interface DocumentationViewProps {
  setView?: (view: AppView) => void;
}

const DocumentationView: React.FC<DocumentationViewProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const sections = useMemo(() => [
    { id: 'getting-started', label: 'Getting Started', icon: 'ph-rocket-launch' },
    { id: 'translation-engine', label: 'Translation Engine', icon: 'ph-translate' },
    { id: 'live-interpreting', label: 'Live Interpreting', icon: 'ph-microphone-stage' },
    { id: 'acoustic-lab', label: 'Acoustic Lab', icon: 'ph-flask' },
    { id: 'glossary-tm', label: 'Glossary & TM', icon: 'ph-books' },
    { id: 'compliance-standards', label: 'Compliance & Nuance', icon: 'ph-shield-check' },
    { id: 'agency-infra', label: 'Agency Infrastructure', icon: 'ph-database' },
    { id: 'security-whitepaper', label: 'Security Whitepaper', icon: 'ph-file-lock' },
  ], []);

  const currentSectionIndex = useMemo(() => 
    sections.findIndex(s => s.id === activeTab), 
  [activeTab, sections]);

  const nextSection = useMemo(() => 
    sections[currentSectionIndex + 1] || sections[0], 
  [currentSectionIndex, sections]);

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
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Platform Initiation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                Welcome to LingoPro, the frontier of global localization. Our platform is built on the philosophy of <strong>"The World In Every Tongue."</strong>
              </p>
            </div>
            
            <div className="bg-brand-blue/5 border border-brand-blue/10 p-8 rounded-[2rem] space-y-4">
              <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest">Core Mission</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                LingoPro is an expert-grade suite designed to bridge linguistic divides with zero-latency performance. We treat localization not as a text-replacement task, but as a multi-modal cultural adaptation process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue mb-6">
                  <i className="ph-bold ph-key text-xl"></i>
                </div>
                <h4 className="font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Secure API Integration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  All expert modules utilize a secure environment variable for API access. Ensure your key is scoped for Gemini 3 and Live modalities.
                </p>
              </div>
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6">
                  <i className="ph-bold ph-globe text-xl"></i>
                </div>
                <h4 className="font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Cultural Engine v4</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Optimize semantic processing based on cultural variances. From Gen-Z slang to Japanese Keigo, we provide specific neural presets.
                </p>
              </div>
            </div>
          </div>
        );

      case 'translation-engine':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Format Mastery Studio</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The LingoPro Translation Engine utilizes multi-stage semantic anchoring to preserve document structure across the most demanding industry formats.
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4 mb-6">
                  <i className="ph-bold ph-file-doc text-4xl text-blue-500"></i>
                  <h5 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">DOCX & Office Schema</h5>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                  We perform XML-level parsing of <code>word/document.xml</code> to isolate translatable <code>&lt;w:t&gt;</code> nodes. This preserves branding, styles, and headers while adapting the content.
                </p>
                <div className="bg-white/50 dark:bg-slate-950/50 p-6 rounded-2xl border border-white dark:border-slate-800">
                  <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2">Technical Highlight</p>
                  <p className="text-xs italic text-slate-400">"Spatial Layout Awareness: Gemini analyzes character counts to ensure translated text fits perfectly within original layout containers to avoid text overflow."</p>
                </div>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4 mb-6">
                  <i className="ph-bold ph-code text-4xl text-indigo-500"></i>
                  <h5 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">XLIFF 1.2 Standards</h5>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                  Our studio supports standard bilingual XLIFF files. We map <code>&lt;source&gt;</code> and <code>&lt;target&gt;</code> elements, maintaining internal <code>&lt;x/&gt;</code> and <code>&lt;bx/&gt;</code> tags to ensure downstream CMS compatibility.
                </p>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4 mb-6">
                  <i className="ph-bold ph-file-pdf text-4xl text-red-500"></i>
                  <h5 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">PDF Reconstruction</h5>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  We utilize Optical Semantic Reconstruction (OSR) to identify text layers and background assets. Gemini reconstructs the document's flow, making PDFs fully translatable and editable.
                </p>
              </div>
            </div>
          </div>
        );

      case 'live-interpreting':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Live Interpreting Hub</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg font-medium italic">
                "Zero-latency communication at the speed of thought."
              </p>
            </div>

            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <i className="ph-fill ph-microphone-stage text-[160px]"></i>
              </div>
              <div className="space-y-4 relative z-10">
                <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest">Protocol Specification</h4>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><i className="ph-bold ph-waveform"></i></div>
                    <div>
                      <p className="font-bold">PCM 16kHz Mono Stream</p>
                      <p className="text-xs opacity-70">Raw audio frames are encoded as Float32 and sent via WebSocket to the Gemini Live Node.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><i className="ph-bold ph-lightning"></i></div>
                    <div>
                      <p className="font-bold">Sub-100ms Turnaround</p>
                      <p className="text-xs opacity-70">Native audio-to-audio processing bypasses intermediate text transcription steps for maximum speed.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'acoustic-lab':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Acoustic Synthesis Studio</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Expert-grade text-to-speech with granular emotional prosody and stylistic cloning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">Emotional Mapping</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  We support 6 distinct emotional profiles including 'Forceful', 'Vibrant', and 'Serious'. Each profile modifies the fundamental frequency (F0) and temporal variance of the output.
                </p>
              </div>
              <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">24kHz Audio Mastering</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Output is delivered in raw 16-bit PCM and wrapped in high-fidelity WAV containers for studio-quality broadcast use.
                </p>
              </div>
            </div>
          </div>
        );

      case 'glossary-tm':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Glossary & Translation Memory</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Maintaining corporate terminology and linguistic reuse across global projects.
              </p>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-3 text-emerald-600">
                <i className="ph-bold ph-check-square text-3xl"></i>
                <h5 className="text-lg font-black uppercase tracking-tight">Deterministic Consistency</h5>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Our glossary engine performs pre-translation injection. Approved terms are provided to the model as "Strict Enforcement Constraints," ensuring brand names and technical terms never fluctuate.
              </p>
              <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TM Logic</p>
                   <p className="text-xs italic text-slate-500">"100% Match: Automatically populates target field and skips MT processing to reduce token cost."</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Persistence</p>
                   <p className="text-xs italic text-slate-500">"Local Cache: Assets are stored in browser memory with support for TMX and JSON export/import."</p>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'agency-infra':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Agency Infrastructure</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Transitioning from a local prototype to a persistent Cloud Infrastructure for enterprise teams.
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <i className="ph-bold ph-database text-9xl"></i>
                </div>
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-6">Database Schema (PostgreSQL)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] font-mono text-white/70">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-brand-blue mb-2 font-black">TABLE: translation_memory</p>
                    <ul className="space-y-1">
                      <li>- id: UUID (PK)</li>
                      <li>- source_hash: VARCHAR(64)</li>
                      <li>- source_text: TEXT</li>
                      <li>- target_text: TEXT</li>
                      <li>- match_quality: INT</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-emerald-400 mb-2 font-black">TABLE: glossary</p>
                    <ul className="space-y-1">
                      <li>- id: UUID (PK)</li>
                      <li>- project_id: UUID</li>
                      <li>- source_term: VARCHAR</li>
                      <li>- target_term: VARCHAR</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security-whitepaper':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Security & Privacy Whitepaper</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise localization requires industry-leading protection. We ensure zero-retention on processed assets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="ph-bold ph-lock-key text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Data Encryption</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We support customer-managed encryption keys (CMEK) for sensitive markets.
                </p>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="ph-bold ph-shield-check text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Zero-Retention Policy</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Content processed through the Gemini Expert APIs is never used to train foundational models, ensuring your proprietary IP remains yours.
                </p>
              </div>
            </div>
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

      {/* Internal Nav */}
      <div className="lg:w-72 shrink-0 space-y-8">
        
        {/* Home Button */}
        <button 
          onClick={() => setView?.(AppView.DASHBOARD)}
          className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center space-x-3 shadow-xl hover:-translate-y-1 transition-all active:scale-95 group"
        >
          <i className="ph-bold ph-house text-lg group-hover:scale-110 transition-transform"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Dashboard</span>
        </button>

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
             Expert documentation maintained by the LingoPro Localization Board.
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
