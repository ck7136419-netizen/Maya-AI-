import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  ArrowDown,
  ArrowUp,
  Play,
  Pause,
  Type,
  ChevronLeft,
  Home,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  MousePointerClick,
  CheckCircle2,
  Clock,
  RotateCcw,
  Camera,
  Bell,
  Eye,
  Settings as SettingsIcon,
  HelpCircle,
} from 'lucide-react';
import {
  openAccessibilitySettings,
  executeAccessibilityScroll,
  executeAccessibilityType,
  executeAccessibilityGlobalAction,
  startContinuousAutoScroll,
  stopContinuousAutoScroll,
  toggleContinuousAutoScroll,
  isAutoScrollingActive,
  getAccessibilityPermissionState,
  setAccessibilityPermissionState,
  isAndroidAccessibilityBridgeAvailable,
  PRESET_ACCESSIBILITY_WORKFLOWS,
  executeAccessibilityWorkflow,
  AccessibilityWorkflow,
  ScrollDirection,
  GlobalActionType,
  ActionResult,
} from '../utils/deviceBridge';
import { sounds } from '../utils/soundEffects';

interface AccessibilityControllerProps {
  onShowActionCard: (result: ActionResult) => void;
  floatingWidgetEnabled: boolean;
  onToggleFloatingWidget: (enabled: boolean) => void;
}

export const AccessibilityController: React.FC<AccessibilityControllerProps> = ({
  onShowActionCard,
  floatingWidgetEnabled,
  onToggleFloatingWidget,
}) => {
  const [isGranted, setIsGranted] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [scrollDistance, setScrollDistance] = useState(450);
  const [inputText, setInputText] = useState('');
  const [typedDisplay, setTypedDisplay] = useState('');
  const [isTypingSimulating, setIsTypingSimulating] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);

  const hasNativeBridge = isAndroidAccessibilityBridgeAvailable();

  useEffect(() => {
    setIsGranted(getAccessibilityPermissionState());
    setIsAutoScrolling(isAutoScrollingActive());

    const handleAction = (e: Event) => {
      const custom = e as CustomEvent<{ type: string; direction?: string; text?: string }>;
      if (custom.detail?.type === 'TYPE' && custom.detail.text) {
        setTypedDisplay(custom.detail.text);
      }
    };

    const handleAutoScroll = (e: Event) => {
      const custom = e as CustomEvent<{ active: boolean }>;
      setIsAutoScrolling(custom.detail.active);
    };

    const handleState = (e: Event) => {
      const custom = e as CustomEvent<{ isGranted?: boolean }>;
      if (custom.detail?.isGranted !== undefined) {
        setIsGranted(custom.detail.isGranted);
      }
    };

    window.addEventListener('yasmin:accessibility-action', handleAction);
    window.addEventListener('yasmin:autoscroll-changed', handleAutoScroll);
    window.addEventListener('yasmin:accessibility-state-changed', handleState);

    return () => {
      window.removeEventListener('yasmin:accessibility-action', handleAction);
      window.removeEventListener('yasmin:autoscroll-changed', handleAutoScroll);
      window.removeEventListener('yasmin:accessibility-state-changed', handleState);
    };
  }, []);

  // Direct Button: Open Android Accessibility Settings
  const handleOpenAccessibilitySettings = async () => {
    sounds.playClickSound();
    const result = await openAccessibilitySettings();
    setIsGranted(true);
    setAccessibilityPermissionState(true);
    setShowGuidanceModal(true);
    onShowActionCard(result);
  };

  // Scroll Actions
  const handleScroll = async (direction: ScrollDirection) => {
    sounds.playClickSound();
    const result = await executeAccessibilityScroll(direction, scrollDistance);
    onShowActionCard(result);
  };

  // Auto-scroll toggle
  const handleToggleAutoScroll = () => {
    sounds.playClickSound();
    const active = toggleContinuousAutoScroll(scrollSpeed);
    setIsAutoScrolling(active);
  };

  const handleSpeedChange = (speed: 'slow' | 'medium' | 'fast') => {
    sounds.playClickSound();
    setScrollSpeed(speed);
    if (isAutoScrolling) {
      startContinuousAutoScroll(speed);
    }
  };

  // Automated Typing
  const handleSimulateType = async (textToType: string) => {
    if (!textToType.trim()) return;
    sounds.playClickSound();
    setIsTypingSimulating(true);
    setTypedDisplay('');

    // Keystroke visual simulation
    let current = '';
    for (let i = 0; i < textToType.length; i++) {
      current += textToType[i];
      setTypedDisplay(current);
      // Small pause for realistic cyber typing
      await new Promise((r) => setTimeout(r, 25));
    }

    const result = await executeAccessibilityType(textToType);
    setIsTypingSimulating(false);
    onShowActionCard(result);
  };

  // Global Actions
  const handleGlobalAction = async (action: GlobalActionType) => {
    sounds.playClickSound();
    const result = await executeAccessibilityGlobalAction(action);
    onShowActionCard(result);
  };

  // Workflows
  const handleRunWorkflow = async (wf: AccessibilityWorkflow) => {
    sounds.playClickSound();
    setActiveWorkflowId(wf.id);
    setWorkflowStatus(`Starting ${wf.name}...`);

    const result = await executeAccessibilityWorkflow(wf, (idx, total, msg) => {
      setWorkflowStatus(`Step ${idx + 1}/${total}: ${msg}`);
    });

    setActiveWorkflowId(null);
    setWorkflowStatus(null);
    onShowActionCard(result);
  };

  const quickPhrases = [
    { label: 'Greeting', text: 'Hello Boss! YASMIN AI is here to help.' },
    { label: 'Status Update', text: 'Main abhi kaam kar raha hoon, thodi der mein baat karte hain.' },
    { label: 'Search Query', text: 'Latest artificial intelligence developments in 2026' },
    { label: 'Confirmation', text: 'Ji Boss, saare tasks successfully schedule ho gaye hain.' },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* HERO SECTION: DIRECT ANDROID ACCESSIBILITY PERMISSION BUTTON */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_35px_rgba(0,240,255,0.15)]">
        {/* Futuristic glowing backdrop accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-wide">
                    ANDROID ACCESSIBILITY SERVICE
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isGranted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isGranted ? 'PERMISSION ACTIVE' : 'GRANT REQUIRED'}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Phone ko poora control dene ke liye settings kholkar YASMIN AI Accessibility ko Allow karein
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuidanceModal(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* THE PROMINENT ACCESSIBILITY SETTINGS BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAccessibilitySettings}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-purple-600 hover:from-cyan-300 hover:via-sky-400 hover:to-purple-500 text-black font-black text-sm sm:text-base font-mono flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Smartphone className="w-5 h-5 text-black" />
              <span>OPEN ANDROID ACCESSIBILITY SETTINGS / GRANT PHONE CONTROL</span>
              <ExternalLink className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Quick status bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-neutral-400">
            <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
              <span>Android Bridge:</span>
              <span className={hasNativeBridge ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                {hasNativeBridge ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
              <span>Touch Control:</span>
              <span className="text-cyan-400 font-bold">READY</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
              <span>Auto-Typing:</span>
              <span className="text-purple-400 font-bold">CALIBRATED</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between">
              <span>Auto-Scroll:</span>
              <span className={isAutoScrolling ? 'text-emerald-400 font-bold animate-pulse' : 'text-neutral-400'}>
                {isAutoScrolling ? 'RUNNING' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING ASSISTIVE TOUCH WIDGET TOGGLE */}
      <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Floating Assistive Touch Overlay Bubble</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Show a floating cyber-bubble on the phone screen with quick access to Scroll, Typing, and Android Back/Home.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            sounds.playClickSound();
            onToggleFloatingWidget(!floatingWidgetEnabled);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
            floatingWidgetEnabled
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'bg-neutral-800 text-neutral-300'
          }`}
        >
          {floatingWidgetEnabled ? 'Bubble ON' : 'Bubble OFF'}
        </button>
      </div>

      {/* SECTION 1: SCREEN SCROLLING & AUTO-SCROLL ENGINE */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">AUTOMATED SCREEN SCROLLING</h4>
              <p className="text-[11px] text-neutral-400">
                Smooth programmatic scrolling up/down or continuous reading auto-scroll
              </p>
            </div>
          </div>

          {/* Speed Pills */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['slow', 'medium', 'fast'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize transition cursor-pointer ${
                  scrollSpeed === s ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => handleScroll('up')}
            className="p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-mono text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer group"
          >
            <ArrowUp className="w-5 h-5 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-bold">Scroll Up</span>
            <span className="text-[10px] text-neutral-500">-{scrollDistance}px</span>
          </button>

          <button
            type="button"
            onClick={() => handleScroll('down')}
            className="p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-mono text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer group"
          >
            <ArrowDown className="w-5 h-5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
            <span className="font-bold">Scroll Down</span>
            <span className="text-[10px] text-neutral-500">+{scrollDistance}px</span>
          </button>

          <button
            type="button"
            onClick={() => handleScroll('top')}
            className="p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white font-mono text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="font-bold">Jump to Top</span>
            <span className="text-[10px] text-neutral-500">Header</span>
          </button>

          <button
            type="button"
            onClick={handleToggleAutoScroll}
            className={`p-3.5 rounded-2xl border font-mono text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isAutoScrolling
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-white'
            }`}
          >
            {isAutoScrolling ? (
              <Pause className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : (
              <Play className="w-5 h-5 text-amber-400" />
            )}
            <span className="font-bold">{isAutoScrolling ? 'Pause Auto-Scroll' : 'Start Auto-Scroll'}</span>
            <span className="text-[10px] text-neutral-500">{scrollSpeed} speed</span>
          </button>
        </div>

        {/* Scroll Distance Adjuster */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] font-mono text-neutral-400">Step Distance:</span>
          {[250, 450, 800, 1200].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                sounds.playClickSound();
                setScrollDistance(d);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                scrollDistance === d
                  ? 'bg-neutral-800 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'bg-neutral-950 text-neutral-500 hover:text-white'
              }`}
            >
              {d}px
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: AUTOMATED TEXT TYPING & IME INJECTION */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">AUTOMATED TEXT TYPING & INJECTION</h4>
              <p className="text-[11px] text-neutral-400">
                Types character-by-character into any active Android app, search box, or message field
              </p>
            </div>
          </div>

          {isTypingSimulating && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-purple-400 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>TYPING IN PROGRESS...</span>
            </div>
          )}
        </div>

        {/* Interactive Typing Box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to auto-type into target app or screen..."
              className="w-full p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 focus:border-purple-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none resize-none"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute top-3 right-3 text-neutral-500 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Phrases */}
          <div className="flex flex-wrap gap-2">
            {quickPhrases.map((phrase) => (
              <button
                key={phrase.label}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  setInputText(phrase.text);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-mono transition cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-cyan-400 font-bold">{phrase.label}:</span>
                <span className="truncate max-w-[150px] text-neutral-400">{phrase.text}</span>
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSimulateType(inputText)}
              disabled={!inputText.trim() || isTypingSimulating}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-900/20"
            >
              <Type className="w-4 h-4" />
              <span>AUTO-TYPE TEXT INTO ACTIVE SCREEN</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                sounds.playClickSound();
                await executeAccessibilityType('\n');
              }}
              className="px-4 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-xs transition cursor-pointer"
            >
              Enter ↵
            </button>
          </div>

          {/* Live Typing Visualizer */}
          {typedDisplay && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-purple-500/20 font-mono text-xs">
              <div className="text-[10px] text-purple-400 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>INJECTED KEYSTROKES:</span>
              </div>
              <div className="text-neutral-200 bg-neutral-900/70 p-2 rounded-lg border border-neutral-800 break-words">
                {typedDisplay}
                <span className="inline-block w-1.5 h-3 bg-purple-400 ml-1 animate-pulse align-middle" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ANDROID GLOBAL SYSTEM NAVIGATION */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">ANDROID SYSTEM GLOBAL ACTIONS</h4>
              <p className="text-[11px] text-neutral-400">
                Direct hardware navigation bar actions dispatched via AccessibilityService API
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            type="button"
            onClick={() => handleGlobalAction('BACK')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-400" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={() => handleGlobalAction('HOME')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <Home className="w-5 h-5 text-cyan-400" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => handleGlobalAction('RECENTS')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Recents</span>
          </button>
          <button
            type="button"
            onClick={() => handleGlobalAction('NOTIFICATIONS')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <Bell className="w-5 h-5 text-cyan-400" />
            <span>Notifs</span>
          </button>
          <button
            type="button"
            onClick={() => handleGlobalAction('QUICK_SETTINGS')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => handleGlobalAction('TAKE_SCREENSHOT')}
            className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white font-mono text-xs flex flex-col items-center gap-1.5 transition cursor-pointer"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>Screenshot</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: 1-CLICK MULTI-STEP AUTOMATION WORKFLOWS */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-mono">1-CLICK APP AUTOMATION WORKFLOWS</h4>
              <p className="text-[11px] text-neutral-400">
                Combined sequences: launch app, wait, auto-type text, and scroll autonomously
              </p>
            </div>
          </div>

          {workflowStatus && (
            <div className="text-[11px] font-mono text-emerald-400 animate-pulse">
              {workflowStatus}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_ACCESSIBILITY_WORKFLOWS.map((wf) => {
            const isRunning = activeWorkflowId === wf.id;
            return (
              <div
                key={wf.id}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/30 transition space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white font-mono">{wf.name}</h5>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{wf.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 text-cyan-300 border border-neutral-800">
                    {wf.steps.length} Steps
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] font-mono text-neutral-500">
                    Steps: {wf.steps.map((s) => s.action).join(' → ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunWorkflow(wf)}
                    disabled={isRunning}
                    className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Run Workflow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GUIDANCE MODAL */}
      {showGuidanceModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-cyan-500/40 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  HOW TO GRANT ACCESSIBILITY PERMISSION
                </h3>
                <p className="text-xs text-neutral-400">Android Phone Control Setup</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Tap <strong>"Open Android Accessibility Settings"</strong> above. Android's native Settings app will open.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>"Installed Services"</strong> or <strong>"Downloaded Apps"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">
                  3
                </span>
                <span>
                  Find and tap on <strong>"YASMIN AI"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">
                  4
                </span>
                <span>
                  Switch the toggle <strong>ON</strong> and tap <strong>"Allow"</strong> when prompted.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">
                  ✓
                </span>
                <span>
                  Return to YASMIN AI. YASMIN will now have full authority to open apps, auto-scroll, type text, and navigate!
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenAccessibilitySettings}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-mono transition cursor-pointer"
              >
                Open Settings Now
              </button>
              <button
                type="button"
                onClick={() => setShowGuidanceModal(false)}
                className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
