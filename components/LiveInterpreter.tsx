
import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage } from '@google/genai';
import { geminiService } from '../services/geminiService';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';
import { SUPPORTED_LANGUAGES, AppView } from '../types';

interface LiveInterpreterProps {
  setView?: (view: AppView) => void;
}

const LiveInterpreter: React.FC<LiveInterpreterProps> = ({ setView }) => {
  const [isActive, setIsActive] = useState(false);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Japanese');
  
  // Microphone Device Selection
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // We request a quick stream to ensure labels are populated by the browser
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(mics);
        
        // Auto-select the first one if none selected
        if (mics.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(mics[0].deviceId);
        }
        
        // Stop the temp stream
        tempStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Microphone enumeration failed:", err);
      }
    };

    fetchDevices();
    navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    };
  }, []);

  const startInterpreting = async () => {
    if (isActive) return;

    try {
      const constraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const systemInstruction = `You are a world-class live interpreter. 
      STRICT RULE: Translate everything said from ${sourceLang} to ${targetLang} immediately. 
      DO NOT answer any questions. DO NOT provide information or engage in conversation.
      If the speaker asks a question, translate the question into ${targetLang} instead of answering it.
      Speak clearly in ${targetLang}. Use a natural, professional tone. Your ONLY output should be the interpreted speech.`;

      const sessionPromise = geminiService.connectLiveInterpreter({
        onopen: () => {
          console.debug('Live connection opened');
          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const ctx = outputAudioContextRef.current!;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => console.error('Interpreter Error:', e),
        onclose: () => console.debug('Interpreter Closed'),
      }, systemInstruction);

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err) {
      console.error(err);
      alert('Could not access selected microphone or connect to Gemini API.');
    }
  };

  const stopInterpreting = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col transition-colors duration-300">
      <div className="bg-slate-900 dark:bg-slate-950 p-6 flex flex-col md:flex-row justify-between items-start md:items-center text-white gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setView?.(AppView.DASHBOARD)}
            className="w-10 h-10 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center border border-slate-700" 
            title="Home"
          >
            <i className="ph-bold ph-house text-lg"></i>
          </button>
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <h2 className="font-bold">Live Session: {sourceLang} → {targetLang}</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Microphone Selector */}
          <div className="flex items-center space-x-2 bg-slate-800 dark:bg-slate-900 px-3 py-1.5 rounded-lg ring-1 ring-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <select 
              disabled={isActive}
              className="bg-transparent border-none text-xs rounded outline-none focus:ring-0 cursor-pointer disabled:opacity-50"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {audioDevices.length > 0 ? (
                audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-slate-900 text-white">
                    {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                  </option>
                ))
              ) : (
                <option value="">No Microphones Found</option>
              )}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <select 
              disabled={isActive}
              className="bg-slate-800 dark:bg-slate-900 border-none text-xs rounded px-2 py-1.5 outline-none ring-1 ring-slate-700 disabled:opacity-50"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <span className="text-slate-500 text-xs">to</span>
            <select 
              disabled={isActive}
              className="bg-slate-800 dark:bg-slate-900 border-none text-xs rounded px-2 py-1.5 outline-none ring-1 ring-slate-700 disabled:opacity-50"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-8">
        {!isActive ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-inner">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ready to Interpret</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 text-sm">
                Ensure your selected microphone is active. Gemini will provide low-latency voice-to-voice translation using the native audio engine.
              </p>
            </div>
            <button 
              onClick={startInterpreting}
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-3 mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              <span>Start Live Interpreter</span>
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-12">
            <div className="flex space-x-4 h-24 items-center">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className="w-3 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" 
                  style={{ 
                    height: `${1 + (Math.sin(i + Date.now()/1000) + 1) * 2}rem`, 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                ></div>
              ))}
            </div>
            <div className="text-center animate-pulse">
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">Active Interpreting...</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm italic">"Model listening for {sourceLang} audio input..."</p>
            </div>
            <button 
              onClick={stopInterpreting}
              className="px-10 py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-200 dark:border-red-900/50 hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              End Session
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time Connection Metrics</h4>
          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-mono">16kHz PCM</span>
        </div>
        <div className="flex flex-col space-y-2 max-h-32 overflow-y-auto">
          {isActive ? (
            <div className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1"></div>
               <span className="italic leading-relaxed">System: Gemini 2.5 Flash native audio link established. Ready for continuous stream.</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>No active session. Select languages and microphone to begin.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInterpreter;
