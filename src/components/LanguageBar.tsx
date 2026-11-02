import React from 'react';
import { Languages, Sparkles } from 'lucide-react';

interface LanguageBarProps {
  onPromptClick: (prompt: string) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  'Hindi',
  'English',
  'Hinglish',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Punjabi',
];

const SUGGESTIONS = [
  { text: 'Hello Arushi, how are you?', lang: 'English' },
  { text: 'Arushi, Hindi mein baat karo', lang: 'Hindi' },
  { text: 'WhatsApp kholo', lang: 'Hinglish / Hindi' },
  { text: 'Call Mom', lang: 'English' },
  { text: 'Rahul ko call karo', lang: 'Hinglish' },
  { text: 'Open YouTube', lang: 'English' },
  { text: 'Aaj ka mausam kaisa hai?', lang: 'Hindi' },
];

export const LanguageBar: React.FC<LanguageBarProps> = ({ onPromptClick, disabled }) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Languages badges */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs text-neutral-400">
        <span className="flex items-center gap-1 text-neutral-500 mr-1 font-medium">
          <Languages className="w-3.5 h-3.5 text-rose-400" /> Auto-Detects:
        </span>
        {LANGUAGES.map((l) => (
          <span
            key={l}
            className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300"
          >
            {l}
          </span>
        ))}
      </div>

      {/* Suggested Spoken Phrases */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none justify-center flex-wrap">
        <span className="text-[11px] text-neutral-500 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" /> Try saying:
        </span>
        {SUGGESTIONS.map((item) => (
          <button
            key={item.text}
            type="button"
            disabled={disabled}
            onClick={() => onPromptClick(item.text)}
            className="px-3 py-1 rounded-full text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            &quot;{item.text}&quot;
          </button>
        ))}
      </div>
    </div>
  );
};
