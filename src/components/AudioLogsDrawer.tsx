import React, { useState } from 'react';
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioLogEntry } from '../audio/AudioEngine';

interface AudioLogsDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: AudioLogEntry[];
  onClearLogs: () => void;
}

export const AudioLogsDrawer: React.FC<AudioLogsDrawerProps> = ({
  isOpen,
  onToggle,
  logs,
  onClearLogs,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.stage}] ${l.message} ${
            l.details ? JSON.stringify(l.details) : ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md overflow-hidden text-neutral-200 shadow-xl transition-all">
      {/* Header Bar */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-neutral-800/50 transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Audio Pipeline & Live Logs ({logs.length})
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
            Live Stream Diagnostics
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Expanded Logs Console */}
      {isOpen && (
        <div className="border-t border-neutral-800 p-4 bg-neutral-950 font-mono text-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800/80">
            <span className="text-[11px] text-neutral-400">
              Real-time PCM capture, Gemini Live chunks, 24kHz AudioBuffer decoding & scheduling
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                disabled={logs.length === 0}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={onClearLogs}
                disabled={logs.length === 0}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          <div className="h-64 overflow-y-auto space-y-1 pr-2 select-text">
            {logs.length === 0 ? (
              <div className="text-neutral-500 py-10 text-center italic">
                No logs yet. Press the microphone button to start the session.
              </div>
            ) : (
              logs.map((log) => {
                let badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                if (log.level === 'success') {
                  badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                } else if (log.level === 'warn') {
                  badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                } else if (log.level === 'error') {
                  badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                }

                return (
                  <div key={log.id} className="flex items-start gap-2 py-0.5 leading-relaxed">
                    <span className="text-neutral-500 shrink-0 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border text-[10px] shrink-0 ${badgeColor}`}>
                      {log.stage}
                    </span>
                    <span className="text-neutral-300 break-words flex-1">
                      {log.message}
                      {log.details && (
                        <span className="text-neutral-500 ml-1.5 text-[10px]">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
