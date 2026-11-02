import React, { useState } from 'react';
import {
  Smartphone,
  Phone,
  MessageSquare,
  Flashlight,
  Battery,
  Volume2,
  Globe,
  Camera,
  Image as ImageIcon,
  Compass,
  Music,
  Calculator,
  Settings as SettingsIcon,
  ShieldCheck,
  ExternalLink,
  Zap,
  Sliders,
  Type,
  ArrowDown,
} from 'lucide-react';
import {
  ALLOWED_APPS,
  ActionResult,
  executeMakeCall,
  executeOpenApp,
  executeOpenWhatsApp,
  executeSendSMS,
  isAndroidBridgeAvailable,
  openAccessibilitySettings,
} from '../utils/deviceBridge';
import { torch } from '../utils/torchController';
import { sounds } from '../utils/soundEffects';
import { AccessibilityController } from '../components/AccessibilityController';

interface AppControlScreenProps {
  onTriggerTorch: () => void;
  onShowActionCard: (result: ActionResult) => void;
  floatingWidgetEnabled?: boolean;
  onToggleFloatingWidget?: (enabled: boolean) => void;
}

export const AppControlScreen: React.FC<AppControlScreenProps> = ({
  onTriggerTorch,
  onShowActionCard,
  floatingWidgetEnabled = true,
  onToggleFloatingWidget = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'accessibility' | 'apps'>('accessibility');
  const [phoneToCall, setPhoneToCall] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('Hello from YASMIN AI');
  const [confirmCallNumber, setConfirmCallNumber] = useState<string | null>(null);
  const [volume, setVolume] = useState(80);
  const [isTorchActive, setIsTorchActive] = useState(false);

  const hasNative = isAndroidBridgeAvailable();

  const handleLaunchApp = async (appName: string) => {
    sounds.playClickSound();
    const result = await executeOpenApp(appName);
    onShowActionCard(result);
  };

  const handleConfirmCall = async (phone: string) => {
    sounds.playClickSound();
    setConfirmCallNumber(null);
    const result = await executeMakeCall(phone);
    onShowActionCard(result);
  };

  const handleSendSMS = async () => {
    if (!smsPhone.trim()) return;
    sounds.playClickSound();
    const result = await executeSendSMS(smsPhone, smsMessage);
    onShowActionCard(result);
  };

  const handleToggleTorch = async () => {
    sounds.playClickSound();
    const res = await torch.toggleTorch();
    setIsTorchActive(res.isOn);
    onTriggerTorch();
    onShowActionCard({
      success: res.success,
      action: 'flashlight',
      message: res.message,
    });
  };

  const quickApps = [
    { name: 'WhatsApp', key: 'whatsapp', icon: MessageSquare, color: 'from-emerald-500 to-green-600' },
    { name: 'YouTube', key: 'youtube', icon: Music, color: 'from-red-500 to-rose-600' },
    { name: 'Chrome', key: 'chrome', icon: Globe, color: 'from-amber-400 to-orange-500' },
    { name: 'Camera', key: 'camera', icon: Camera, color: 'from-cyan-400 to-blue-500' },
    { name: 'Gallery', key: 'gallery', icon: ImageIcon, color: 'from-purple-500 to-indigo-600' },
    { name: 'Maps', key: 'maps', icon: Compass, color: 'from-teal-400 to-emerald-500' },
    { name: 'Spotify', key: 'spotify', icon: Music, color: 'from-green-500 to-emerald-600' },
    { name: 'Calculator', key: 'calculator', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
    { name: 'Settings', key: 'settings', icon: SettingsIcon, color: 'from-neutral-600 to-neutral-700' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-5 select-none">
      {/* Top Selector: Accessibility vs Apps */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md">
        <div className="flex gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => {
              sounds.playClickSound();
              setActiveTab('accessibility');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ANDROID ACCESSIBILITY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClickSound();
              setActiveTab('apps');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'apps'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>APPS & HARDWARE</span>
          </button>
        </div>
      </div>

      {activeTab === 'accessibility' ? (
        /* ACCESSIBILITY & PHONE AUTOMATION SUITE */
        <AccessibilityController
          onShowActionCard={onShowActionCard}
          floatingWidgetEnabled={floatingWidgetEnabled}
          onToggleFloatingWidget={onToggleFloatingWidget}
        />
      ) : (
        /* INSTALLED APPS & HARDWARE CONTROLS */
        <div className="space-y-6">
          {/* Direct Settings Shortcut Banner */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">
                  Android Accessibility Permission Link
                </div>
                <div className="text-[11px] text-neutral-400">
                  Allow YASMIN to scroll, type, and interact with phone applications
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                sounds.playClickSound();
                const res = await openAccessibilitySettings();
                onShowActionCard(res);
              }}
              className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Open Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Launch App Grid */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Installed Applications (JARVIS App Launcher)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {quickApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.key}
                    type="button"
                    onClick={() => handleLaunchApp(app.name)}
                    className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-cyan-500/40 hover:bg-neutral-850 flex flex-col items-center justify-center gap-2 transition group cursor-pointer active:scale-95 shadow-md"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${app.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-neutral-200 group-hover:text-white truncate max-w-full">
                      {app.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hardware Actions: Flashlight, Volume, Dialer, SMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flashlight Torch Controller */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flashlight
                    className={`w-4 h-4 ${
                      isTorchActive ? 'text-amber-400 animate-pulse' : 'text-neutral-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Screen & Hardware Torch
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    isTorchActive
                      ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {isTorchActive ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Toggles device hardware camera torch via MediaStream track or full-screen white canvas in browser.
              </p>
            </div>

            {/* Volume Audio Slider */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Media Volume Control
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Direct Phone Calling */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Phone Dialer
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneToCall}
                  onChange={(e) => setPhoneToCall(e.target.value)}
                  placeholder="Enter phone number..."
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-emerald-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => phoneToCall && setConfirmCallNumber(phoneToCall)}
                  disabled={!phoneToCall.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <span>Dial</span>
                </button>
              </div>
            </div>

            {/* SMS Messaging */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Quick SMS Messenger
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="tel"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  placeholder="Recipient phone number..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-purple-400 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="SMS body..."
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-purple-400 text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendSMS}
                    disabled={!smsPhone.trim()}
                    className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe Calling Confirmation Modal */}
      {confirmCallNumber && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Call</h3>
                <p className="text-xs text-neutral-400">YASMIN safety verification</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300">
              Are you sure you want to dial{' '}
              <span className="font-mono text-emerald-400 font-bold">{confirmCallNumber}</span>?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirmCall(confirmCallNumber)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer"
              >
                Confirm Call
              </button>
              <button
                type="button"
                onClick={() => setConfirmCallNumber(null)}
                className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
