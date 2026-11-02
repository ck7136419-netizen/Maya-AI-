import React from 'react';
import { Smartphone, Globe, ExternalLink, PhoneCall, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { ActionResult } from '../utils/deviceBridge';

interface DeviceActionCardProps {
  lastAction: ActionResult | null;
  onClear: () => void;
}

export const DeviceActionCard: React.FC<DeviceActionCardProps> = ({ lastAction, onClear }) => {
  if (!lastAction) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-md mx-auto rounded-2xl p-4 bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              lastAction.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            {lastAction.action === 'openWhatsApp' && <MessageCircle className="w-5 h-5" />}
            {lastAction.action === 'makeCall' && <PhoneCall className="w-5 h-5" />}
            {lastAction.action === 'callContact' && <PhoneCall className="w-5 h-5" />}
            {lastAction.action === 'openApp' && <Smartphone className="w-5 h-5" />}
            {lastAction.action === 'openUrl' && <Globe className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                Action: {lastAction.action}
              </span>
              {lastAction.success ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  <CheckCircle className="w-2.5 h-2.5" /> Executed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                  <AlertCircle className="w-2.5 h-2.5" /> Notice
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-100 mt-0.5">{lastAction.message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          aria-label="Dismiss action notification"
          className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-800 transition"
        >
          ×
        </button>
      </div>

      {lastAction.details && (
        <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
          {Object.entries(lastAction.details).map(([key, val]) => (
            <span key={key} className="px-2 py-0.5 bg-neutral-950 rounded border border-neutral-800">
              {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
