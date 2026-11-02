import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  Bug,
  HelpCircle,
  Sparkles,
  FileCode,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface CodingStudioScreenProps {
  customApiKey?: string;
}

export const CodingStudioScreen: React.FC<CodingStudioScreenProps> = ({ customApiKey }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'terminal'>('editor');
  const [language, setLanguage] = useState<'javascript' | 'html' | 'python' | 'kotlin' | 'react' | 'java'>('html');
  const [prompt, setPrompt] = useState('Create a futuristic glowing digital clock with neon cyan styling');
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #050811;
      color: #00F0FF;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .clock {
      font-size: 3.5rem;
      font-weight: bold;
      text-shadow: 0 0 20px #00F0FF, 0 0 40px #8B5CF6;
      border: 2px solid #00F0FF;
      padding: 20px 40px;
      border-radius: 20px;
      background: rgba(0, 240, 255, 0.05);
    }
    .subtitle {
      margin-top: 15px;
      color: #A855F7;
      letter-spacing: 3px;
    }
  </style>
</head>
<body>
  <div class="clock" id="time">00:00:00</div>
  <div class="subtitle">YASMIN NEURAL CLOCK</div>
  <script>
    function update() {
      const now = new Date();
      document.getElementById('time').innerText = now.toLocaleTimeString();
    }
    setInterval(update, 1000);
    update();
  </script>
</body>
</html>`);

  const [terminalCommand, setTerminalCommand] = useState('adb install -r app-debug.apk');
  const [terminalResult, setTerminalResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleAction = async (action: 'generate' | 'explain' | 'fix' | 'debug') => {
    setIsLoading(true);
    setExplanation(null);
    sounds.playClickSound();

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt,
          code,
          language,
          customApiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        if (action === 'generate' || action === 'fix') {
          // Extract code block if returned in markdown
          const match = data.result.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
          if (match && match[1]) {
            setCode(match[1]);
          } else {
            setCode(data.result);
          }
          setActiveTab('preview');
        } else {
          setExplanation(data.result);
        }
      }
    } catch (err) {
      setExplanation(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainTerminal = async () => {
    if (!terminalCommand.trim()) return;
    setIsLoading(true);
    sounds.playClickSound();

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'terminal',
          prompt: terminalCommand,
          customApiKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTerminalResult(data.result);
      }
    } catch (err) {
      setTerminalResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'html' ? 'html' : language === 'python' ? 'py' : language === 'kotlin' ? 'kt' : 'js';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yasmin-project.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-4 select-none">
      {/* Top Studio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900/80 border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              YASMIN Coding Studio
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                IDE & Sandbox
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              HTML/JS, Kotlin, Android & Python Architecture
            </div>
          </div>
        </div>

        {/* Studio View Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'editor' ? 'bg-purple-500 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Code Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'preview' ? 'bg-cyan-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            Live Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'terminal' ? 'bg-emerald-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3 h-3" />
            Command Explainer
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      {activeTab === 'terminal' ? (
        /* Terminal Command Explainer */
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="text-xs font-mono text-neutral-400">
            Enter any Bash, Git, or Android ADB command to analyze its safety, flags, and impact before execution:
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={terminalCommand}
              onChange={(e) => setTerminalCommand(e.target.value)}
              placeholder="e.g. adb install -r app-debug.apk or git reset --hard HEAD"
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-emerald-400 text-xs font-mono text-emerald-300 placeholder-neutral-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleExplainTerminal}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Explain</span>
            </button>
          </div>

          {terminalResult && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed select-text">
              {terminalResult}
            </div>
          )}
        </div>
      ) : activeTab === 'preview' ? (
        /* Live Web Sandbox Preview */
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" /> Interactive Sandboxed Web Preview
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="text-xs text-purple-400 hover:underline cursor-pointer"
            >
              Back to Code
            </button>
          </div>

          <div className="w-full h-[450px] rounded-2xl border border-cyan-500/30 overflow-hidden bg-black shadow-2xl">
            <iframe
              srcDoc={code}
              title="YASMIN Web Sandbox"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : (
        /* Code Editor Mode */
        <div className="space-y-3">
          {/* Prompt Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want YASMIN to build or fix?..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-400 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as unknown as typeof language)}
              className="px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="html">HTML/CSS/JS</option>
              <option value="javascript">JavaScript / TypeScript</option>
              <option value="python">Python</option>
              <option value="kotlin">Kotlin (Android)</option>
              <option value="java">Java</option>
              <option value="react">React</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAction('generate')}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction('fix')}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Fix Bugs</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction('explain')}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Explain</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition cursor-pointer"
                title="Download code file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Explanation panel if returned */}
          {explanation && (
            <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-purple-500/30 text-xs font-mono text-neutral-200 select-text leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              <div className="text-purple-300 font-bold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> YASMIN Code Analysis:
              </div>
              {explanation}
            </div>
          )}

          {/* Code Textarea Editor */}
          <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
            <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                project.{language === 'html' ? 'html' : language === 'python' ? 'py' : 'ts'}
              </span>
              <span>{code.split('\n').length} lines</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 p-4 font-mono text-xs text-cyan-200 bg-neutral-950 focus:outline-none resize-none leading-relaxed select-text"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
