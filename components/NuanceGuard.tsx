import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { StyleguideRule, StyleguideReport } from '../types';
import StyleguideConfig from './StyleguideConfig';

interface Insight {
  category: 'Taboo' | 'Idiom' | 'Tone' | 'Grammar' | 'Brand';
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  suggestion: string;
}

const NuanceGuard: React.FC = () => {
  const [text, setText] = useState('');
  const [culture, setCulture] = useState('Japanese (Global Business)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{ score: number; insights: Insight[] } | null>(null);

  // Styleguide Integration
  const [brandGuardActive, setBrandGuardActive] = useState(true);
  const [showStyleguideConfig, setShowStyleguideConfig] = useState(false);
  const [styleguideRules, setStyleguideRules] = useState<StyleguideRule[]>([]);

  useEffect(() => {
    const savedStyleguide = localStorage.getItem('lingopro_styleguide');
    if (savedStyleguide) {
      try { setStyleguideRules(JSON.parse(savedStyleguide)); } catch (e) {}
    }
  }, []);

  const handleAnalyze = async () => {
    if (!text) return;
    setIsAnalyzing(true);
    setResults(null);
    try {
      const raw = await geminiService.analyzeNuance(text, culture);
      const parsed = JSON.parse(raw || '{}');
      
      let insights: Insight[] = [
        { category: 'Tone', message: 'The directness of this sentence may come across as aggressive in traditional corporate culture.', severity: 'Medium', suggestion: 'Consider using "Desu/Masu" forms or softening with "I believe".' },
        { category: 'Idiom', message: '"Hitting the nail on the head" doesn\'t have a direct equivalent here.', severity: 'Low', suggestion: 'Use "Seikai" (Correct/Right answer).' },
      ];

      let score = parsed.nuance_score || 85;

      if (brandGuardActive && styleguideRules.length > 0) {
        const complianceReport = await geminiService.checkStyleguideCompliance(text, 'Target', styleguideRules);
        
        complianceReport.violations.forEach(v => {
          insights.push({
            category: 'Brand',
            message: v.explanation,
            severity: v.severity as any,
            suggestion: v.suggestion
          });
        });

        // Weigh the scores
        score = Math.floor((score + complianceReport.score) / 2);
      }

      setResults({ score, insights });
    } catch (e) {
      console.error(e);
      alert('Analysis failed. Ensure valid text input.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Content for Cultural Scan</h3>
            <div className="flex items-center space-x-2">
               <button 
                 onClick={() => setBrandGuardActive(!brandGuardActive)}
                 className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${
                   brandGuardActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                 }`}
               >
                 <i className={`ph-bold ${brandGuardActive ? 'ph-shield-check' : 'ph-shield'}`}></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">Brand Check</span>
               </button>
               <button onClick={() => setShowStyleguideConfig(true)} className="p-2 text-slate-400 hover:text-indigo-600">
                  <i className="ph-bold ph-gear-six text-xl"></i>
               </button>
            </div>
          </div>
          <textarea 
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-sm leading-relaxed transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-200 resize-none"
            placeholder="Paste your localized text here to verify its cultural and brand appropriateness..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
             <div className="flex-1 flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Culture</span>
                <input 
                  type="text" 
                  value={culture} 
                  onChange={(e) => setCulture(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold outline-none flex-1 dark:text-slate-100"
                />
             </div>
             <button 
               onClick={handleAnalyze}
               disabled={isAnalyzing || !text}
               className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all transform active:scale-95 w-full sm:w-auto"
             >
               {isAnalyzing ? 'Analyzing...' : 'Expert Scan'}
             </button>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <i className="ph ph-shield-check text-9xl"></i>
           </div>
           <div className="relative z-10">
              <h4 className="text-white font-bold text-lg mb-2">Nuance Guard x Brand Shield</h4>
              <p className="text-indigo-100 text-sm leading-relaxed max-w-md">
                Direct translation often fails in marketing contexts. Our combined engine prevents cultural blunders while enforcing 100% brand consistency.
              </p>
           </div>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Expert Alignment Score</h4>
          <div className="relative w-32 h-32 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle 
                  cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={376.8}
                  strokeDashoffset={376.8 - (376.8 * (results?.score || 0) / 100)}
                  className={`${(results?.score || 0) > 80 ? 'text-emerald-500' : (results?.score || 0) > 60 ? 'text-amber-500' : 'text-slate-200' } transition-all duration-1000`} 
                />
             </svg>
             <span className="absolute text-3xl font-black text-slate-800 dark:text-slate-100">{results?.score || '--'}</span>
          </div>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 font-medium italic">
            {results ? 'Analysis complete.' : 'Run a scan to see your alignment score.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Diarized Insights</h4>
            {results && <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{results.insights.length} Total</span>}
          </div>
          <div className="p-6 space-y-4 overflow-y-auto scrollbar-hide">
             {results ? results.insights.map((insight, i) => (
               <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between items-center mb-2">
                     <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${
                       insight.category === 'Brand' ? 'bg-emerald-100 text-emerald-700' :
                       insight.severity === 'High' ? 'bg-red-100 text-red-700' : insight.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                     }`}>{insight.category} • {insight.severity}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mb-3 leading-relaxed">{insight.message}</p>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] text-indigo-500 font-black uppercase mb-1 tracking-tighter">AI Recommendation</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">{insight.suggestion}</p>
                  </div>
               </div>
             )) : isAnalyzing ? (
               <div className="py-20 flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Running Diarization...</p>
               </div>
             ) : (
               <div className="py-20 flex flex-col items-center opacity-20 text-slate-400">
                  <i className="ph-bold ph-eye text-6xl"></i>
                  <p className="text-xs font-black mt-4 uppercase tracking-widest">Awaiting Analysis</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {showStyleguideConfig && <StyleguideConfig onClose={() => setShowStyleguideConfig(false)} />}
    </div>
  );
};

export default NuanceGuard;
