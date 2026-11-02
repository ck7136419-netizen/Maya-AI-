import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('INITIALIZING QUANTUM CORE...');
  const [checks, setChecks] = useState<string[]>([]);

  useEffect(() => {
    sounds.playBootSound();

    const sequence = [
      { p: 35, text: 'SYNAPSE NEURAL LINK ONLINE', check: 'Neural Network Initialized' },
      { p: 60, text: 'JARVIS PROTOCOLS ENGAGED', check: 'Hardware Bridge Calibrated' },
      { p: 85, text: 'GEMINI AI BRAIN CONNECTED', check: 'Voice Core Synchronized' },
      { p: 100, text: 'YASMIN AI SYSTEM ONLINE', check: 'Personal Companion Ready' },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const item = sequence[step];
        if (item) {
          setProgress(item.p);
          setStatusText(item.text);
          const currentCheck = item.check;
          setChecks((prev) => [...prev, currentCheck]);
          sounds.playClickSound();
        }
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 600);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full bg-radial from-neutral-900 via-neutral-950 to-black text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden relative">
      {/* Background Holographic Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF08_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-cyan-400 z-10">
        <span className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          SYSTEM BOOT SEQUENCE
        </span>
        <span className="text-neutral-500">STARK-OS // 2026</span>
      </div>

      {/* Center Arc Reactor Graphic */}
      <div className="flex flex-col items-center justify-center my-auto z-10 space-y-6 max-w-md w-full">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-purple-500/50 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-6 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/60 shadow-[0_0_50px_rgba(0,240,255,0.4)]" />

          {/* Center Reactor Core */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-1 flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.8)]">
            <div className="w-full h-full bg-neutral-950 rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400 tracking-wider">
                Y
              </span>
              <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest mt-0.5">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Title Lockup */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            YASMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">AI</span>
          </h1>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
            Future Personal Companion & JARVIS Assistant
          </p>
        </div>

        {/* Progress Bar & Status */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-300 font-bold tracking-wider">{statusText}</span>
            <span className="text-neutral-400 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Diagnostics check ticker */}
          <div className="pt-2 space-y-1">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 animate-in fade-in duration-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <div className="w-full max-w-md flex justify-end z-10">
        <button
          type="button"
          onClick={() => {
            sounds.playClickSound();
            onComplete();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-cyan-300 transition cursor-pointer"
        >
          <span>Skip Protocol</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
