import React, { useState } from 'react';
import { Brain, Plus, Trash2, Shield, Sparkles, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { MemoryItem, UserSettings } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';

interface MemoryScreenProps {
  settings: UserSettings;
  memories: MemoryItem[];
  onAddMemory: (content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearMemories: () => void;
  onToggleMemory: () => void;
}

export const MemoryScreen: React.FC<MemoryScreenProps> = ({
  settings,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearMemories,
  onToggleMemory,
}) => {
  const [newContent, setNewContent] = useState('');
  const [category, setCategory] = useState<MemoryItem['category']>('personal');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    sounds.playClickSound();
    onAddMemory(newContent.trim(), category);
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-pink-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Neural Memory Management
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                {memories.length} Facts
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Personalized facts YASMIN remembers to tailor conversations
            </div>
          </div>
        </div>

        {/* Memory Toggle */}
        <button
          type="button"
          onClick={onToggleMemory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono transition cursor-pointer"
        >
          <span className="text-neutral-400 text-[11px]">Memory:</span>
          {settings.memoryEnabled ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ON <ToggleRight className="w-4 h-4 text-emerald-400" />
            </span>
          ) : (
            <span className="text-neutral-500 font-bold flex items-center gap-1">
              OFF <ToggleLeft className="w-4 h-4 text-neutral-500" />
            </span>
          )}
        </button>
      </div>

      {/* Memory Status Notice */}
      <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          Memories are kept private and stored locally on your device.
        </span>

        {memories.length > 0 && (
          <button
            type="button"
            onClick={onClearMemories}
            className="text-rose-400 hover:text-rose-300 font-mono text-xs transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Add Custom Memory Form */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="text-xs font-bold text-white">Teach YASMIN a New Memory</div>
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="e.g. My favorite food is Biryani or I work as an Android Developer"
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
          />
          <div className="flex items-center justify-between">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MemoryItem['category'])}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-pink-300"
            >
              <option value="personal">Personal</option>
              <option value="preference">Preference</option>
              <option value="work">Work & Goals</option>
              <option value="habit">Habit</option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs"
              >
                Save Fact
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-neutral-800 hover:border-pink-500/40 text-neutral-400 hover:text-white text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Memory Fact</span>
        </button>
      )}

      {/* Memory Items List */}
      <div className="space-y-2.5">
        {memories.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-neutral-800/60 rounded-2xl">
            No memories stored yet. Add custom memories or allow YASMIN to learn from conversations!
          </div>
        ) : (
          memories.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-pink-500/30 flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0 shadow-[0_0_8px_#EC4899]" />
                <div className="min-w-0">
                  <div className="text-xs text-neutral-100 font-medium break-words">{m.content}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">
                    Category: {m.category}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteMemory(m.id)}
                title="Remove memory"
                className="p-1.5 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
