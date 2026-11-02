import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mic,
  Camera,
  Battery,
  Flashlight,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export const PermissionsScreen: React.FC = () => {
  const [micStatus, setMicStatus] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'prompt' | 'denied'>('prompt');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((p) => setMicStatus(p.state as typeof micStatus))
        .catch(() => {});

      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((p) => setCameraStatus(p.state as typeof cameraStatus))
        .catch(() => {});
    }
  }, []);

  const requestMic = async () => {
    sounds.playClickSound();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus('granted');
      sounds.playSuccessChime();
    } catch {
      setMicStatus('denied');
      sounds.playAlertTone();
    }
  };

  const requestCamera = async () => {
    sounds.playClickSound();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus('granted');
      sounds.playSuccessChime();
    } catch {
      setCameraStatus('denied');
      sounds.playAlertTone();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Permissions & Security Architecture</div>
            <div className="text-[11px] text-neutral-400">Device access status and privacy audit</div>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {/* Microphone */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-950 text-cyan-400 border border-neutral-800">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Microphone Access
                {micStatus === 'granted' ? (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                    GRANTED
                  </span>
                ) : micStatus === 'denied' ? (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                    BLOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                    NOT YET REQUESTED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Required for real-time speech capture & Gemini Live audio
              </div>
            </div>
          </div>

          {micStatus !== 'granted' && (
            <button
              type="button"
              onClick={requestMic}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs transition cursor-pointer"
            >
              Authorize
            </button>
          )}
        </div>

        {/* Camera & Flashlight */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-950 text-purple-400 border border-neutral-800">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Camera & Flashlight Torch
                {cameraStatus === 'granted' ? (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                    GRANTED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-neutral-800 text-neutral-400">
                    OPTIONAL
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Enables hardware rear flashlight and AI image understanding
              </div>
            </div>
          </div>

          {cameraStatus !== 'granted' && (
            <button
              type="button"
              onClick={requestCamera}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition cursor-pointer"
            >
              Authorize
            </button>
          )}
        </div>

        {/* Device Battery */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-950 text-emerald-400 border border-neutral-800">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Battery Status Monitor
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                  AUTO-ENABLED
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Live monitoring of charging state and power percentage
              </div>
            </div>
          </div>
        </div>

        {/* Android Accessibility Service Permission */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                Android Accessibility & Touch Automation
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  SYSTEM LEVEL
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Grants YASMIN ability to auto-scroll screens, type messages, and control phone navigation
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              sounds.playClickSound();
              const { openAccessibilitySettings } = await import('../utils/deviceBridge');
              await openAccessibilitySettings();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <span>Open Accessibility Settings</span>
          </button>
        </div>

        {/* Accessibility & Android Bridge */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-950 text-amber-400 border border-neutral-800">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Android APK Native Bridge Protocol
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Automatically engages when packaged as APK via Capacitor or Android WebView
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About YASMIN AI Box */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" /> About YASMIN AI
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          YASMIN AI combines the tactical prowess of JARVIS with the caring emotional intelligence of a personal female companion.
          Engineered for Android and Web using Google Gemini Live, Web Audio API, and real device action execution.
        </p>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400">
          <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800">Version 2.5.0-PRO</span>
          <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800">Gemini 3.8 Live</span>
          <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800">Multi-lingual Neural Voice</span>
        </div>
      </div>
    </div>
  );
};
