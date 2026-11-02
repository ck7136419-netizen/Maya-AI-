import React, { useState } from 'react';
import { Volume2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

interface SpeakerDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioEngine: AudioEngine;
}

export const SpeakerDiagnosticModal: React.FC<SpeakerDiagnosticModalProps> = ({
  isOpen,
  onClose,
  audioEngine,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tonePlayed, setTonePlayed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestSpeaker = async () => {
    setIsPlaying(true);
    setStatusMessage('Generating 440Hz sine wave through AudioContext -> GainNode -> Destination...');
    try {
      await audioEngine.playSpeakerTestTone();
      setTonePlayed(true);
      setStatusMessage('Tone dispatched! Did you hear a clean 440Hz beep through your speaker/headphones?');
    } catch (err) {
      setStatusMessage(`Error playing tone: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostic-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close diagnostic modal"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 id="diagnostic-title" className="text-xl font-bold">
              Speaker Output Diagnostic
            </h2>
            <p className="text-xs text-neutral-400">
              Validates Web Audio API pipeline & mobile speaker output
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/80 mb-5 text-sm space-y-3">
          <div className="flex items-center justify-between py-1 border-b border-neutral-800">
            <span className="text-neutral-400">Audio Graph</span>
            <span className="font-mono text-xs text-emerald-400">Oscillator (440Hz) → Gain (1.0) → Destination</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-neutral-800">
            <span className="text-neutral-400">Target Output Rate</span>
            <span className="font-mono text-xs text-neutral-200">24,000 Hz (Gemini Live standard)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-neutral-400">Autoplay Policy</span>
            <span className="font-mono text-xs text-neutral-200">Resumed via User Gesture</span>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-5 p-3 rounded-lg bg-neutral-800/60 border border-neutral-700 text-xs text-neutral-300">
            {statusMessage}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>If you hear the 440Hz tone, your device speaker and browser audio permissions are working.</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>If silent on mobile Chrome/Safari, ensure your device silent switch is OFF and media volume is up.</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestSpeaker}
            disabled={isPlaying}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Playing Tone...' : tonePlayed ? 'Play Tone Again' : 'Test Speaker (440Hz)'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
