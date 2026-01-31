
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { XliffSegment, SUPPORTED_LANGUAGES, LocalizationAsset } from '../types';
import StyleguideConfig from './StyleguideConfig';
import JSZip from 'jszip';

interface InconsistencyGroup {
  source: string;
  normalizedSource: string;
  type: 'exact' | 'partial';
  variations: {
    text: string;
    files: string[];
    segments: XliffSegment[];
  }[];
  affectedFileNames: string[];
  hasTmConflict?: boolean;
  aiRecommendation?: string;
  aiReasoning?: string;
  isResolvingAi?: boolean;
}

interface SourceQualityIssue {
  type: 'Grammar' | 'Ambiguity' | 'Phrasing';
  original: string;
  suggestion: string;
  explanation: string;
  segmentId?: string;
}

interface SourceQualityReport {
  overall_score: number;
  issues: SourceQualityIssue[];
}

/**
 * Normalizes a string for comparison by removing tags, collapsing whitespace, and trimming.
 */
const normalizeString = (str: string): string => {
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML/XML tags for comparison
    .replace(/\s+/g, ' ')    // Collapse multiple whitespaces
    .trim()
    .toLowerCase();
};

const updateSourceInXml = (xmlContent: string, segmentId: string, newSource: string): string => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const findNodes = (parent: Element | Document, tagName: string) => {
      return Array.from(parent.querySelectorAll(`*`)).filter(el => 
        el.tagName === tagName || el.tagName.endsWith(`:${tagName}`)
      );
    };
    const transUnits = findNodes(xmlDoc, 'trans-unit');
    let changed = false;
    transUnits.forEach(unit => {
      const uEl = unit as Element;
      if (uEl.getAttribute("id") === segmentId) {
        let sourceNode = findNodes(uEl, 'source')[0];
        if (sourceNode) {
          sourceNode.textContent = newSource;
          changed = true;
        }
      }
    });
    return changed ? new XMLSerializer().serializeToString(xmlDoc) : xmlContent;
  } catch (err) {
    return xmlContent;
  }
};

const updateTargetInXml = (xmlContent: string, sourceToFind: string, newTarget: string): string => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const findNodes = (parent: Element | Document, tagName: string) => {
      return Array.from(parent.querySelectorAll(`*`)).filter(el => 
        el.tagName === tagName || el.tagName.endsWith(`:${tagName}`)
      );
    };
    const transUnits = findNodes(xmlDoc, 'trans-unit');
    let changed = false;
    transUnits.forEach(unit => {
      const uEl = unit as Element;
      const sourceNode = findNodes(uEl, 'source')[0];
      // Use normalized comparison for finding the node
      if (normalizeString(sourceNode?.textContent || "") === normalizeString(sourceToFind)) {
        let targetNode = findNodes(uEl, 'target')[0];
        if (!targetNode) {
          targetNode = xmlDoc.createElementNS(uEl.namespaceURI || "", "target");
          uEl.appendChild(targetNode);
        }
        targetNode.textContent = newTarget;
        targetNode.setAttribute("state", "translated");
        changed = true;
      }
    });
    return changed ? new XMLSerializer().serializeToString(xmlDoc) : xmlContent;
  } catch (err) {
    return xmlContent;
  }
};

const parseSegmentsFromContent = (content: string, type: string, fileName?: string): XliffSegment[] => {
  const isXliff = ['xliff', 'xlf', 'sdlxliff', 'xlz'].includes(type.toLowerCase());
  if (!isXliff) return [];
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
      let parentTranslate = true;
      let current: Element | null = uEl.parentElement;
      while (current && current !== xmlDoc.documentElement) {
        if (current.getAttribute("translate") === 'no') {
          parentTranslate = false;
          break;
        }
        current = current.parentElement;
      }
      const translateAttr = uEl.getAttribute("translate");
      const isTranslatable = parentTranslate && translateAttr !== 'no';
      const sourceNode = findNodes(uEl, 'source')[0];
      const source = sourceNode?.innerHTML || sourceNode?.textContent || "";
      const targetNode = findNodes(uEl, 'target')[0];
      const target = targetNode?.innerHTML || targetNode?.textContent || "";
      const internalState = targetNode?.getAttribute("state") || "new";
      const matchQuality = uEl.getAttribute("match-quality") || "";
      const isApproved = ['final', 'translated', 'signed-off', 'reviewed'].includes(internalState.toLowerCase());
      const isTmMatch = matchQuality === '100' || isApproved;
      let status: XliffSegment['status'] = 'untranslated';
      if (!isTranslatable) status = 'locked';
      else if (isApproved) status = 'approved';
      else if (target) status = 'translated';
      extracted.push({ id, source, target, status, internalState, isTmMatch, isTranslatable, fileName });
    });
    return extracted;
  } catch (err) {
    return [];
  }
};

const FileTranslator: React.FC = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [targetLang, setTargetLang] = useState('Spanish');
  
  const [assets, setAssets] = useState<LocalizationAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [showNonTranslatable, setShowNonTranslatable] = useState(true);
  const [isLockOverrideActive, setIsLockOverrideActive] = useState(false);

  // Segmented Content Support
  const [segments, setSegments] = useState<XliffSegment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSegmentMode, setIsSegmentMode] = useState(false);
  
  // Consistency & Integrity
  const [isAnalyzingConsistency, setIsAnalyzingConsistency] = useState(false);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyGroup[]>([]);
  const [showInconsistencyDrawer, setShowInconsistencyDrawer] = useState(false);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);

  // Source Quality Audit
  const [isCheckingSourceQuality, setIsCheckingSourceQuality] = useState(false);
  const [sourceQualityReport, setSourceQualityReport] = useState<SourceQualityReport | null>(null);
  const [showSourceQualityDrawer, setShowSourceQualityDrawer] = useState(false);

  // Quality & Compliance
  const [showStyleguideConfig, setShowStyleguideConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAsset = useMemo(() => assets.find(a => a.id === activeAssetId), [assets, activeAssetId]);

  /**
   * Enhanced Search Logic: Scans across ALL files in the project queue.
   * If a search term is present, it aggregates matches from every asset.
   */
  const filteredSegmentsWithMetadata = useMemo(() => {
    if (!searchTerm) {
      // Local view: Only active asset
      let list = segments;
      if (!showNonTranslatable) {
        list = list.filter(s => s.isTranslatable !== false);
      }
      return list.map(seg => ({ ...seg, assetId: activeAssetId, assetName: activeAsset?.name }));
    }

    // Global view: Scan all assets
    const lowerSearch = searchTerm.toLowerCase();
    const results: (XliffSegment & { assetId: string; assetName?: string })[] = [];

    assets.forEach(asset => {
      // Parse segments on the fly for search (ideally these would be cached for large projects)
      const assetSegments = parseSegmentsFromContent(asset.content, asset.type, asset.name);
      assetSegments.forEach(seg => {
        if (!showNonTranslatable && seg.isTranslatable === false) return;
        
        if (seg.source.toLowerCase().includes(lowerSearch) || 
            (seg.target && seg.target.toLowerCase().includes(lowerSearch))) {
          results.push({ ...seg, assetId: asset.id, assetName: asset.name });
        }
      });
    });

    return results;
  }, [assets, segments, searchTerm, activeAssetId, activeAsset, showNonTranslatable]);

  const saveAssets = (updated: LocalizationAsset[]) => {
    setAssets(updated);
    localStorage.setItem('lingopro_assets', JSON.stringify(updated));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAssets: LocalizationAsset[] = [];
    for (const file of Array.from(files) as File[]) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlz') {
        try {
          const zip = await JSZip.loadAsync(file);
          const xliffFile = Object.keys(zip.files).find(key => key.endsWith('.xlf') || key.endsWith('.xliff'));
          if (xliffFile) {
            const content = await zip.files[xliffFile].async('string');
            newAssets.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, type: 'xlz', content, size: file.size, status: 'pending' });
          }
        } catch (err) { console.error(err); }
      } else {
        const content = await file.text();
        newAssets.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, type: extension || 'txt', content, size: file.size, status: 'pending' });
      }
    }
    const updatedAssets = [...assets, ...newAssets];
    saveAssets(updatedAssets);
    if (!activeAssetId && updatedAssets.length > 0) setActiveAssetId(updatedAssets[0].id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const detectInconsistencies = () => {
    if (assets.length === 0) return;
    setIsAnalyzingConsistency(true);
    
    const globalSourceMap: Record<string, { 
      originalSource: string, 
      variations: Record<string, { files: Set<string>, segments: XliffSegment[] }> 
    }> = {};
    
    assets.forEach(asset => {
      const assetSegments = parseSegmentsFromContent(asset.content, asset.type, asset.name);
      assetSegments.forEach(seg => {
        if (!seg.source || !seg.isTranslatable) return;
        const normSrc = normalizeString(seg.source);
        if (!normSrc) return;
        if (!globalSourceMap[normSrc]) {
          globalSourceMap[normSrc] = { originalSource: seg.source, variations: {} };
        }
        const targetText = (seg.target || "").trim();
        if (!targetText) return;
        if (!globalSourceMap[normSrc].variations[targetText]) {
          globalSourceMap[normSrc].variations[targetText] = { files: new Set(), segments: [] };
        }
        globalSourceMap[normSrc].variations[targetText].files.add(asset.name);
        globalSourceMap[normSrc].variations[targetText].segments.push(seg);
      });
    });

    const groups: InconsistencyGroup[] = [];
    Object.keys(globalSourceMap).forEach(normSrc => {
      const variantKeys = Object.keys(globalSourceMap[normSrc].variations);
      if (variantKeys.length > 1) {
        const allVariations = variantKeys.map(key => ({
          text: key,
          files: Array.from(globalSourceMap[normSrc].variations[key].files),
          segments: globalSourceMap[normSrc].variations[key].segments
        }));
        const affectedFiles = Array.from(new Set(allVariations.flatMap(v => v.files)));
        groups.push({
          source: globalSourceMap[normSrc].originalSource,
          normalizedSource: normSrc,
          type: 'exact',
          variations: allVariations,
          affectedFileNames: affectedFiles,
          hasTmConflict: allVariations.some(v => v.segments.some(s => s.isTmMatch || s.status === 'approved'))
        });
      }
    });

    const score = Math.max(0, 100 - (groups.length * 5));
    setInconsistencies(groups);
    setConsistencyScore(score);
    setIsAnalyzingConsistency(false);
    if (groups.length > 0) setShowInconsistencyDrawer(true);
    else alert("Project Shield: Perfect linguistic consistency across all " + assets.length + " files.");
  };

  const getAiResolution = async (groupIndex: number) => {
    const group = inconsistencies[groupIndex];
    setInconsistencies(prev => prev.map((g, i) => i === groupIndex ? { ...g, isResolvingAi: true } : g));
    try {
      const variationTexts = group.variations.map(v => v.text);
      const result = await geminiService.resolveInconsistency(group.source, variationTexts, targetLang, []);
      if (result && result.recommendation) {
         setInconsistencies(prev => prev.map((g, i) => i === groupIndex ? { 
           ...g, 
           aiRecommendation: result.recommendation, 
           aiReasoning: result.reasoning,
           isResolvingAi: false 
         } : g));
      }
    } catch (e) {
      setInconsistencies(prev => prev.map((g, i) => i === groupIndex ? { ...g, isResolvingAi: false } : g));
    }
  };

  const applyConsistentTarget = (normSrc: string, target: string) => {
    setSegments(prev => prev.map(seg => 
      normalizeString(seg.source) === normSrc && seg.isTranslatable ? { ...seg, target, status: 'translated', isTmMatch: false } : seg
    ));
    const updatedAssets = assets.map(asset => {
      const newContent = updateTargetInXml(asset.content, normSrc, target);
      return { ...asset, content: newContent };
    });
    saveAssets(updatedAssets);
    setInconsistencies(prev => prev.filter(g => g.normalizedSource !== normSrc));
  };

  const performSourceAudit = async () => {
    if (!activeAsset && !sourceText) return;
    setIsCheckingSourceQuality(true);
    try {
      const textToAudit = isSegmentMode 
        ? segments.filter(s => s.isTranslatable).slice(0, 15).map(s => s.source).join("\n---\n")
        : sourceText;
      let lang = sourceLang;
      if (lang === 'Auto-Detect') {
        lang = await geminiService.detectLanguage(textToAudit);
        setSourceLang(lang);
      }
      const report = await geminiService.checkSourceQuality(textToAudit, lang);
      if (isSegmentMode && report.issues) {
        report.issues = report.issues.map((issue: any) => {
          const match = segments.find(s => s.source.includes(issue.original.substring(0, 20)));
          return { ...issue, segmentId: match?.id };
        });
      }
      setSourceQualityReport(report);
      setShowSourceQualityDrawer(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingSourceQuality(false);
    }
  };

  const applySourceSuggestion = (issue: SourceQualityIssue) => {
    if (isSegmentMode && issue.segmentId) {
      setSegments(prev => prev.map(s => s.id === issue.segmentId ? { ...s, source: issue.suggestion } : s));
      if (activeAsset) {
        const newXml = updateSourceInXml(activeAsset.content, issue.segmentId, issue.suggestion);
        const updatedAssets = assets.map(a => a.id === activeAsset.id ? { ...a, content: newXml } : a);
        saveAssets(updatedAssets);
      }
    } else {
      const newText = sourceText.replace(issue.original, issue.suggestion);
      setSourceText(newText);
      if (activeAsset) {
        const updatedAssets = assets.map(a => a.id === activeAsset.id ? { ...a, content: newText } : a);
        saveAssets(updatedAssets);
      }
    }
    setSourceQualityReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        issues: prev.issues.filter(i => i.original !== issue.original)
      };
    });
  };

  /**
   * Cross-File Segment Update: Handles updates from global search results.
   */
  const updateSegmentTarget = (id: string, newTarget: string, targetAssetId?: string) => {
    const assetId = targetAssetId || activeAssetId;
    if (!assetId) return;

    // 1. Update active view if applicable
    if (assetId === activeAssetId) {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, target: newTarget, status: (newTarget ? 'translated' : 'untranslated') as any } : s));
    }

    // 2. Update persistent storage for the target asset
    const targetAsset = assets.find(a => a.id === assetId);
    if (targetAsset) {
      let sourceTextToMatch = "";
      if (assetId === activeAssetId) {
        sourceTextToMatch = segments.find(s => s.id === id)?.source || "";
      } else {
        const assetSegments = parseSegmentsFromContent(targetAsset.content, targetAsset.type, targetAsset.name);
        sourceTextToMatch = assetSegments.find(s => s.id === id)?.source || "";
      }

      if (sourceTextToMatch) {
        const newXml = updateTargetInXml(targetAsset.content, sourceTextToMatch, newTarget);
        const updatedAssets = assets.map(a => a.id === assetId ? { ...a, content: newXml } : a);
        saveAssets(updatedAssets);
      }
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      let currentSourceLang = sourceLang;
      if (sourceLang === 'Auto-Detect') {
        const sampleText = isSegmentMode ? segments.slice(0, 3).map(s => s.source).join(" ") : sourceText;
        currentSourceLang = await geminiService.detectLanguage(sampleText);
        setSourceLang(currentSourceLang);
      }
      if (isSegmentMode) {
        const toTranslate = segments.filter(s => s.status === 'untranslated' && s.isTranslatable !== false);
        if (toTranslate.length === 0) {
           alert("No untranslated units found.");
           return;
        }
        const segmentsToTranslate = toTranslate.map(s => s.source);
        const result = await geminiService.translateText(`Translate segments: ${JSON.stringify(segmentsToTranslate)}`, currentSourceLang, targetLang, []);
        const translatedArray = JSON.parse(result || '[]');
        let translatedIdx = 0;
        setSegments(segments.map((s) => (s.status === 'untranslated' && s.isTranslatable !== false) ? { ...s, target: translatedArray[translatedIdx++] || s.target, status: 'translated' } : s));
      }
    } catch (e) { console.error(e); } finally { setIsTranslating(false); }
  };

  useEffect(() => {
    if (activeAsset) {
      const parsedSegments = parseSegmentsFromContent(activeAsset.content, activeAsset.type, activeAsset.name);
      if (parsedSegments.length > 0) {
        setSegments(parsedSegments);
        setIsSegmentMode(true);
        setInconsistencies([]);
        setConsistencyScore(null);
        setSourceQualityReport(null);
        setShowInconsistencyDrawer(false);
        setShowSourceQualityDrawer(false);
        setSearchTerm('');
      } else {
        setSegments([]);
        setIsSegmentMode(false);
        setSourceText(activeAsset.content);
      }
    }
  }, [activeAssetId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 relative">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Project Explorer Sidebar */}
        <div className="w-full lg:w-72 flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Files</h3>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg"><i className="ph-bold ph-plus"></i></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".xliff,.xlf,.sdlxliff,.xlz,.zip" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {assets.map((asset) => (
                <div key={asset.id} onClick={() => setActiveAssetId(asset.id)} className={`p-4 rounded-2xl border cursor-pointer transition-all group relative ${activeAssetId === asset.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 ring-1 ring-indigo-100' : 'bg-white dark:bg-slate-900 border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-400"><i className="ph-bold ph-file-doc"></i></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{asset.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mt-1">{asset.type} • {(asset.size / 1024).toFixed(1)}KB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-6 shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <i className="ph ph-shield-check text-6xl"></i>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Consistency Audit</h4>
              {consistencyScore !== null && (
                 <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="text-xl font-black text-white">{consistencyScore}%</div>
                    <div className="text-[9px] font-black uppercase text-slate-500">Project <br/>Health</div>
                 </div>
              )}
              <button 
                onClick={detectInconsistencies}
                disabled={isAnalyzingConsistency || assets.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center space-x-2 shadow-lg"
              >
                {isAnalyzingConsistency ? <i className="ph-bold ph-circle-notch animate-spin"></i> : <i className="ph-bold ph-shield-check"></i>}
                <span>Global Consistency Check</span>
              </button>
            </div>
          </div>
        </div>

        {/* Translation Studio */}
        <div className="flex-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Src</span>
                  <select className="bg-transparent border-none text-xs font-bold outline-none" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                    {SUPPORTED_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <i className="ph-bold ph-arrow-right text-slate-300"></i>
                <div className="flex items-center space-x-3 bg-indigo-600 px-3 py-1.5 rounded-xl shadow-lg text-white">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Tgt</span>
                  <select className="bg-transparent border-none text-xs font-bold outline-none" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                    {SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').map(l => <option key={l} value={l} className="text-slate-900">{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsLockOverrideActive(!isLockOverrideActive)}
                  title={isLockOverrideActive ? "Restore Safety Lock" : "Enable Override for Protected Segments"}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${isLockOverrideActive ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                  <i className={`ph-bold ${isLockOverrideActive ? 'ph-lock-simple-open' : 'ph-lock-simple'}`}></i>
                  <span className="text-[10px] font-black uppercase">{isLockOverrideActive ? 'Override On' : 'Safety On'}</span>
                </button>
                <button 
                  onClick={() => setShowNonTranslatable(!showNonTranslatable)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${showNonTranslatable ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >
                  <i className={`ph-bold ${showNonTranslatable ? 'ph-eye' : 'ph-eye-slash'}`}></i>
                  <span className="text-[10px] font-black uppercase">Context {showNonTranslatable ? 'On' : 'Off'}</span>
                </button>
                <button onClick={() => setShowStyleguideConfig(true)} className="p-1.5 text-slate-400 hover:text-indigo-600"><i className="ph-bold ph-gear-six text-xl"></i></button>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {isSegmentMode ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px] scrollbar-hide">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {searchTerm ? 'Global Search Results' : `Active File: ${activeAsset?.name}`}
                      </h4>
                      <div className="flex items-center space-x-3">
                         <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 px-2 py-1 rounded">
                           {filteredSegmentsWithMetadata.length} {searchTerm ? 'Matches Across Project' : 'Units Detected'}
                         </span>
                      </div>
                    </div>
                    <div className="relative group w-full md:w-72">
                      <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                      <input 
                        type="text" 
                        placeholder="Search all project files..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {filteredSegmentsWithMetadata.length > 0 ? filteredSegmentsWithMetadata.map((seg, fIdx) => {
                    const isInconsistent = inconsistencies.some(g => normalizeString(seg.source) === g.normalizedSource);
                    const isApproved = seg.status === 'approved';
                    const isLocked = !seg.isTranslatable;
                    const isTm = seg.isTmMatch;
                    const hasConflict = isInconsistent && (isApproved || isTm || isLocked);
                    
                    // Effectively locked only if safety override is OFF
                    const effectivelyLocked = isLocked && !isLockOverrideActive;

                    return (
                      <div key={`${seg.assetId}-${seg.id}-${fIdx}`} className={`grid grid-cols-2 gap-6 p-4 border rounded-2xl group transition-all animate-in fade-in slide-in-from-top-2 ${
                        effectivelyLocked ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60' :
                        (isLocked && isLockOverrideActive) ? 'bg-amber-50/20 border-amber-200 border-dashed ring-1 ring-amber-100/30' :
                        hasConflict ? 'border-purple-400 bg-purple-50/10 ring-2 ring-purple-100' :
                        isInconsistent ? 'border-amber-400 border-dashed bg-amber-50/20' : 
                        'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">ID: {seg.id}</span>
                               {searchTerm && seg.assetName && (
                                 <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">File: {seg.assetName}</span>
                               )}
                            </div>
                            <div className="flex items-center space-x-2">
                               {isLocked && <span className={`text-[8px] font-black px-1.5 rounded-full flex items-center space-x-1 ${isLockOverrideActive ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'}`}><i className={`ph-bold ${isLockOverrideActive ? 'ph-lock-simple-open' : 'ph-lock'}`}></i><span>{isLockOverrideActive ? 'Override Edit' : 'Protected'}</span></span>}
                               {isTm && <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 rounded-full">100% TM</span>}
                            </div>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-yellow-100/30 px-1 rounded break-words font-medium" dangerouslySetInnerHTML={{ __html: seg.source }}></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              effectivelyLocked ? 'bg-slate-200 text-slate-600' :
                              (isLocked && isLockOverrideActive) ? 'bg-amber-100 text-amber-800' :
                              isApproved ? 'bg-indigo-100 text-indigo-700' : 
                              (seg.status === 'translated' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')
                            }`}>{effectivelyLocked ? 'locked' : isLocked ? 'bypass' : seg.status}</span>
                            <div className="flex items-center space-x-2">
                              {hasConflict && <span className="text-[8px] font-black text-purple-600 uppercase flex items-center space-x-1"><i className="ph-bold ph-warning-diamond"></i><span>Drift</span></span>}
                              <span className="text-[8px] font-bold text-indigo-400 uppercase">Target</span>
                            </div>
                          </div>
                          <textarea 
                            readOnly={effectivelyLocked}
                            className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xs font-medium outline-none transition-all focus:ring-4 focus:ring-indigo-500/5 ${
                              effectivelyLocked ? 'cursor-not-allowed bg-slate-50 border-transparent text-slate-500' :
                              isLocked ? 'border-amber-300 focus:border-amber-500' :
                              hasConflict ? 'border-purple-300 ring-2 ring-purple-50' : 
                              (isInconsistent ? 'border-amber-300' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-400')
                            }`} 
                            value={seg.target} 
                            rows={2} 
                            onChange={(e) => !effectivelyLocked && updateSegmentTarget(seg.id, e.target.value, seg.assetId)}
                          />
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-24 flex flex-col items-center text-center space-y-4 opacity-40">
                       <i className="ph-bold ph-magnifying-glass text-6xl text-slate-300"></i>
                       <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                         {searchTerm ? 'No matches found in any project file' : 'No segments match criteria'}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea className="flex-1 w-full p-8 bg-white dark:bg-slate-900 outline-none text-sm leading-relaxed resize-none" placeholder="Paste text or select an asset..." value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isTranslating ? 'Localizing...' : 'Studio Ready'}
                </span>
              </div>
              <button 
                onClick={handleTranslate}
                disabled={isTranslating || assets.length === 0}
                className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {isTranslating ? 'LOCALIZING...' : 'LOCALIZE NEW UNITS'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-File Consistency Audit Drawer */}
      {showInconsistencyDrawer && inconsistencies.length > 0 && (
        <div className="fixed inset-y-0 right-0 w-[32rem] bg-white dark:bg-slate-900 shadow-2xl z-[80] border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-900/10 flex justify-between items-center">
            <div className="flex items-center space-x-3 text-indigo-700 dark:text-indigo-400">
               <i className="ph-bold ph-shield-check text-2xl"></i>
               <h3 className="font-black uppercase tracking-tighter text-sm">Cross-File Consistency Audit</h3>
            </div>
            <button onClick={() => setShowInconsistencyDrawer(false)} className="text-slate-400 hover:text-slate-600"><i className="ph-bold ph-x text-2xl"></i></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
            {inconsistencies.map((group, idx) => (
              <div key={idx} className={`space-y-6 p-6 border rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 relative ${group.hasTmConflict ? 'border-purple-300 ring-4 ring-purple-100/30' : 'border-slate-100 dark:border-slate-800'}`}>
                {group.hasTmConflict && <span className="absolute -top-3 left-6 bg-purple-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Protected Variation Conflict</span>}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Source String</p>
                     <span className="text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded">{group.affectedFileNames.length} Files Impacted</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-yellow-100/40 p-4 rounded-2xl italic leading-snug break-words border border-yellow-200/50" dangerouslySetInnerHTML={{ __html: group.source }}></div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Conflicting Targets</p>
                    <button onClick={() => getAiResolution(idx)} disabled={group.isResolvingAi} className="text-[8px] font-black text-indigo-600 hover:underline uppercase flex items-center space-x-1">
                      {group.isResolvingAi ? <i className="ph-bold ph-circle-notch animate-spin"></i> : <i className="ph-bold ph-magic-wand"></i>}
                      <span>AI Review Resolution</span>
                    </button>
                  </div>
                  {group.aiRecommendation && (
                    <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl animate-in zoom-in duration-300">
                       <p className="text-[8px] font-black text-indigo-200 uppercase mb-2">Gemini Recommendation</p>
                       <p className="text-sm font-bold mb-4">"{group.aiRecommendation}"</p>
                       <div className="text-[10px] text-indigo-100/80 mb-6 italic leading-relaxed border-t border-indigo-500 pt-4">{group.aiReasoning}</div>
                       <button onClick={() => applyConsistentTarget(group.normalizedSource, group.aiRecommendation!)} className="w-full py-3 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-xl shadow-lg hover:scale-[1.02] transition-all">Propagate To All {group.affectedFileNames.length} Files</button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {group.variations.map((v, vIdx) => (
                      <button key={vIdx} onClick={() => applyConsistentTarget(group.normalizedSource, v.text)} className="w-full p-4 text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-400 transition-all group">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">"{v.text}"</p>
                        <div className="flex flex-wrap gap-1">
                          {v.files.map(name => (
                            <span key={name} className="text-[7px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 uppercase tracking-tighter">{name}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
             <p className="text-[9px] text-slate-400 italic mb-4 leading-relaxed">Applying a resolution will synchronize the target text for this exact source across every file in your project queue.</p>
            <button onClick={() => setShowInconsistencyDrawer(false)} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-xl">Complete Global Audit</button>
          </div>
        </div>
      )}

      {showSourceQualityDrawer && sourceQualityReport && (
        <div className="fixed inset-y-0 right-0 w-[30rem] bg-white dark:bg-slate-900 shadow-2xl z-[80] border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/10 flex justify-between items-center">
            <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
               <i className="ph-bold ph-magnifying-glass text-2xl"></i>
               <h3 className="font-black uppercase tracking-tighter text-sm">Source Readiness Report</h3>
            </div>
            <button onClick={() => setShowSourceQualityDrawer(false)} className="text-slate-400 hover:text-slate-600"><i className="ph-bold ph-x text-2xl"></i></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
            <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2.5rem] text-white">
               <div>
                  <h4 className="text-2xl font-black">{sourceQualityReport.overall_score}%</h4>
                  <p className="text-[9px] font-black uppercase text-slate-400">Clarity Metric</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold">{sourceQualityReport.issues.length} Critical Issues</p>
                  <p className="text-[9px] text-slate-400 leading-tight">Improve source for better localization</p>
               </div>
            </div>
            {sourceQualityReport.issues.map((issue, idx) => (
              <div key={idx} className="space-y-4 p-6 border border-slate-100 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950">
                <div className="flex justify-between items-center">
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${issue.type === 'Grammar' ? 'bg-red-100 text-red-600' : issue.type === 'Ambiguity' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-700'}`}>
                     {issue.type} detected
                   </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Original Phrasing</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-through italic">"{issue.original}"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Refactored Suggestion</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl">"{issue.suggestion}"</p>
                </div>
                <button onClick={() => applySourceSuggestion(issue)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl">Apply Refactor</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showStyleguideConfig && <StyleguideConfig onClose={() => setShowStyleguideConfig(false)} />}
    </div>
  );
};

export default FileTranslator;
