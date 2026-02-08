
import React, { useState, useMemo } from 'react';
import { AppView } from '../types';

interface DocumentationViewProps {
  setView?: (view: AppView) => void;
}

const DocumentationView: React.FC<DocumentationViewProps> = ({ setView }) => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: 'ph-rocket-launch' },
    { id: 'translation-engine', label: 'Translation Engine', icon: 'ph-translate' },
    { id: 'agency-infra', label: 'Agency Infrastructure', icon: 'ph-database' },
    { id: 'live-interpreting', label: 'Live Interpreting', icon: 'ph-microphone-stage' },
    { id: 'acoustic-lab', label: 'Acoustic Lab', icon: 'ph-flask' },
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
      case 'agency-infra':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Agency Infrastructure</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                To move from a local prototype to an Agency-Grade tool, we transition from browser storage to a persistent Cloud Infrastructure.
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <i className="ph-bold ph-database text-9xl"></i>
                </div>
                <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest mb-6">Database Schema (PostgreSQL)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] font-mono">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-brand-blue mb-2 font-black">TABLE: translation_memory</p>
                    <ul className="space-y-1 text-white/60">
                      <li>- id: UUID (PK)</li>
                      <li>- source_hash: VARCHAR(64) (Indexed)</li>
                      <li>- source_text: TEXT</li>
                      <li>- target_text: TEXT</li>
                      <li>- match_quality: INT (0-100)</li>
                      <li>- domain_context: VARCHAR(255)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-emerald-400 mb-2 font-black">TABLE: segments</p>
                    <ul className="space-y-1 text-white/60">
                      <li>- id: UUID (PK)</li>
                      <li>- project_id: UUID (FK)</li>
                      <li>- asset_id: UUID (FK)</li>
                      <li>- status: ENUM('New', 'Review', 'Final')</li>
                      <li>- locked: BOOLEAN</li>
                      <li>- last_modified_by: UUID</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                   <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <i className="ph-bold ph-cloud-arrow-up text-2xl"></i>
                   </div>
                   <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Blob Storage (S3/GCS)</h5>
                   <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                     Raw localization assets (PDFs, Videos, Audio) are never stored in the database. We use S3 buckets with Signed URLs to ensure secure, high-speed access for translators while minimizing DB overhead.
                   </p>
                </div>
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                   <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <i className="ph-bold ph-users-three text-2xl"></i>
                   </div>
                   <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Multi-Tenant Workspaces</h5>
                   <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                     Agencies can manage multiple sub-accounts. A strict Row-Level Security (RLS) policy in PostgreSQL ensures that Translator A cannot see the TM or Glossary of Brand B unless specifically authorized.
                   </p>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50">
                 <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">Production Connectivity</h4>
                 <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium mb-4">
                   In a live agency environment, the frontend calls a <strong>Node.js or Python Backend</strong>. This backend handles:
                 </p>
                 <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <li className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <i className="ph-bold ph-check-circle"></i>
                      <span>XLIFF Re-serialization</span>
                   </li>
                   <li className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <i className="ph-bold ph-check-circle"></i>
                      <span>TM Lookups via Vector DB</span>
                   </li>
                   <li className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <i className="ph-bold ph-check-circle"></i>
                      <span>Webhooks for CMS Integration</span>
                   </li>
                   <li className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <i className="ph-bold ph-check-circle"></i>
                      <span>Audit Logs (ISO-27001)</span>
                   </li>
                 </ul>
              </div>
            </div>
          </div>
        );
      case 'getting-started':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Platform Initiation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Welcome to LingoPro, the frontier of global localization. Our suite is designed for enterprises requiring high-fidelity adaptation across all modalities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue mb-4">
                  <i className="ph-bold ph-key text-xl"></i>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">API Authentication</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All expert modules utilize a secure environment variable for API access.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                  <i className="ph-bold ph-globe text-xl"></i>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Multi-Regional Edge</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optimize semantic processing based on cultural variances.
                </p>
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2rem] border border-indigo-500 shadow-xl space-y-4">
               <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest">Ready to Translate?</h4>
               <p className="text-white text-sm font-medium">Jump straight into the console to begin processing your first localization asset.</p>
               <button 
                onClick={() => setView?.(AppView.FILE_TRANSLATOR)}
                className="px-6 py-3 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-all"
               >
                 Launch File Translator
               </button>
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
                  All data is encrypted using AES-256 at rest and TLS 1.3 in transit.
                </p>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="ph-bold ph-shield-check text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Zero-Retention Policy</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Content processed through the Gemini APIs is never used to train foundational models.
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
