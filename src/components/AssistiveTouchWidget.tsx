import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowDown,
  ArrowUp,
  Play,
  Pause,
  Type,
  ChevronLeft,
  Home,
  Sliders,
  X,
  ExternalLink,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import {
  openAccessibilitySettings,
  executeAccessibilityScroll,
  executeAccessibilityType,
  executeAccessibilityGlobalAction,
  toggleContinuousAutoScroll,
  isAutoScrollingActive,
  getAccessibilityPermissionState,
  ActionResult,
} from '../utils/deviceBridge';
import { sounds } from '../utils/soundEffects';

interface AssistiveTouchWidgetProps {
  onShowActionCard?: (result: ActionResult) => void;
  onOpenVoice?: () => void;
}

export const AssistiveTouchWidget: React.FC<AssistiveTouchWidgetProps> = ({
  onShowActionCard,
  onOpenVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isGranted, setIsGranted] = useState(false);
  const [quickTypeText, setQuickTypeText] = useState('');
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);

  useEffect(() => {
    setIsGranted(getAccessibilityPermissionState());
    setIsAutoScrolling(isAutoScrollingActive());

    const handleStateChange = (e: Event) => {
      const custom = e as CustomEvent<{ isGranted?: boolean }>;
      if (custom.detail?.isGranted !== undefined) {
        setIsGranted(custom.detail.isGranted);
      }
    };

    const handleAutoScrollChange = (e: Event) => {
      const custom = e as CustomEvent<{ active: boolean }>;
      setIsAutoScrolling(custom.detail.active);
    };

    window.addEventListener('yasmin:accessibility-state-changed', handleStateChange);
    window.addEventListener('yasmin:autoscroll-changed', handleAutoScrollChange);

    return () => {
      window.removeEventListener('yasmin:accessibility-state-changed', handleStateChange);
      window.removeEventListener('yasmin:autoscroll-changed', handleAutoScrollChange);
    };
  }, []);

  const handleOpenSettings = async () => {
    sounds.playClickSound();
    const result = await openAccessibilitySettings();
    setIsGranted(true);
    if (onShowActionCard) onShowActionCard(result);
  };

  const handleScroll = async (direction: 'up' | 'down') => {
    sounds.playClickSound();
    const result = await executeAccessibilityScroll(direction, 450);
    if (onShowActionCard) onShowActionCard(result);
  };

  const handleToggleAutoScroll = () => {
    sounds.playClickSound();
    const active = toggleContinuousAutoScroll('medium');
    setIsAutoScrolling(active);
  };

  const handleGlobal = async (action: 'BACK' | 'HOME' | 'RECENTS') => {
    sounds.playClickSound();
    const result = await executeAccessibilityGlobalAction(action);
    if (onShowActionCard) onShowActionCard(result);
  };

  const handleSendType = async () => {
    if (!quickTypeText.trim()) return;
    sounds.playClickSound();
    const result = await executeAccessibilityType(quickTypeText);
    setQuickTypeText('');
    setIsTypingModalOpen(false);
    if (onShowActionCard) onShowActionCard(result);
  };

  return (
    <>
      {/* Floating Assistive Touch Bubble */}
      <div className="fixed bottom-20 right-4 z-50 select-none">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => {
              sounds.playClickSound();
              setIsOpen(true);
            }}
            aria-label="Open Android Accessibility Menu"
            className="w-13 h-13 rounded-full bg-neutral-900/90 border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center text-cyan-300 hover:scale-110 active:scale-95 transition-transform backdrop-blur-md cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform" />
              {isAutoScrolling && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
          </button>
        ) : (
          <div className="w-72 rounded-3xl bg-neutral-950/95 border border-cyan-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-2xl p-4 space-y-3.5 text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
                  ANDROID ACCESSIBILITY
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Permission Grant / Settings Button */}
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-extrabold text-[11px] font-mono flex items-center justify-between shadow-lg transition active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>ACCESSIBILITY PERMISSION</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-black" />
            </button>

            {/* Scrolling Controls */}
            <div className="bg-neutral-900/80 rounded-2xl p-2.5 border border-neutral-800/80 space-y-1.5">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex justify-between">
                <span>Screen Scrolling</span>
                {isAutoScrolling && <span className="text-emerald-400 font-bold">AUTO ACTIVE</span>}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleScroll('up')}
                  className="py-2 px-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono flex flex-col items-center gap-0.5 transition cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px]">Scroll Up</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleAutoScroll}
                  className={`py-2 px-2 rounded-xl border text-xs font-mono flex flex-col items-center gap-0.5 transition cursor-pointer ${
                    isAutoScrolling
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
                  }`}
                >
                  {isAutoScrolling ? (
                    <Pause className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Play className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-[9px]">{isAutoScrolling ? 'Pause' : 'Auto-Scroll'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('down')}
                  className="py-2 px-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono flex flex-col items-center gap-0.5 transition cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px]">Scroll Down</span>
                </button>
              </div>
            </div>

            {/* Automated Typing Trigger */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  setIsTypingModalOpen(true);
                }}
                className="py-2 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-purple-400" />
                <span>Auto-Type</span>
              </button>
              {onOpenVoice && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    onOpenVoice();
                  }}
                  className="py-2 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Voice Copilot</span>
                </button>
              )}
            </div>

            {/* Android Global Navigation Bar */}
            <div className="bg-neutral-900/60 rounded-2xl p-2 border border-neutral-800/80 flex items-center justify-around">
              <button
                type="button"
                onClick={() => handleGlobal('BACK')}
                aria-label="Android Back"
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleGlobal('HOME')}
                aria-label="Android Home"
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleGlobal('RECENTS')}
                aria-label="Android Recents"
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <Sliders className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Typing Overlay Modal */}
      {isTypingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-purple-500/30 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Type className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white font-mono">AUTOMATED TYPING INJECTOR</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTypingModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              YASMIN will inject this text into the active screen, focused field, or phone clipboard via
              Accessibility Service.
            </p>

            <textarea
              rows={3}
              value={quickTypeText}
              onChange={(e) => setQuickTypeText(e.target.value)}
              placeholder="Type message, search query, or text to inject..."
              className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 focus:border-purple-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none resize-none"
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Hello from YASMIN AI!',
                'Haan Boss, bilkul theek hai.',
                'Searching latest updates...',
              ].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setQuickTypeText(phrase)}
                  className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-[10px] text-neutral-300 font-mono transition cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendType}
                disabled={!quickTypeText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs font-mono transition cursor-pointer"
              >
                Inject & Type
              </button>
              <button
                type="button"
                onClick={() => setIsTypingModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
