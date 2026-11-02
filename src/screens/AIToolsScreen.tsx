import React, { useState } from 'react';
import {
  Wrench,
  Globe,
  GraduationCap,
  Languages,
  PenTool,
  Image as ImageIcon,
  Calculator,
  CloudSun,
  Newspaper,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Upload,
} from 'lucide-react';
import { UserSettings } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';

interface AIToolsScreenProps {
  settings: UserSettings;
  customApiKey?: string;
}

export const AIToolsScreen: React.FC<AIToolsScreenProps> = ({ settings, customApiKey }) => {
  const [activeTool, setActiveTool] = useState<
    'search' | 'tutor' | 'translate' | 'writer' | 'vision' | 'math' | 'weather' | 'news'
  >('search');

  // Input states
  const [query, setQuery] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [writerTopic, setWriterTopic] = useState('');
  const [writerFormat, setWriterFormat] = useState('romantic-note');
  const [writerTone, setWriterTone] = useState('affectionate');
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('Describe this image and analyze its key details');
  const [mathInput, setMathInput] = useState('Calculate the orbital velocity of a satellite at 400km altitude');
  const [weatherCity, setWeatherCity] = useState('Mumbai');

  // Result state
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = [
    { id: 'search', label: 'Internet Search', icon: Globe, color: 'text-cyan-400' },
    { id: 'tutor', label: 'Study Tutor', icon: GraduationCap, color: 'text-purple-400' },
    { id: 'translate', label: 'Translator', icon: Languages, color: 'text-pink-400' },
    { id: 'writer', label: 'Creative Writer', icon: PenTool, color: 'text-rose-400' },
    { id: 'vision', label: 'Image Vision', icon: ImageIcon, color: 'text-emerald-400' },
    { id: 'math', label: 'Math & Physics', icon: Calculator, color: 'text-amber-400' },
    { id: 'weather', label: 'Weather Intel', icon: CloudSun, color: 'text-sky-400' },
    { id: 'news', label: 'Daily Briefing', icon: Newspaper, color: 'text-blue-400' },
  ];

  const handleRunTool = async () => {
    setIsLoading(true);
    setOutput(null);
    sounds.playClickSound();

    try {
      if (activeTool === 'translate') {
        const res = await fetch('/api/tools/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: query, targetLanguage: targetLang, customApiKey }),
        });
        const data = await res.json();
        setOutput(data.translation || data.error);
      } else if (activeTool === 'writer') {
        const res = await fetch('/api/tools/writer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: writerTopic,
            format: writerFormat,
            tone: writerTone,
            nickname: settings.nickname,
            customApiKey,
          }),
        });
        const data = await res.json();
        setOutput(data.content || data.error);
      } else if (activeTool === 'math') {
        const res = await fetch('/api/tools/math', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expression: mathInput, customApiKey }),
        });
        const data = await res.json();
        setOutput(data.solution || data.error);
      } else if (activeTool === 'vision') {
        if (!visionImage) {
          setOutput('Please upload an image first.');
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: visionImage,
            prompt: visionPrompt,
            customApiKey,
          }),
        });
        const data = await res.json();
        setOutput(data.result || data.error);
      } else {
        // Search, Tutor, Weather, News via /api/chat with appropriate system context
        let promptToSend = query;
        let useSearch = false;

        if (activeTool === 'search') {
          useSearch = true;
          promptToSend = `Search the web for up to date information on: "${query}". Provide a well-cited comprehensive breakdown.`;
        } else if (activeTool === 'tutor') {
          promptToSend = `Act as an expert academic tutor for ${settings.nickname}. Explain this topic step-by-step with analogies and examples:\n\n"${query}"`;
        } else if (activeTool === 'weather') {
          useSearch = true;
          promptToSend = `Provide a detailed weather report, forecast, and clothing/outdoor recommendations for ${weatherCity} today.`;
        } else if (activeTool === 'news') {
          useSearch = true;
          promptToSend = `Provide a concise, high-impact news briefing on current top headlines in technology, science, and world events.`;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptToSend,
            personality: settings.personality,
            nickname: settings.nickname,
            language: settings.language,
            useSearch,
            customApiKey,
          }),
        });
        const data = await res.json();
        setOutput(data.reply || data.error);
      }
    } catch (err) {
      setOutput(`Error running AI tool: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setVisionImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              YASMIN AI Intelligence Suite
            </div>
            <div className="text-[11px] text-neutral-400">
              Specialized neural subroutines powered by Google Gemini
            </div>
          </div>
        </div>
      </div>

      {/* Tools Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                sounds.playClickSound();
                setActiveTool(t.id as unknown as typeof activeTool);
                setOutput(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${t.color}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Work Area */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        {activeTool === 'translate' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-pink-300">Target Language:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-pink-300"
              >
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Japanese">Japanese</option>
                <option value="German">German</option>
              </select>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-24 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 resize-none"
            />
          </div>
        ) : activeTool === 'writer' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Format:</label>
                <select
                  value={writerFormat}
                  onChange={(e) => setWriterFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-rose-300"
                >
                  <option value="romantic-letter">Romantic Letter / Shayari</option>
                  <option value="professional-email">Professional Email</option>
                  <option value="social-caption">Instagram / Social Caption</option>
                  <option value="poem">Poem</option>
                  <option value="essay">Analytical Essay</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">Tone:</label>
                <select
                  value={writerTone}
                  onChange={(e) => setWriterTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-rose-300"
                >
                  <option value="affectionate">Loving & Sweet</option>
                  <option value="formal">Sharp & Professional</option>
                  <option value="witty">Humorous & Witty</option>
                  <option value="inspirational">Motivational</option>
                </select>
              </div>
            </div>
            <textarea
              value={writerTopic}
              onChange={(e) => setWriterTopic(e.target.value)}
              placeholder="What topic or feelings should YASMIN write about?..."
              className="w-full h-20 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
        ) : activeTool === 'vision' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs text-emerald-300 flex items-center gap-2 transition">
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
              {visionImage && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Image Ready
                </span>
              )}
            </div>
            {visionImage && (
              <div className="w-32 h-32 rounded-xl overflow-hidden border border-neutral-800">
                <img src={visionImage} alt="Analysis target" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="text"
              value={visionPrompt}
              onChange={(e) => setVisionPrompt(e.target.value)}
              placeholder="What should YASMIN analyze in this image?..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        ) : activeTool === 'math' ? (
          <div className="space-y-2">
            <label className="text-xs font-mono text-amber-300">Math / Physics Equation or Problem:</label>
            <input
              type="text"
              value={mathInput}
              onChange={(e) => setMathInput(e.target.value)}
              placeholder="e.g. Solve 3x^2 - 12x + 9 = 0 or calculate kinetic energy"
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        ) : activeTool === 'weather' ? (
          <div className="space-y-2">
            <label className="text-xs font-mono text-sky-300">City / Location:</label>
            <input
              type="text"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              placeholder="Enter city (e.g. Mumbai, Delhi, London)..."
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-sky-200 focus:outline-none focus:border-sky-400"
            />
          </div>
        ) : (
          /* Search, Tutor, News */
          <div className="space-y-2">
            <label className="text-xs font-mono text-cyan-300">
              {activeTool === 'search' ? 'Web Search Query:' : activeTool === 'tutor' ? 'Subject or Topic to Learn:' : 'News Topic:'}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTool === 'search'
                  ? 'Search live real-time internet knowledge...'
                  : activeTool === 'tutor'
                  ? 'Explain quantum entanglement or Python decorators...'
                  : 'Latest AI breakthroughs or world events...'
              }
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleRunTool}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Processing Neural Computation...' : 'Execute Intelligence Protocol'}</span>
        </button>

        {/* Output Box */}
        {output && (
          <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 select-text">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 pb-2 border-b border-neutral-800">
              <span>YASMIN Analysis Result</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-neutral-200">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
