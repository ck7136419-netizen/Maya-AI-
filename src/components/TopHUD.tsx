import React, { useEffect, useState } from 'react';
import {
  Battery,
  BatteryCharging,
  Cpu,
  Radio,
  Settings,
  Sparkles,
  Zap,
  LogIn,
  LogOut,
  ShieldAlert,
  Cloud,
} from 'lucide-react';
import { BatteryInfo, ScreenId } from '../types/yasmin';
import { useAuth } from '../firebase/AuthContext';

interface TopHUDProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  currentScreen,
  onNavigate,
  isVoiceActive,
  onToggleVoice,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [battery, setBattery] = useState<BatteryInfo>({
    supported: false,
    level: 0.88,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
  });

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Battery API status
  useEffect(() => {
    interface BatteryManager {
      level: number;
      charging: boolean;
      chargingTime: number;
      dischargingTime: number;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    }

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((bm) => {
          const update = () => {
            setBattery({
              supported: true,
              level: bm.level,
              charging: bm.charging,
              chargingTime: bm.chargingTime,
              dischargingTime: bm.dischargingTime,
            });
          };
          update();
          bm.addEventListener('levelchange', update);
          bm.addEventListener('chargingchange', update);
        })
        .catch(() => {
          // Battery API denied or unsupported
        });
    }
  }, []);

  const screenTitles: Record<ScreenId, string> = {
    splash: 'BOOT SEQUENCE',
    onboarding: 'WELCOME PROTOCOL',
    home: 'COMMAND CENTER',
    chat: 'NEURAL CHAT',
    voice: 'VOICE COCKPIT',
    coding: 'CODING STUDIO',
    'app-control': 'JARVIS CONTROLS',
    youtube: 'YOUTUBE MUSIC',
    tools: 'AI INTELLIGENCE',
    history: 'CHRONICLES',
    memory: 'NEURAL MEMORY',
    planner: 'DAILY PROTOCOLS',
    settings: 'SYSTEM SETTINGS',
    brain: 'GEMINI BRAIN',
    permissions: 'SECURITY & ACCESS',
    admin: 'OWNER ADMIN',
  };

  const { currentUser, isOwner, signInWithGoogle, logout } = useAuth();
  const batteryPercent = Math.round(battery.level * 100);

  return (
    <header className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-cyan-500/20 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-40 text-neutral-200 select-none">
      {/* Brand & Screen Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 group cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 text-sm">
              Y
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white flex items-center gap-1">
                YASMIN <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-400 hidden sm:inline">v2.5.0</span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              {screenTitles[currentScreen] || 'SYSTEM READY'}
            </div>
          </div>
        </button>
      </div>

      {/* Center HUD status & Clock */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px]">CORE:</span>
          <span className="text-cyan-300 font-bold">OPTIMAL</span>
        </div>

        <div className="text-center">
          <div className="text-xs font-bold text-white tracking-wider">{timeStr}</div>
          <div className="text-[9px] text-neutral-400">{dateStr}</div>
        </div>
      </div>

      {/* Right Action Icons: Cloud Auth, Admin, Battery, Live Status, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Firebase Cloud Auth Status */}
        {currentUser ? (
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                title="Owner Remote Admin Dashboard"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono text-purple-300 hover:bg-purple-500/30 transition cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-purple-400 animate-pulse" />
                <span className="hidden sm:inline">ADMIN</span>
              </button>
            )}

            <div
              title={`Logged in as ${currentUser.email || 'User'}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-emerald-500/30 text-[11px] font-mono text-emerald-300"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline truncate max-w-[80px]">
                {currentUser.displayName || 'Cloud'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            title="Sign in with Google for Permanent Cloud Memories"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-mono font-bold text-cyan-300 transition cursor-pointer shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cloud Sign In</span>
          </button>
        )}

        {/* Battery widget */}
        <div
          title={`Battery: ${batteryPercent}% ${battery.charging ? '(Charging)' : ''}`}
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300"
        >
          {battery.charging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{batteryPercent}%</span>
        </div>

        {/* Quick Voice Mode trigger */}
        <button
          type="button"
          onClick={onToggleVoice}
          title={isVoiceActive ? 'Disconnect Voice Session' : 'Activate Voice Cockpit'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer active:scale-95 ${
            isVoiceActive
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
          }`}
        >
          <Radio className={`w-3 h-3 ${isVoiceActive ? 'animate-pulse text-rose-400' : 'text-cyan-400'}`} />
          <span className="hidden md:inline">{isVoiceActive ? 'Voice Live' : 'Voice'}</span>
        </button>

        {/* Brain Settings Link */}
        <button
          type="button"
          onClick={() => onNavigate('brain')}
          title="Gemini AI Brain Settings"
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-cyan-400 transition cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-400" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          title="System Settings"
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
