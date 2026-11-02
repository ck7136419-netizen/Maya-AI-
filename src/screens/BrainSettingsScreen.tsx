import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Key,
  Cpu,
  Sliders,
  Server,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { UserSettings } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';

interface BrainSettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const BrainSettingsScreen: React.FC<BrainSettingsScreenProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const availableModels = [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash (Recommended)',
      description: 'Balanced speed, multimodal power, and high emotional intelligence.',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      description: 'Ultra-fast low-latency responses for rapid chat.',
    },
    {
      id: 'gemini-4-argon',
      name: 'Gemini 4 Argon',
      description: 'Maximum deep reasoning for complex coding and STEM.',
    },
    {
      id: 'gemini-3.8-live',
      name: 'Gemini 3.8 Live (Voice-to-Voice)',
      description: 'Native bidirectional audio streaming for real-time conversation.',
    },
  ];

  const handleSaveKey = () => {
    sounds.playClickSound();
    onUpdateSettings({ geminiApiKey: apiKeyInput.trim() });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    sounds.playClickSound();

    try {
      const res = await fetch('/api/gemini/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() || undefined }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        sounds.playSuccessChime();
      } else {
        sounds.playAlertTone();
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      sounds.playAlertTone();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-amber-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Gemini AI Brain Architecture
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Configure primary neural model, API key credentials, and response temperature
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Secure Server-Side Proxy: </span>
          All Gemini AI calls are proxied securely through the backend (`/api/*`).
          If you leave the API key field blank, YASMIN will automatically use the environment key (`process.env.GEMINI_API_KEY`).
        </div>
      </div>

      {/* API Key Configuration */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Key className="w-4 h-4" /> Gemini API Key Management
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste custom Gemini API key (or leave empty to use server default)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs transition cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Pinging Gemini Neural Core...' : 'Test API Connection & Latency'}</span>
          </button>
        </div>

        {/* Test Diagnostics Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {testResult.success
                  ? `Connection Verified! Model: ${testResult.message}`
                  : `Connection Failed: ${testResult.error}`}
              </span>
            </div>
            {testResult.latencyMs && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 font-bold">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4" /> Neural Model Selection
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {availableModels.map((m) => {
            const isSelected = settings.geminiModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  onUpdateSettings({ geminiModel: m.id });
                }}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-950 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {m.name}
                    {isSelected && (
                      <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        ACTIVE BRAIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{m.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature & Hyperparameters */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="text-xs font-mono text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4" /> Response Creativity (Temperature)
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-300">
            <span>Creativity vs Precision</span>
            <span className="font-mono text-purple-300">{settings.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>Precise (0.1)</span>
            <span>Balanced (0.7)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
