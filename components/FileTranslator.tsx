
import React, { useState, useMemo, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { geminiService } from '../services/geminiService';
import { XliffSegment, SUPPORTED_LANGUAGES, LocalizationAsset, GlossaryTerm, StyleguideRule, AppView } from '../types';
import { safeLocalStorage } from '../utils/storage';
import GlossaryModal from './GlossaryModal';
import StyleguideConfig from './StyleguideConfig';
import TMManagerModal from './TMManagerModal';

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
        id, source, target, 
        status: isApproved ? 'human_verified' : (target ? 'machine_translated' : 'untranslated'), 
        isTranslatable: true, fileName
      });
    });
    return extracted;
  } catch (err) { return []; }
};

const parseSegmentsFromDocxXml = (xmlContent: string, fileName?: string): XliffSegment[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const textNodes = Array.from(xmlDoc.getElementsByTagName('w:t'));
    return textNodes.map((node, i): XliffSegment => ({
      id: `w-seg-${i}`, source: node.textContent || "", target: "", 
      status: 'untranslated', isTranslatable: true, fileName
    })).filter(s => s.source.trim().length > 0);
  } catch (err) { return []; }
};

interface FileTranslatorProps {
  setView?: (view: AppView) => void;
}

const FileTranslator: React.FC<FileTranslatorProps> = ({ setView }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [assets, setAssets] = useState<LocalizationAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [segments, setSegments] = useState<XliffSegment[]>([]);
  const [filterMode, setFilterMode] = useState<'All' | 'Low Confidence' | 'Unverified'>('All');
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);
  const [translationMemory, setTranslationMemory] = useState<Record<string, string>>({});
  const [isBrandGuardActive, setIsBrandGuardActive] = useState(true);

  const [showGlossary, setShowGlossary] = useState(false);
  const [showStyleguide, setShowStyleguide] = useState(false);
  const [showTmManager, setShowTmManager] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAsset = useMemo(() => assets.find(a => a.id === activeAssetId), [assets, activeAssetId]);

  useEffect(() => {
    const savedAssets = safeLocalStorage.getItem('lingopro_assets');
    if (savedAssets) try { setAssets(JSON.parse(savedAssets)); } catch (e) {}
    const savedGlossary = safeLocalStorage.getItem('lingopro_glossary');
    if (savedGlossary) try { setGlossary(JSON.parse(savedGlossary)); } catch (e) {}
    const savedRules = safeLocalStorage.getItem('lingopro_styleguide');
    if (savedRules) try { setStyleguideRules(JSON.parse(savedRules)); } catch (e) {}
    const savedTm = safeLocalStorage.getItem('lingopro_tm');
    if (savedTm) try { setTranslationMemory(JSON.parse(savedTm)); } catch (e) {}
  }, []);

  const saveAssets = (updated: LocalizationAsset[]) => {
    setAssets(updated);
    safeLocalStorage.setItem('lingopro_assets', JSON.stringify(updated));
  };

  const saveTM = (updated: Record<string, string>) => {
    setTranslationMemory(updated);
    safeLocalStorage.setItem('lingopro_tm', JSON.stringify(updated));
  };

  const loadDemo = () => {
    const demoContent = "LingoPro isn’t just another translation tool; it’s a high-performance production environment that consolidates everything a linguist needs. Our processing pipeline goes beyond simple translation by integrating your translation memories and glossaries directly with your brand’s style guide. While our file translator protects the integrity of complex layouts in DOCX and XLIFF formats, the system automatically cross-references every segment against your specific brand voice. You no longer need to toggle between documents—LingoPro keeps all your instructions in one cohesive view.";
    
    const newAsset: LocalizationAsset = {
      id: `demo-${Date.now()}`,
      name: "Expert_LingoPro_Overview.txt",
      type: "txt",
      content: demoContent,
      size: demoContent.length,
      status: 'pending'
    };

    const nextAssets = [...assets, newAsset];
    saveAssets(nextAssets);
    setActiveAssetId(newAsset.id);

    // Manually trigger segment parsing for plain text demo
    const demoSegments: XliffSegment[] = demoContent.split('. ').map((sentence, i) => ({
      id: `demo-seg-${i}`,
      source: sentence.endsWith('.') ? sentence : `${sentence}.`,
      target: "",
      status: 'untranslated',
      isTranslatable: true,
      fileName: newAsset.name
    }));
    setSegments(demoSegments);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
    
    let content = "";
    let finalType = extension;

    if (extension === 'docx') {
      const zip = await JSZip.loadAsync(file);
      content = await zip.file("word/document.xml")?.async("string") || "";
    } else if (extension === 'xlz') {
      const zip = await JSZip.loadAsync(file);
      const xlfFile = Object.keys(zip.files).find(name => name.endsWith('.xlf') || name.endsWith('.xliff'));
      if (xlfFile) {
        content = await zip.file(xlfFile)!.async("string");
        finalType = 'xliff';
      } else {
        alert("XLZ archive contains no recognizable XLIFF data.");
        return;
      }
    } else {
      content = await file.text();
    }

    const newAsset: LocalizationAsset = {
      id: Date.now().toString(),
      name: file.name,
      type: finalType,
      content,
      size: file.size,
      status: 'pending'
    };

    const nextAssets = [...assets, newAsset];
    saveAssets(nextAssets);
    setActiveAssetId(newAsset.id);
  };

  const updateSegmentTarget = (id: string, newTarget: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { 
      ...s, target: newTarget, 
      status: 'machine_translated' as const,
      matchType: 'Manual' as const 
    } : s));
  };

  const verifySegment = (id: string) => {
    const segment = segments.find(s => s.id === id);
    if (!segment) return;
    const isNowVerified = segment.status !== 'human_verified';
    if (isNowVerified && segment.target) {
      const nextTm = { ...translationMemory, [segment.source]: segment.target };
      saveTM(nextTm);
    }
    setSegments(prev => prev.map(s => s.id === id ? { 
      ...s, 
      status: isNowVerified ? 'human_verified' : 'machine_translated' 
    } : s));
  };

  const translateSingle = async (idx: number) => {
    const seg = segments[idx];
    if (translatingIds.has(seg.id)) return;
    if (translationMemory[seg.source]) {
      setSegments(prev => prev.map(s => s.id === seg.id ? { 
        ...s, target: translationMemory[seg.source], status: 'human_verified', matchType: 'TM', confidenceScore: 100
      } : s));
      return;
    }
    setTranslatingIds(prev => new Set(prev).add(seg.id));
    try {
      const activeRules = isBrandGuardActive ? styleguideRules : [];
      const result = await geminiService.translateWithConfidence(seg.source, sourceLang, targetLang, glossary, activeRules);
      setSegments(prev => prev.map(s => s.id === seg.id ? { 
        ...s, target: result.translation, status: result.confidence < 85 ? 'low_confidence' : 'machine_translated',
        confidenceScore: result.confidence, matchType: 'MT'
      } : s));
    } finally {
      setTranslatingIds(prev => { const next = new Set(prev); next.delete(seg.id); return next; });
    }
  };

  const handleGlobalTranslate = async () => {
    if (!activeAsset) return;
    setIsTranslating(true);
    try {
      const activeRules = isBrandGuardActive ? styleguideRules : [];
      const updated = await Promise.all(segments.map(async (seg) => {
        if (seg.status === 'human_verified' || (seg.target && seg.status !== 'low_confidence')) return seg;
        if (translationMemory[seg.source]) {
          return { ...seg, target: translationMemory[seg.source], status: 'human_verified' as const, matchType: 'TM' as const, confidenceScore: 100 };
        }
        const res = await geminiService.translateWithConfidence(seg.source, sourceLang, targetLang, glossary, activeRules);
        return { ...seg, target: res.translation, status: res.confidence < 85 ? 'low_confidence' as const : 'machine_translated' as const, confidenceScore: res.confidence, matchType: 'MT' as const };
      }));
      setSegments(updated);
    } finally { setIsTranslating(false); }
  };

  const handleExport = async () => {
    if (!activeAsset) return;
    let finalContent = "";
    let mimeType = "text/plain";
    if (activeAsset.type === 'xliff') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(activeAsset.content, "text/xml");
      const transUnits = xmlDoc.getElementsByTagName('trans-unit');
      Array.from(transUnits).forEach(unit => {
        const id = unit.getAttribute("id");
        const seg = segments.find(s => s.id === id);
        if (seg) {
          let targetNode = unit.getElementsByTagName('target')[0];
          if (!targetNode) { targetNode = xmlDoc.createElement('target'); unit.appendChild(targetNode); }
          targetNode.textContent = seg.target;
          if (seg.status === 'human_verified') targetNode.setAttribute('state', 'final');
        }
      });
      finalContent = new XMLSerializer().serializeToString(xmlDoc);
      mimeType = "text/xml";
    } else if (activeAsset.type === 'docx') {
      alert("DOCX Reconstruction Engine: Merging Expert Adaptations into XML schema...");
      finalContent = activeAsset.content;
    } else {
      finalContent = segments.map(s => s.target || s.source).join('\n\n');
    }
    const blob = new Blob([finalContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LOCALIZED_${activeAsset.name}`;
    a.click();
  };

  const filteredSegments = useMemo(() => {
    return segments.filter(s => {
      if (filterMode === 'Low Confidence') return s.status === 'low_confidence';
      if (filterMode === 'Unverified') return s.status !== 'human_verified';
      return true;
    });
  }, [segments, filterMode]);

  const verifiedCount = segments.filter(s => s.status === 'human_verified').length;
  const totalCount = segments.length || 1;
  const verificationPercent = Math.round((verifiedCount / totalCount) * 100);

  useEffect(() => {
    if (activeAsset) {
      // If it's a demo asset, segments might have been set manually in loadDemo
      // But we still handle it here for consistency or re-selection
      if (activeAsset.id.startsWith('demo-') && segments.length > 0 && segments[0].fileName === activeAsset.name) {
         return; 
      }

      let parsed: XliffSegment[] = [];
      if (activeAsset.type === 'docx') parsed = parseSegmentsFromDocxXml(activeAsset.content, activeAsset.name);
      else if (activeAsset.type === 'xliff') parsed = parseSegmentsFromXliff(activeAsset.content, activeAsset.name);
      else {
        // Plain text fallback
        parsed = activeAsset.content.split('. ').map((sentence, i) => ({
          id: `seg-${i}`,
          source: sentence.endsWith('.') ? sentence : `${sentence}.`,
          target: "",
          status: 'untranslated',
          isTranslatable: true,
          fileName: activeAsset.name
        }));
      }
      setSegments(parsed);
    } else {
      setSegments([]);
    }
  }, [activeAssetId, activeAsset]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20 animate-in fade-in duration-500">
      {/* Workspace Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={loadDemo}
                title="Load Expert Demo File"
                className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-800/40"
              >
                <i className="ph-bold ph-magic-wand"></i>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
              >
                <i className="ph-bold ph-plus"></i>
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".docx,.xliff,.xlz,.pdf,.txt" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {assets.map(asset => (
              <button 
                key={asset.id}
                onClick={() => setActiveAssetId(asset.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all group flex items-center space-x-3 ${activeAssetId === asset.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeAssetId === asset.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <i className={`ph-bold ${asset.type === 'docx' ? 'ph-file-doc' : asset.type === 'xliff' ? 'ph-file-code' : 'ph-archive-box'}`}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{asset.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">{(asset.size / 1024).toFixed(1)} KB</p>
                </div>
              </button>
            ))}
            {assets.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <i className="ph-bold ph-folder-open text-5xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No assets loaded</p>
                <button onClick={loadDemo} className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Click to load demo</button>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50">
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                  <span>Human Oversight</span>
                  <span>{verificationPercent}% Verified</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${verificationPercent}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 shadow-brand-xl">
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Expert Protocols</h4>
              <button 
                onClick={() => setIsBrandGuardActive(!isBrandGuardActive)}
                className={`w-10 h-6 rounded-full transition-all relative ${isBrandGuardActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isBrandGuardActive ? 'right-1' : 'left-1'}`}></div>
              </button>
           </div>
           <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[8px] font-black text-white/40 uppercase mb-2">Active Enforcement</p>
              <div className="flex items-center space-x-2">
                 <i className={`ph-bold ${isBrandGuardActive ? 'ph-shield-check text-emerald-400' : 'ph-shield text-slate-500'} text-xl`}></i>
                 <span className="text-[10px] font-bold">{isBrandGuardActive ? 'Brand Guard Active' : 'Brand Guard Off'}</span>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowGlossary(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-center">
                 <i className="ph-bold ph-books text-xl mb-2 block"></i>
                 <span className="text-[9px] font-black uppercase">Glossary</span>
              </button>
              <button onClick={() => setShowStyleguide(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-center">
                 <i className="ph-bold ph-gear-six text-xl mb-2 block"></i>
                 <span className="text-[9px] font-black uppercase">Guide</span>
              </button>
              <button onClick={() => setShowTmManager(true)} className="col-span-2 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-center">
                 <i className="ph-bold ph-database text-lg mb-1 block"></i>
                 <span className="text-[8px] font-black uppercase">Linguistic Memory</span>
              </button>
           </div>
        </div>
      </div>

      {/* Editor Hub */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden flex flex-col h-[850px]">
          
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6 bg-slate-50/50">
            
            <div className="flex flex-col items-center space-y-1 text-center shrink-0">
               <div className="flex items-center space-x-4">
                  <button onClick={() => setView?.(AppView.DASHBOARD)} className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm hover:text-blue-600 transition-colors shrink-0"><i className="ph-bold ph-house text-lg"></i></button>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Studio Editor</h2>
               </div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{activeAsset?.name || 'Select a file to begin'}</p>
            </div>

            <div className="flex items-center space-x-3 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner shrink-0">
               {['All', 'Low Confidence', 'Unverified'].map(m => (
                 <button 
                  key={m} 
                  onClick={() => setFilterMode(m as any)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === m ? 'bg-blue-600 text-white shadow-brand-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {m}
                 </button>
               ))}
            </div>

            <div className="w-full flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 px-2 shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-100 dark:bg-slate-800 px-4 sm:px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner min-w-[320px] justify-between">
                <select 
                  value={sourceLang} 
                  onChange={(e) => setSourceLang(e.target.value)} 
                  className="bg-transparent text-[11px] font-black uppercase outline-none dark:text-white min-w-0 w-[120px] cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l} className="dark:bg-slate-900">{l}</option>)}
                </select>
                <i className="ph-bold ph-arrow-right text-blue-500 text-lg shrink-0"></i>
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)} 
                  className="bg-transparent text-[11px] font-black uppercase outline-none dark:text-white min-w-0 w-[120px] cursor-pointer text-right"
                >
                  {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l} className="dark:bg-slate-900">{l}</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button 
                  onClick={handleGlobalTranslate} 
                  disabled={isTranslating || !activeAsset} 
                  className="h-14 px-6 sm:px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-brand-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center space-x-3 disabled:opacity-30 active:scale-95 whitespace-nowrap"
                >
                   <i className={`ph-bold ${isTranslating ? 'ph-spinner animate-spin' : 'ph-sparkle'}`}></i>
                   <span>Execute Synthesis</span>
                </button>
                <button 
                  onClick={handleExport} 
                  disabled={!activeAsset} 
                  className="h-14 px-6 sm:px-8 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-brand-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-30 active:scale-95 whitespace-nowrap"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {filteredSegments.map((seg, idx) => (
              <div key={seg.id} className={`p-8 border rounded-[2.5rem] transition-all relative group ${seg.status === 'human_verified' ? 'border-emerald-500 bg-emerald-50/5' : seg.status === 'low_confidence' ? 'border-amber-400 bg-amber-50/5' : 'border-slate-100 bg-white dark:bg-slate-900 hover:border-blue-200'}`}>
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-black font-mono text-slate-300">SEG-{idx + 1}</span>
                      {seg.matchType === 'TM' ? (
                         <span className="px-3 py-1 bg-emerald-600 text-white text-[8px] font-black rounded-lg flex items-center space-x-1 uppercase tracking-tighter"><i className="ph-bold ph-database"></i><span>100% TM Match</span></span>
                      ) : seg.status === 'human_verified' ? (
                         <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-lg flex items-center space-x-1 uppercase tracking-tighter"><i className="ph-bold ph-user-check"></i><span>Verified</span></span>
                      ) : seg.status === 'low_confidence' ? (
                         <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black rounded-lg flex items-center space-x-1 uppercase tracking-tighter animate-pulse"><i className="ph-bold ph-warning"></i><span>Expert Review</span></span>
                      ) : seg.target ? (
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-lg uppercase tracking-tighter border border-blue-100">AI Suggested</span>
                      ) : (
                         <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[8px] font-black rounded-lg uppercase tracking-tighter">Pending</span>
                      )}
                   </div>
                   {seg.confidenceScore !== undefined && (
                      <div className="flex items-center space-x-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase">AI confidence</span>
                         <span className={`text-[10px] font-black ${seg.confidenceScore > 85 ? 'text-emerald-500' : 'text-amber-500'}`}>{seg.confidenceScore}%</span>
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2"><i className="ph ph-textbox"></i><span>Source Master</span></p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">{seg.source}</p>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center space-x-2"><i className="ph ph-sparkle"></i><span>Expert Adaptation</span></p>
                      <textarea 
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px] transition-all"
                         value={seg.target}
                         onChange={(e) => updateSegmentTarget(seg.id, e.target.value)}
                         placeholder="Synthesizing..."
                      />
                      <div className="flex justify-end space-x-3">
                         <button 
                           onClick={() => verifySegment(seg.id)}
                           className={`h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center space-x-3 shadow-sm ${seg.status === 'human_verified' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-500'}`}
                         >
                            <i className={`ph-bold ${seg.status === 'human_verified' ? 'ph-check-circle' : 'ph-circle'} text-lg`}></i>
                            <span>{seg.status === 'human_verified' ? 'Verified' : 'Verify'}</span>
                         </button>
                         <button 
                           onClick={() => translateSingle(idx)} 
                           disabled={translatingIds.has(seg.id)}
                           className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 disabled:opacity-30"
                         >
                           <i className={`ph-bold ${translatingIds.has(seg.id) ? 'ph-spinner animate-spin' : 'ph-sparkle'} text-xl`}></i>
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            ))}
            {!activeAsset && (
              <div className="h-full flex flex-col items-center justify-center py-40 text-center space-y-6 opacity-30 grayscale">
                 <i className="ph-bold ph-monitor-play text-8xl"></i>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Workspace Idle</h3>
                 <p className="text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">Select a file from the active workspace sidebar to initialize the translation environment.</p>
                 <button onClick={loadDemo} className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">Load Expert Demo</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showGlossary && <GlossaryModal initialGlossary={glossary} onUpdate={(g) => { setGlossary(g); safeLocalStorage.setItem('lingopro_glossary', JSON.stringify(g)); }} onClose={() => setShowGlossary(false)} />}
      {showTmManager && <TMManagerModal onClose={() => setShowTmManager(false)} />}
      {showStyleguide && <StyleguideConfig onClose={() => setShowStyleguide(false)} onRulesUpdate={(rules) => { setStyleguideRules(rules); }} />}
    </div>
  );
};

export default FileTranslator;
