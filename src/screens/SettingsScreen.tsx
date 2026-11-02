import React from 'react';
import {
  Settings,
  User,
  Heart,
  Languages,
  Volume2,
  Palette,
  Shield,
  Zap,
  Radio,
  Sparkles,
  ChevronRight,
  Bell,
  Sliders,
  Server,
} from 'lucide-react';
import { LanguageMode, PersonalityMode, ScreenId, UserSettings } from '../types/yasmin';
import { speech } from '../utils/speechSynthesis';
import { sounds } from '../utils/soundEffects';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  const voices = speech.getAvailableVoices();

  const handleTestVoice = () => {
    speech.speak(`Hello ${settings.nickname}, this is my active voice profile. How does it sound?`, {
      voiceName: settings.ttsVoiceName,
      pitch: settings.ttsPitch,
      rate: settings.ttsRate,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">YASMIN System Configuration</div>
            <div className="text-[11px] text-neutral-400">Personalize AI companion personality, voice, and theme</div>
          </div>
        </div>
      </div>

      {/* Fast Navigation to Brain & Permissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('brain')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-cyan-500/30 hover:border-cyan-400 flex items-center justify-between transition cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-cyan-300">
                Gemini AI Brain Settings
              </div>
              <div className="text-[11px] text-neutral-400">API Key, Model Selection, Latency Test</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 transition" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('permissions')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-500/30 hover:border-purple-400 flex items-center justify-between transition cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-purple-300">
                Permissions & Privacy
              </div>
              <div className="text-[11px] text-neutral-400">Microphone, Camera, Accessibility, Security</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 hover:border-emerald-400 flex items-center justify-between transition cursor-pointer group text-left sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 flex items-center gap-2">
                Cloud Backend & Remote Admin
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Owner: Boss
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Remote system prompt hot-reload, feature flags, Cloud Run server status & APK releases
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition" />
        </button>
      </div>

      {/* Companion Personalization */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4" /> Personalization
        </div>

        {/* Nickname */}
        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Preferred Nickname:</label>
          <input
            type="text"
            value={settings.nickname}
            onChange={(e) => onUpdateSettings({ nickname: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Personality Mode */}
        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">YASMIN Personality Mood:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'caring', label: 'Caring & Loving' },
              { id: 'romantic', label: 'Sweet & Romantic' },
              { id: 'witty', label: 'Sassy & Witty' },
              { id: 'jarvis', label: 'JARVIS Tactical' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  onUpdateSettings({ personality: p.id as PersonalityMode });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  settings.personality === p.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language Preference */}
        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Default Language:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hinglish', label: 'Hinglish' },
              { id: 'hindi', label: 'Hindi' },
              { id: 'english', label: 'English' },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  onUpdateSettings({ language: l.id as LanguageMode });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  settings.language === l.id
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice & Speech Tuning */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="text-xs font-mono text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
          <Volume2 className="w-4 h-4" /> Female Voice & Audio Synthesis
        </div>

        {/* Voice Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Select Voice Profile:</label>
          <select
            value={settings.ttsVoiceName}
            onChange={(e) => onUpdateSettings({ ttsVoiceName: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-pink-300 focus:outline-none"
          >
            <option value="">Default Female Voice (Auto-Matched)</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang}) {v.isFemale ? '✨ Female' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Pitch & Rate Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Voice Pitch</span>
              <span className="font-mono text-pink-400">{settings.ttsPitch.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={1.5}
              step={0.05}
              value={settings.ttsPitch}
              onChange={(e) => onUpdateSettings({ ttsPitch: parseFloat(e.target.value) })}
              className="w-full accent-pink-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Speech Rate</span>
              <span className="font-mono text-pink-400">{settings.ttsRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={1.4}
              step={0.05}
              value={settings.ttsRate}
              onChange={(e) => onUpdateSettings({ ttsRate: parseFloat(e.target.value) })}
              className="w-full accent-pink-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTestVoice}
            className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice Profile</span>
          </button>
        </div>
      </div>

      {/* UI Sound Effects & Wake-Word */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-4 h-4" /> System Sound & Wake-Word
        </div>

        <div className="flex items-center justify-between py-2 border-b border-neutral-800">
          <div>
            <div className="text-xs font-bold text-white">Futuristic UI Sound Effects</div>
            <div className="text-[11px] text-neutral-400">Arc-reactor boot chime and tactile HUD clicks</div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClickSound();
              onUpdateSettings({ soundEffects: !settings.soundEffects });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              settings.soundEffects ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {settings.soundEffects ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs font-bold text-white">&quot;Hey YASMIN&quot; Wake-Word Simulation</div>
            <div className="text-[11px] text-neutral-400">Activates voice listening on keyword recognition</div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClickSound();
              onUpdateSettings({ wakeWordEnabled: !settings.wakeWordEnabled });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              settings.wakeWordEnabled ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {settings.wakeWordEnabled ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
