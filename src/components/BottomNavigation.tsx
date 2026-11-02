import React from 'react';
import {
  Home,
  MessageSquare,
  Mic,
  Code2,
  Smartphone,
  Music,
  Wrench,
  Settings,
} from 'lucide-react';
import { ScreenId } from '../types/yasmin';

interface BottomNavigationProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isVoiceLive?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentScreen,
  onNavigate,
  isVoiceLive = false,
}) => {
  const tabs = [
    { id: 'home' as ScreenId, label: 'Home', icon: Home },
    { id: 'chat' as ScreenId, label: 'Chat', icon: MessageSquare },
    { id: 'voice' as ScreenId, label: 'Voice', icon: Mic, highlight: true },
    { id: 'coding' as ScreenId, label: 'Studio', icon: Code2 },
    { id: 'app-control' as ScreenId, label: 'Device', icon: Smartphone },
    { id: 'youtube' as ScreenId, label: 'Music', icon: Music },
    { id: 'tools' as ScreenId, label: 'Tools', icon: Wrench },
    { id: 'settings' as ScreenId, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Application navigation"
      className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 border-t border-cyan-500/20 bg-neutral-950/90 backdrop-blur-xl sticky bottom-0 z-40 select-none shadow-[0_-5px_25px_rgba(0,0,0,0.8)]"
    >
      <div className="flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className="relative -top-3 flex flex-col items-center group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isActive || isVoiceLive
                      ? 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-110'
                      : 'bg-neutral-900 border border-cyan-500/40 text-cyan-400 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-mono tracking-wider mt-0.5 ${
                    isActive ? 'text-cyan-300 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 py-1 flex flex-col items-center gap-1 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'text-cyan-300'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#00F0FF]" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[48px] sm:max-w-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
