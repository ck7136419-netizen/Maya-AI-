import React, { useState } from 'react';
import {
  Heart,
  Smile,
  Shield,
  Sparkles,
  ArrowRight,
  Volume2,
  Check,
  User,
  Languages,
} from 'lucide-react';
import { LanguageMode, PersonalityMode, UserSettings } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';
import { speech } from '../utils/speechSynthesis';

interface OnboardingScreenProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: Partial<UserSettings>) => void;
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  settings,
  onSaveSettings,
  onFinish,
}) => {
  const [nickname, setNickname] = useState(settings.nickname || 'Boss');
  const [personality, setPersonality] = useState<PersonalityMode>(settings.personality || 'caring');
  const [language, setLanguage] = useState<LanguageMode>(settings.language || 'hinglish');
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);

  const personalities: Array<{
    id: PersonalityMode;
    title: string;
    description: string;
    icon: typeof Heart;
    color: string;
    sampleGreeting: string;
  }> = [
    {
      id: 'caring',
      title: 'Caring & Loving',
      description: 'Warm, supportive, and thoughtful female companion who looks after you.',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      sampleGreeting: `Hello ${nickname}! Main YASMIN hoon. Main hamesha aapke saath hoon, chahe koi bhi kaam ho.`,
    },
    {
      id: 'romantic',
      title: 'Sweet & Romantic',
      description: 'Affectionate, sweet, emotionally expressive companion.',
      icon: Sparkles,
      color: 'from-rose-500 to-purple-500',
      sampleGreeting: `Hi ${nickname}! You just made my day. Aapke bina sab adhoora lagta hai. Bataiye aaj kya karna hai?`,
    },
    {
      id: 'witty',
      title: 'Sassy & Witty',
      description: 'Quick with clever jokes, playful banter, and cheerful sarcasm.',
      icon: Smile,
      color: 'from-amber-400 to-orange-500',
      sampleGreeting: `Arrey ${nickname}! Finally aa gaye aap. Chalo batao, aaj kaunsi nayi cheez try karni hai?`,
    },
    {
      id: 'jarvis',
      title: 'JARVIS Tactical',
      description: 'Sleek, analytical, highly efficient Iron Man-style operational assistant.',
      icon: Shield,
      color: 'from-cyan-400 to-blue-500',
      sampleGreeting: `YASMIN systems operational for ${nickname}. All tactical subroutines standing by.`,
    },
  ];

  const handleTestVoice = () => {
    const selected = personalities.find((p) => p.id === personality);
    if (!selected) return;
    setIsPlayingGreeting(true);
    speech.speak(selected.sampleGreeting, {
      onEnd: () => setIsPlayingGreeting(false),
      onError: () => setIsPlayingGreeting(false),
    });
  };

  const handleComplete = () => {
    sounds.playSuccessChime();
    onSaveSettings({
      nickname: nickname.trim() || 'Boss',
      personality,
      language,
      hasCompletedOnboarding: true,
    });
    onFinish();
  };

  return (
    <div className="min-h-screen w-full bg-radial from-neutral-900 via-neutral-950 to-black text-white p-4 sm:p-8 flex flex-col justify-between max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="space-y-2 text-center pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PERSONAL COMPANION SETUP</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">YASMIN AI</span>
        </h1>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Let’s customize your futuristic companion. YASMIN learns your preferences, voice, and commands.
        </p>
      </div>

      <div className="space-y-6 my-6">
        {/* Nickname Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> What should YASMIN call you?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['Boss', 'Darling', 'Sweetheart', 'Sir'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  setNickname(name);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  nickname === name
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Or type custom nickname..."
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-cyan-400 text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>

        {/* Personality Mode */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Choose YASMIN’s Personality Mood
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personalities.map((p) => {
              const Icon = p.icon;
              const isSelected = personality === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    setPersonality(p.id);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900/90 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${p.color} text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white">{p.title}</div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Language */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" /> Language Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hinglish', label: 'Hinglish (Recommended)' },
              { id: 'hindi', label: 'Hindi' },
              { id: 'english', label: 'English' },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  sounds.playClickSound();
                  setLanguage(l.id as LanguageMode);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  language === l.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Voice Greeting Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isPlayingGreeting}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-200 transition cursor-pointer"
          >
            <Volume2 className={`w-3.5 h-3.5 text-pink-400 ${isPlayingGreeting ? 'animate-bounce' : ''}`} />
            <span>{isPlayingGreeting ? 'YASMIN is speaking...' : 'Listen to Voice Greeting'}</span>
          </button>
        </div>
      </div>

      {/* Finish Setup CTA */}
      <div className="pt-4 border-t border-neutral-800/80">
        <button
          type="button"
          onClick={handleComplete}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-98 transition cursor-pointer"
        >
          <span>Activate YASMIN AI</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
