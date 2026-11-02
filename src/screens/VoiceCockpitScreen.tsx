import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  Languages,
  Radio,
  RotateCcw,
  VolumeX,
} from 'lucide-react';
import { AssistantVoiceState, UserSettings } from '../types/yasmin';
import { HolographicOrb } from '../components/HolographicOrb';
import { DeviceActionCard } from '../components/DeviceActionCard';
import { ActionResult } from '../utils/deviceBridge';
import { sounds } from '../utils/soundEffects';

interface VoiceCockpitScreenProps {
  settings: UserSettings;
  voiceState: AssistantVoiceState;
  micVolume: number;
  outputVolume: number;
  onToggleVoice: () => void;
  onInterrupt: () => void;
  lastAction: ActionResult | null;
  onClearLastAction: () => void;
  transcription: string;
  onOpenSpeakerTest: () => void;
  onSendVoiceText: (text: string) => void;
  isLiveConnected: boolean;
}

export const VoiceCockpitScreen: React.FC<VoiceCockpitScreenProps> = ({
  settings,
  voiceState,
  micVolume,
  outputVolume,
  onToggleVoice,
  onInterrupt,
  lastAction,
  onClearLastAction,
  transcription,
  onOpenSpeakerTest,
  onSendVoiceText,
  isLiveConnected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time audio waveform visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      offset += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const activeVolume = voiceState === 'SPEAKING' ? outputVolume : voiceState === 'LISTENING' ? micVolume : 0.05;
      const bars = 48;
      const barWidth = w / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const sinVal = Math.sin(i * 0.2 + offset);
        const cosVal = Math.cos(i * 0.3 - offset);
        const amp = (Math.abs(sinVal * cosVal) * activeVolume * 60 + 4);

        const gradient = ctx.createLinearGradient(0, cy - amp, 0, cy + amp);
        if (voiceState === 'SPEAKING') {
          gradient.addColorStop(0, '#F43F5E');
          gradient.addColorStop(0.5, '#A855F7');
          gradient.addColorStop(1, '#EC4899');
        } else if (voiceState === 'LISTENING') {
          gradient.addColorStop(0, '#00F0FF');
          gradient.addColorStop(0.5, '#06B6D4');
          gradient.addColorStop(1, '#3B82F6');
        } else {
          gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, cy - amp / 2, barWidth - 2, amp);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [voiceState, micVolume, outputVolume]);

  const quickVoicePrompts = [
    'Aapka naam kya hai?',
    'Play Arijit Singh songs on YouTube',
    'Open WhatsApp',
    'Call Mom',
    'Tell me a funny joke',
    'Ek acchi shayari sunao',
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] w-full max-w-2xl mx-auto px-4 py-4 justify-between items-center select-none">
      {/* Top Cockpit Telemetry */}
      <div className="w-full flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              isLiveConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isLiveConnected ? 'GEMINI LIVE STREAMING' : 'AUDIO STANDBY'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSpeakerTest}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[11px] transition cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Test Speaker (440Hz)</span>
        </button>
      </div>

      {/* Holographic Orb Centerpiece */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        <HolographicOrb
          state={voiceState}
          micVolume={micVolume}
          outputVolume={outputVolume}
          onClick={onToggleVoice}
          size="lg"
        />

        {/* State Label & Personality */}
        <div className="text-center mt-3 space-y-1">
          <div className="text-base sm:text-lg font-black tracking-wider text-white">
            {voiceState === 'IDLE' && 'YASMIN IS READY'}
            {voiceState === 'LISTENING' && 'LISTENING TO YOU...'}
            {voiceState === 'THINKING' && 'PROCESSING SPEECH...'}
            {voiceState === 'SPEAKING' && 'YASMIN IS SPEAKING'}
            {voiceState === 'ERROR' && 'CONNECTION NOTICE'}
          </div>
          <p className="text-xs font-mono text-purple-300">
            Speaking to {settings.nickname} ({settings.personality.toUpperCase()} COMPANION)
          </p>
        </div>
      </div>

      {/* Real-time Waveform */}
      <div className="w-full my-2">
        <canvas ref={canvasRef} width={500} height={40} className="w-full h-10 rounded-xl" />
      </div>

      {/* Transcript Ticker */}
      {transcription && (
        <div className="w-full p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 text-center text-xs text-neutral-300 italic max-h-24 overflow-y-auto">
          &quot;{transcription}&quot;
        </div>
      )}

      {/* Tool Execution Notification Card */}
      <div className="w-full my-2">
        <DeviceActionCard lastAction={lastAction} onClear={onClearLastAction} />
      </div>

      {/* Primary Voice Controls */}
      <div className="flex items-center gap-4 my-2">
        {voiceState === 'SPEAKING' && (
          <button
            type="button"
            onClick={onInterrupt}
            title="Interrupt YASMIN speaking"
            className="px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-rose-300 border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Interrupt</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleVoice}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 ${
            isLiveConnected || voiceState === 'LISTENING' || voiceState === 'SPEAKING'
              ? 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/50 animate-pulse'
              : 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105'
          }`}
        >
          {isLiveConnected || voiceState === 'LISTENING' ? (
            <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
          ) : (
            <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-200" />
          )}
        </button>

        {isLiveConnected && (
          <button
            type="button"
            onClick={onToggleVoice}
            title="Mute / End Session"
            className="px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg"
          >
            <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
            <span>End Session</span>
          </button>
        )}
      </div>

      {/* Suggested Spoken Phrases */}
      <div className="w-full pt-2">
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickVoicePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sounds.playClickSound();
                onSendVoiceText(p);
              }}
              className="px-3 py-1 rounded-full text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white shrink-0 transition active:scale-95 cursor-pointer"
            >
              &quot;{p}&quot;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
