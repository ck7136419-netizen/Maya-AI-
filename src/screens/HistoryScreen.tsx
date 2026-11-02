import React, { useState } from 'react';
import { History, Search, Trash2, MessageSquare, ArrowRight, Calendar } from 'lucide-react';
import { ConversationSession } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';

interface HistoryScreenProps {
  sessions: ConversationSession[];
  onSelectSession: (session: ConversationSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');

  const filtered = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.messages.some((m) => m.text.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Conversation Chronicles</div>
            <div className="text-[11px] text-neutral-400">Archived neural exchanges with YASMIN</div>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 font-mono transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search past conversations..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-400 text-xs text-white placeholder-neutral-500 focus:outline-none"
        />
      </div>

      {/* Sessions List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-neutral-800/60 rounded-2xl">
            No conversation logs found. Start chatting in Neural Chat!
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-purple-500/40 flex items-center justify-between gap-3 transition group"
            >
              <button
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  onSelectSession(s);
                }}
                className="flex-1 text-left flex items-start gap-3 min-w-0 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-neutral-800 text-purple-300 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{s.messages.length} messages</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDeleteSession(s.id)}
                title="Delete session"
                className="p-2 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
