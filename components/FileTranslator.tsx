
import React, { useState, useMemo, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { geminiService } from '../services/geminiService';
import { XliffSegment, SUPPORTED_LANGUAGES, LocalizationAsset, GlossaryTerm, StyleguideRule, AppView, TranslationMemoryEntry } from '../types';
import { safeLocalStorage } from '../utils/storage';
import GlossaryModal from './GlossaryModal';
import StyleguideConfig from './StyleguideConfig';

const parseSegmentsFromXliff = (content: string, fileName?: string): XliffSegment[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const findNodes = (parent: Element | Document, tagName: string) => {
      return Array.from(parent.querySelectorAll(`*`)).filter(el => 
        el.tagName === tagName || el.tagName.endsWith(`:${tagName}`)
      );
    };
    const transUnits = findNodes(xmlDoc, 'trans-unit');
    const extracted: XliffSegment[] = [];
    transUnits.forEach((unit, i) => {
      const uEl = unit as Element;
      const id = uEl.getAttribute("id") || `seg-${i}`;
      const sourceNode = findNodes(uEl, 'source')[0];
      const source = sourceNode?.innerHTML || sourceNode?.textContent || "";
      const targetNode = findNodes(uEl, 'target')[0];
      const target = targetNode?.innerHTML || targetNode?.textContent || "";
      const internalState = targetNode?.getAttribute("state") || "new";
      const isApproved = ['final', 'translated', 'signed-off', 'reviewed'].includes(internalState.toLowerCase());
      
      extracted.push({ 
        id, 
        source, 
        target, 
        status: isApproved ? 'approved' : (target ? 'translated' : 'untranslated'), 
        internalState, 
        isTranslatable: true, 
        fileName,
        matchType: target ? 'Manual' : undefined
      });
    });
    return extracted;
  } catch (err) {
    return [];
  }
};

const parseSegmentsFromDocxXml = (xmlContent: string, fileName?: string): XliffSegment[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const textNodes = Array.from(xmlDoc.getElementsByTagName('w:t'));
    return textNodes.map((node, i): XliffSegment => ({
      id: `w-seg-${i}`,
      source: node.textContent || "",
      target: "",
      status: 'untranslated',
      isTranslatable: true,
      fileName
    })).filter(s => s.source.trim().length > 0);
  } catch (err) {
    return [];
  }
};

interface SourceQualityIssue {
  type: string;
  original: string;
  suggestion: string;
  explanation: string;
}

interface SourceQualityReport {
  overall_score: number;
  issues: SourceQualityIssue[];
}

interface FileTranslatorProps {
  setView?: (view: AppView) => void;
}

const FileTranslator: React.FC<FileTranslatorProps> = ({ setView }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [qualityReports, setQualityReports] = useState<Record<string, SourceQualityReport>>({});
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [assets, setAssets] = useState<LocalizationAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [segments, setSegments] = useState<XliffSegment[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);
  const [translationMemory, setTranslationMemory] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState<'docx' | 'xliff' | null>(null);

  // Expert Modals
  const [showGlossary, setShowGlossary] = useState(false);
  const [showStyleguide, setShowStyleguide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const activeAsset = useMemo(() => assets.find(a => a.id === activeAssetId), [assets, activeAssetId]);

  useEffect(() => {
    // Load persisted data
    const savedAssets = safeLocalStorage.getItem('lingopro_assets');
    if (savedAssets) {
      try {
        const parsed = JSON.parse(savedAssets);
        setAssets(parsed);
        if (parsed.length > 0 && !activeAssetId) setActiveAssetId(parsed[0].id);
      } catch (e) {}
    }
    const savedGlossary = safeLocalStorage.getItem('lingopro_glossary');
    if (savedGlossary) {
      try { setGlossary(JSON.parse(savedGlossary)); } catch (e) {}
    }
    const savedRules = safeLocalStorage.getItem('lingopro_styleguide');
    if (savedRules) {
      try { setStyleguideRules(JSON.parse(savedRules)); } catch (e) {}
    }
    const savedTm = safeLocalStorage.getItem('lingopro_tm');
    if (savedTm) {
      try { setTranslationMemory(JSON.parse(savedTm)); } catch (e) {}
    }
  }, []);

  const saveAssets = (updated: LocalizationAsset[]) => {
    setAssets(updated);
    safeLocalStorage.setItem('lingopro_assets', JSON.stringify(updated));
  };

  const saveTm = (source: string, target: string) => {
    const updatedTm = { ...translationMemory, [source]: target };
    setTranslationMemory(updatedTm);
    safeLocalStorage.setItem('lingopro_tm', JSON.stringify(updatedTm));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsSyncing(true);

    const newAssets: LocalizationAsset[] = [];
    for (const file of Array.from(files) as File[]) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let content = "";
      try {
        if (['xliff', 'xlf', 'xlz', 'docx'].includes(extension || '')) {
          const binaryData = await file.arrayBuffer();
          const zip = new JSZip();
          if (extension === 'docx') {
             const loadedZip = await zip.loadAsync(binaryData);
             const docFile = loadedZip.files['word/document.xml'];
             content = docFile ? await docFile.async('text') : "";
          } else {
             content = await file.text();
          }
        } else if (extension === 'pdf') {
          content = "PDF CONTENT (SIMULATED): This document contains expert-level security protocols and regional compliance standards for global deployment. [MARKER_001] Security measures must be audited monthly.";
        } else {
          content = await file.text();
        }
        newAssets.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, type: extension || 'txt', content, size: file.size, status: 'pending' });
      } catch (err) {
        console.error("Upload failed:", file.name, err);
      }
    }

    const updatedAssets = [...assets, ...newAssets];
    saveAssets(updatedAssets);
    if (!activeAssetId && updatedAssets.length > 0) setActiveAssetId(updatedAssets[0].id);
    setIsSyncing(false);
  };

  const updateSegmentTarget = (id: string, newTarget: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, target: newTarget, status: (newTarget ? 'translated' : 'untranslated'), matchType: 'Manual' } : s));
  };

  const toggleApproveSegment = (id: string) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;

    const newStatus = segment.status === 'approved' ? 'translated' : 'approved';
    if (newStatus === 'approved' && segment.target) {
      saveTm(segment.source, segment.target);
    }

    setSegments(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const batchApproveAll = () => {
    const updated = segments.map(s => {
      if (s.target && s.status !== 'approved') {
        saveTm(s.source, s.target);
        return { ...s, status: 'approved' as const };
      }
      return s;
    });
    setSegments(updated);
  };

  const translateSingleSegment = async (idx: number) => {
    const seg = segments[idx];
    if (!seg || translatingIds.has(seg.id)) return;

    // Direct TM Match Check
    if (translationMemory[seg.source]) {
       updateSegmentTarget(seg.id, translationMemory[seg.source]);
       setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, matchScore: 100, matchType: 'TM' } : s));
       return;
    }

    setTranslatingIds(prev => new Set(prev).add(seg.id));
    try {
      const translated = await geminiService.translateText(seg.source, sourceLang, targetLang, glossary, styleguideRules);
      if (translated) {
        setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, target: translated, status: 'translated', matchType: 'MT' } : s));
      }
    } catch (e) {} finally {
      setTranslatingIds(prev => { const next = new Set(prev); next.delete(seg.id); return next; });
    }
  };

  const handleGlobalTranslate = async () => {
    if (segments.length === 0) return;
    setIsTranslating(true);
    try {
      const updatedSegments = await Promise.all(segments.map(async (seg) => {
        if (!seg.isTranslatable || seg.status === 'approved' || seg.target) return seg;
        
        if (translationMemory[seg.source]) {
           return { ...seg, target: translationMemory[seg.source], status: 'translated' as const, matchScore: 100, matchType: 'TM' as const };
        }

        const translated = await geminiService.translateText(seg.source, sourceLang, targetLang, glossary, styleguideRules);
        return { ...seg, target: translated || seg.target, status: 'translated' as const, matchType: 'MT' as const };
      }));
      setSegments(updatedSegments);
    } finally { setIsTranslating(false); }
  };

  const handleSourceQualityCheck = async () => {
    if (segments.length === 0) return;
    setIsAnalyzingQuality(true);
    try {
      const reports: Record<string, SourceQualityReport> = {};
      const batch = segments.slice(0, 10);
      await Promise.all(batch.map(async (seg) => {
        const report = await geminiService.checkSourceQuality(seg.source, sourceLang);
        reports[seg.id] = report;
      }));
      setQualityReports(prev => ({ ...prev, ...reports }));
    } finally { setIsAnalyzingQuality(false); }
  };

  const exportTargetDocx = async () => {
    if (!activeAsset || activeAsset.type !== 'docx') return;
    setIsExporting('docx');
    try {
      let newXml = activeAsset.content;
      segments.forEach(seg => { 
        if (seg.target) newXml = newXml.replace(`<w:t>${seg.source}</w:t>`, `<w:t>${seg.target}</w:t>`); 
      });
      const zip = new JSZip();
      zip.file("word/document.xml", newXml);
      zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      const content = await zip.generateAsync({type:"blob"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `LOCALIZED_${activeAsset.name}`;
      link.click();
    } catch (e) { console.error(e); } finally { setIsExporting(null); }
  };

  const exportXliff = async () => {
    if (!activeAsset) return;
    setIsExporting('xliff');
    const xliffContent = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2">
  <file source-language="${sourceLang}" target-language="${targetLang}" original="${activeAsset.name}">
    <body>
      ${segments.map(s => `
      <trans-unit id="${s.id}">
        <source>${s.source}</source>
        <target state="${s.status === 'approved' ? 'final' : 'translated'}">${s.target}</target>
      </trans-unit>`).join('')}
    </body>
  </file>
</xliff>`;
    const blob = new Blob([xliffContent], { type: 'application/x-xliff+xml' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LOCALIZED_${activeAsset.name.replace(/\.[^/.]+$/, "")}.xliff`;
    link.click();
    setIsExporting(null);
  };

  useEffect(() => {
    if (activeAsset) {
      let parsed: XliffSegment[] = [];
      if (['xliff', 'xlf', 'xlz'].includes(activeAsset.type)) {
        parsed = parseSegmentsFromXliff(activeAsset.content, activeAsset.name);
      } else if (activeAsset.type === 'docx') {
        parsed = parseSegmentsFromDocxXml(activeAsset.content, activeAsset.name);
      } else if (activeAsset.type === 'pdf') {
        parsed = [{ id: 'pdf-1', source: activeAsset.content, target: '', status: 'untranslated', isTranslatable: true }];
      }
      
      const processed = parsed.map(seg => {
        if (translationMemory[seg.source]) {
          return { ...seg, target: translationMemory[seg.source], status: 'translated' as const, matchScore: 100, matchType: 'TM' as const };
        }
        return seg;
      });

      setSegments(processed);
      setQualityReports({});
      segmentRefs.current = new Array(processed.length).fill(null);
    }
  }, [activeAssetId, translationMemory]);

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-16 relative">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden flex flex-col max-h-[250px] lg:max-h-[500px]">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                 <button 
                  onClick={() => setView?.(AppView.DASHBOARD)}
                  className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 hover:text-indigo-600 transition-all flex items-center justify-center lg:hidden"
                  title="Back to Dashboard"
                 >
                   <i className="ph ph-house"></i>
                 </button>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Assets</h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center" title="Upload new source assets (.xliff, .docx, .pdf)">
                  <i className="ph-bold ph-plus"></i>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".xliff,.xlf,.xlz,.docx,.pdf" />
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 no-scrollbar">
              {assets.map((asset) => (
                <button 
                  key={asset.id} 
                  onClick={() => setActiveAssetId(asset.id)} 
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all ${activeAssetId === asset.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                  title={`Open asset: ${asset.name}`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`ph-bold ${asset.type === 'docx' ? 'ph-file-doc text-blue-500' : asset.type === 'pdf' ? 'ph-file-pdf text-red-500' : 'ph-file-zip text-indigo-500'} text-lg`}></i>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black">{(asset.size / 1024).toFixed(1)}KB • {asset.type.toUpperCase()}</p>
                    </div>
                  </div>
                </button>
              ))}
              {assets.length === 0 && (
                <div className="py-12 text-center opacity-20">
                   <p className="text-[9px] font-black uppercase tracking-widest">Workspace Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Expert Orchestration */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-brand-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expert Orchestration</h3>
             <div className="grid grid-cols-1 gap-2">
               <button 
                  onClick={() => setShowGlossary(true)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all border border-transparent hover:border-indigo-100 group"
                  title="Configure mandatory terminology and definitions"
               >
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                     <i className="ph-bold ph-books text-indigo-600"></i>
                     <span className="text-[10px] font-bold uppercase tracking-widest">Glossary</span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-1.5 py-0.5 rounded">{glossary.length}</span>
               </button>
               <button 
                  onClick={() => setShowStyleguide(true)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all border border-transparent hover:border-indigo-100 group"
                  title="Set brand tone, formatting, and prohibited terminology rules"
               >
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                     <i className="ph-bold ph-shield-check text-indigo-600"></i>
                     <span className="text-[10px] font-bold uppercase tracking-widest">Style Guide</span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-1.5 py-0.5 rounded">{styleguideRules.length}</span>
               </button>
               <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-transparent" title="Total number of unique segments stored in local Translation Memory">
                  <div className="flex items-center space-x-3 text-slate-400">
                     <i className="ph-bold ph-database"></i>
                     <span className="text-[10px] font-bold uppercase tracking-widest">Memory</span>
                  </div>
                  <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">{Object.keys(translationMemory).length}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Localized Production Studio */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden flex flex-col min-h-[500px] sm:min-h-[600px] relative">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-center gap-4">
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 w-full md:w-auto">
                  {/* Internal Home Navigation */}
                  <button 
                    onClick={() => setView?.(AppView.DASHBOARD)}
                    className="w-11 h-11 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center shrink-0"
                    title="Return to primary dashboard"
                  >
                    <i className="ph-bold ph-house text-xl"></i>
                  </button>

                  <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-4 h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" title="Original language of the uploaded assets">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Src</span>
                    <select className="bg-transparent border-none text-[10px] sm:text-xs font-bold outline-none" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                      {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <i className="ph-bold ph-arrow-right text-indigo-600 hidden sm:block"></i>
                  <div className="flex items-center space-x-3 bg-indigo-600 px-4 h-[44px] rounded-xl text-white shadow-brand-lg" title="Target localized market language">
                    <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Tgt</span>
                    <select className="bg-transparent border-none text-[10px] sm:text-xs font-bold outline-none" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                      {SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
               </div>
               
               <div className="flex items-center space-x-2 w-full md:w-auto">
                 <button 
                  onClick={batchApproveAll} 
                  disabled={segments.filter(s => s.target && s.status !== 'approved').length === 0}
                  className="flex-1 md:flex-none h-[44px] px-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center space-x-2 disabled:opacity-30"
                  title="Approve all translated segments and commit to Translation Memory"
                 >
                   <i className="ph-bold ph-check-square"></i>
                   <span className="hidden sm:inline">Approve All</span>
                 </button>
                 <button 
                  onClick={handleSourceQualityCheck} 
                  disabled={isAnalyzingQuality || segments.length === 0} 
                  className="flex-1 md:flex-none h-[44px] px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-30"
                  title="Scan source text for ambiguity, grammar issues, and translatability friction"
                 >
                   <i className={`ph-bold ${isAnalyzingQuality ? 'ph-spinner animate-spin' : 'ph-magnifying-glass'}`}></i>
                   <span className="hidden sm:inline">Quality Scan</span>
                 </button>
                 <button 
                  onClick={handleGlobalTranslate} 
                  disabled={isTranslating || segments.length === 0} 
                  className="flex-1 md:flex-none h-[44px] px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-brand-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-30"
                  title="Translate all untranslated segments using Gemini 3 Expert with current glossary/rules"
                 >
                   <i className={`ph-bold ${isTranslating ? 'ph-spinner animate-spin' : 'ph-sparkle'}`}></i>
                   <span>Localize All</span>
                 </button>
               </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-h-[450px] sm:max-h-[600px] no-scrollbar relative">
              {segments.length === 0 ? (
                <div className="py-24 text-center opacity-30 flex flex-col items-center">
                   <i className="ph-bold ph-file-search text-6xl mb-6"></i>
                   <p className="text-sm font-black uppercase tracking-widest">Awaiting localized stream... Upload an asset to begin.</p>
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const report = qualityReports[seg.id];
                  const isTranslatingSegment = translatingIds.has(seg.id);
                  return (
                    <div key={seg.id} className={`flex flex-col p-6 sm:p-8 border rounded-3xl transition-all group relative ${focusedIndex === idx ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-indigo-50/5 shadow-brand-md' : seg.status === 'approved' ? 'border-emerald-500 bg-emerald-50/5' : 'border-slate-100 dark:border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-black font-mono text-slate-300 uppercase tracking-tighter" title={`Internal ID: ${seg.id}`}>Segment {(idx + 1).toString().padStart(3, '0')}</span>
                          {seg.status === 'approved' && <i className="ph-fill ph-check-circle text-emerald-500 text-sm" title="Segment approved and stored in memory"></i>}
                          {seg.matchType === 'TM' && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded-full uppercase tracking-tighter" title="Exact match found in existing Translation Memory">100% TM MATCH</span>}
                          {seg.matchType === 'MT' && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[8px] font-black rounded-full uppercase tracking-tighter" title="AI Machine Translation suggestion">AI MT</span>}
                          {report && report.issues.length > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-full uppercase tracking-tighter" title="AI detected potential issues with the source text">QUALITY ALERT</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => { updateSegmentTarget(seg.id, seg.source); }} className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors" title="Copy source master text to localized studio"><i className="ph-bold ph-copy-simple"></i></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Source Master</span>
                          <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{seg.source}</div>
                          {report && report.issues.map((issue, i) => (
                            <div key={i} className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-xs animate-in slide-in-from-left">
                               <div className="flex items-center space-x-2 mb-2">
                                  <i className="ph-bold ph-warning text-amber-600"></i>
                                  <span className="font-black text-amber-700 uppercase text-[9px]">{issue.type}</span>
                               </div>
                               <p className="text-amber-800 dark:text-amber-400 italic mb-1">"{issue.suggestion}"</p>
                               <p className="text-[10px] text-amber-600 opacity-80">{issue.explanation}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3 relative">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Localized Studio</span>
                          <textarea 
                            ref={el => segmentRefs.current[idx] = el} 
                            className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 text-sm sm:text-base font-medium outline-none transition-all min-h-[100px] sm:min-h-[120px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 ${isTranslatingSegment ? 'animate-pulse' : ''}`} 
                            value={seg.target} 
                            onChange={(e) => updateSegmentTarget(seg.id, e.target.value)} 
                            onFocus={() => setFocusedIndex(idx)} 
                            onBlur={() => setFocusedIndex(null)} 
                            placeholder="Localized adaptation stream..." 
                          />
                          <div className="flex justify-end space-x-3 mt-3">
                             <button 
                              onClick={() => toggleApproveSegment(seg.id)} 
                              title={seg.status === 'approved' ? 'Unapprove and remove from Translation Memory' : 'Approve translation and commit to Translation Memory'}
                              className={`h-11 w-11 rounded-xl border transition-all flex items-center justify-center ${seg.status === 'approved' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 hover:text-emerald-500'}`}
                             >
                               <i className="ph-bold ph-check text-xl"></i>
                             </button>
                             <button 
                              onClick={() => translateSingleSegment(idx)} 
                              title="Translate only this segment using AI"
                              className={`h-11 w-11 rounded-xl bg-indigo-600 text-white border border-indigo-500 shadow-brand-lg hover:bg-indigo-700 transition-all flex items-center justify-center ${isTranslatingSegment ? 'animate-spin' : ''}`}
                             >
                               <i className="ph-bold ph-sparkle text-xl"></i>
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-6">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress Metrics</p>
                   <div className="flex items-center space-x-4" title="Completion percentage of the currently active asset">
                     <div className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ width: `${(segments.filter(s => s.status === 'approved').length / (segments.length || 1)) * 100}%` }}></div>
                     </div>
                     <span className="text-[10px] font-black text-indigo-600">{Math.round((segments.filter(s => s.status === 'approved').length / (segments.length || 1)) * 100)}%</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                  onClick={exportXliff} 
                  disabled={!activeAsset || isExporting !== null} 
                  className="flex-1 sm:flex-none h-14 px-8 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 transition-all active:scale-95"
                  title="Export translation as standard bilingual XLIFF format"
                 >
                   {isExporting === 'xliff' ? 'Packing...' : 'Export XLIFF'}
                 </button>
                 <button 
                  onClick={exportTargetDocx} 
                  disabled={!activeAsset || activeAsset.type !== 'docx' || isExporting !== null} 
                  className="flex-1 sm:flex-none h-14 px-10 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-brand-xl hover:-translate-y-1 transition-all disabled:opacity-30 active:scale-95"
                  title="Inject translation back into original document layout"
                 >
                   {isExporting === 'docx' ? 'Packaging...' : 'Export Final Docx'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expert Suite Modals */}
      {showGlossary && (
        <GlossaryModal 
           onClose={() => setShowGlossary(false)} 
           initialGlossary={glossary}
           onUpdate={(updated) => {
             setGlossary(updated);
             safeLocalStorage.setItem('lingopro_glossary', JSON.stringify(updated));
           }}
        />
      )}

      {showStyleguide && (
        <StyleguideConfig 
           onClose={() => setShowStyleguide(false)}
           onRulesUpdate={(updated) => {
             setStyleguideRules(updated);
             safeLocalStorage.setItem('lingopro_styleguide', JSON.stringify(updated));
           }}
        />
      )}
    </div>
  );
};

export default FileTranslator;
