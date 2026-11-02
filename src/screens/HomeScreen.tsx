import React, { useState } from 'react';
import {
  Mic,
  MessageSquare,
  Code2,
  Smartphone,
  Music,
  Wrench,
  Brain,
  Calendar,
  Sparkles,
  Zap,
  Volume2,
  ChevronRight,
  Shield,
  Send,
} from 'lucide-react';
import { AssistantVoiceState, ScreenId, UserSettings } from '../types/yasmin';
import { HolographicOrb } from '../components/HolographicOrb';
import { DeviceActionCard } from '../components/DeviceActionCard';
import { ActionResult } from '../utils/deviceBridge';
import { sounds } from '../utils/soundEffects';

interface HomeScreenProps {
  settings: UserSettings;
  voiceState: AssistantVoiceState;
  micVolume: number;
  outputVolume: number;
  onToggleVoice: () => void;
  onNavigate: (screen: ScreenId) => void;
  onQuickPrompt: (prompt: string) => void;
  lastAction: ActionResult | null;
  onClearLastAction: () => void;
  memoriesCount: number;
  tasksCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  settings,
  voiceState,
  micVolume,
  outputVolume,
  onToggleVoice,
  onNavigate,
  onQuickPrompt,
  lastAction,
  onClearLastAction,
  memoriesCount,
  tasksCount,
}) => {
  const [quickInput, setQuickInput] = useState('');

  const quickChips = [
    { text: `Good morning, YASMIN!`, label: 'Greeting' },
    { text: 'Play romantic songs on YouTube', label: 'Music' },
    { text: 'WhatsApp kholo', label: 'WhatsApp' },
    { text: 'Call Mom', label: 'Dialer' },
    { text: 'Write a sweet romantic message for my crush', label: 'Writer' },
    { text: 'Explain how neural networks work', label: 'Study' },
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    sounds.playClickSound();
    onQuickPrompt(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-6 select-none">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/60 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              JARVIS PROTOCOL ACTIVE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Greetings, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">{settings.nickname}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            YASMIN AI is standing by. Personality mode:{' '}
            <span className="text-purple-300 font-semibold capitalize">{settings.personality}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/40 text-neutral-300 hover:text-cyan-300 transition cursor-pointer"
        >
          <Shield className="w-5 h-5 text-cyan-400" />
        </button>
      </div>

      {/* Prominent Android Accessibility Quick Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <span>Android Accessibility & Phone Control</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                PHONE AUTOMATION
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Auto-scroll, typing injection, app workflows & direct permission link
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('app-control')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-black font-extrabold text-xs font-mono flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
        >
          <span>Open Accessibility Hub</span>
          <ChevronRight className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Hero Holographic Orb Centerpiece */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        <HolographicOrb
          state={voiceState}
          micVolume={micVolume}
          outputVolume={outputVolume}
          onClick={onToggleVoice}
          size="lg"
        />

        {/* Action button beneath Orb */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleVoice}
            className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95 ${
              voiceState === 'LISTENING' || voiceState === 'SPEAKING'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/40 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-[0_0_20px_rgba(0,240,255,0.4)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>
              {voiceState === 'LISTENING'
                ? 'Listening to you... (Tap to Pause)'
                : voiceState === 'SPEAKING'
                ? 'Speaking... (Tap to Interrupt)'
                : voiceState === 'THINKING'
                ? 'Processing Thought...'
                : 'Tap to Talk with YASMIN'}
            </span>
          </button>
          <span className="text-[11px] font-mono text-neutral-500">
            Natural voice conversation in Hindi, English, & Hinglish
          </span>
        </div>
      </div>

      {/* Last Tool Action Notification */}
      <DeviceActionCard lastAction={lastAction} onClear={onClearLastAction} />

      {/* Fast Text Query Input */}
      <form onSubmit={handleQuickSubmit} className="relative w-full max-w-xl mx-auto">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={`Ask YASMIN anything or give a command, ${settings.nickname}...`}
          className="w-full pl-4 pr-12 py-3 bg-neutral-900/90 border border-neutral-800 focus:border-cyan-400 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none shadow-xl backdrop-blur-md"
        />
        <button
          type="submit"
          disabled={!quickInput.trim()}
          aria-label="Send command to YASMIN"
          className="absolute right-2 top-2 p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 text-white disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Voice & Chat Prompts
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sounds.playClickSound();
                onQuickPrompt(chip.text);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 text-neutral-200 hover:text-white shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{chip.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tactical Hub Command Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* Chat Studio */}
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-900 transition flex flex-col justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-cyan-400 transition" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-white">Neural Chat</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Multi-turn AI discussion</div>
          </div>
        </button>

        {/* Coding Studio */}
        <button
          type="button"
          onClick={() => onNavigate('coding')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-900 transition flex flex-col justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-purple-400 transition" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-white">Coding Studio</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Full IDE & Live Web Preview</div>
          </div>
        </button>

        {/* Phone Control */}
        <button
          type="button"
          onClick={() => onNavigate('app-control')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900 transition flex flex-col justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-white">Device Control</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">WhatsApp, Dialer, Torch</div>
          </div>
        </button>

        {/* YouTube Music */}
        <button
          type="button"
          onClick={() => onNavigate('youtube')}
          className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-pink-500/50 hover:bg-neutral-900 transition flex flex-col justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-110 transition-transform">
              <Music className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-pink-400 transition" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-white">YouTube Music</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Arijit, Lofi & Playlists</div>
          </div>
        </button>
      </div>

      {/* Secondary Status Badges: Memory & Planner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('memory')}
          className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Brain className="w-4 h-4 text-pink-400" />
            <div>
              <div className="text-xs font-semibold text-white">Neural Memory</div>
              <div className="text-[10px] text-neutral-400">{memoriesCount} facts retained</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('planner')}
          className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-semibold text-white">Tasks & Protocols</div>
              <div className="text-[10px] text-neutral-400">{tasksCount} reminders active</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tools')}
          className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-semibold text-white">AI Tools Suite</div>
              <div className="text-[10px] text-neutral-400">Search, Math, Vision & Tutor</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        </button>
      </div>
    </div>
  );
};
