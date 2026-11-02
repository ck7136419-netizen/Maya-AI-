import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Paperclip,
  Trash2,
  Copy,
  Check,
  Globe,
  Bot,
  User,
  ExternalLink,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, UserSettings } from '../types/yasmin';
import { sounds } from '../utils/soundEffects';
import { speech } from '../utils/speechSynthesis';

interface ChatScreenProps {
  settings: UserSettings;
  messages: ChatMessage[];
  onSendMessage: (text: string, imageBase64?: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  onOpenVoice: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  settings,
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  onOpenVoice,
}) => {
  const [inputText, setInputText] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const text = inputText.trim();
    const image = selectedImage || undefined;
    setInputText('');
    setSelectedImage(null);
    sounds.playClickSound();

    await onSendMessage(text, image);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingMessageId === id) {
      speech.stop();
      setSpeakingMessageId(null);
    } else {
      speech.stop();
      setSpeakingMessageId(id);
      speech.speak(text, {
        voiceName: settings.ttsVoiceName,
        pitch: settings.ttsPitch,
        rate: settings.ttsRate,
        onEnd: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const suggestedQuestions = [
    'Tell me something romantic in Hinglish',
    'Open WhatsApp and message Mom',
    'Explain quantum computing in simple words',
    'What are the top tech trends today?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] w-full max-w-4xl mx-auto px-2 sm:px-4 pb-2 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between py-2 px-3 mb-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-cyan-300 font-semibold">
            NEURAL CHAT // {settings.personality.toUpperCase()} MODE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition cursor-pointer ${
              useSearch
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Search</span>
            <span className={`w-1.5 h-1.5 rounded-full ${useSearch ? 'bg-cyan-400' : 'bg-neutral-600'}`} />
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={onClearChat}
            disabled={messages.length === 0}
            title="Clear Chat History"
            className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 disabled:opacity-40 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 select-text">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">How can I assist you, {settings.nickname}?</h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                Ask questions, plan tasks, write code, or just talk. YASMIN understands English, Hindi, and Hinglish.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sounds.playClickSound();
                    onSendMessage(q);
                  }}
                  className="p-2.5 text-xs text-left rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 text-neutral-300 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{q}</span>
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            const isSpeakingThis = speakingMessageId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[78%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-neutral-800 border border-neutral-700 text-neutral-200'
                      : 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : 'Y'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-neutral-800 text-neutral-100 rounded-tr-none border border-neutral-700/80'
                      : 'bg-neutral-900/90 text-neutral-200 rounded-tl-none border border-cyan-500/20 shadow-lg'
                  }`}
                >
                  {/* Attached Image if any */}
                  {m.imageAttachment && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-xs border border-neutral-700">
                      <img src={m.imageAttachment} alt="User attachment" className="w-full h-auto object-cover max-h-48" />
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Grounding Search Sources if available */}
                  {m.groundingSources && m.groundingSources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-800 space-y-1">
                      <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Sources Consulted:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groundingSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 transition"
                          >
                            <span className="truncate max-w-[120px]">{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer controls for message */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1">
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.id, m.text)}
                          title={isSpeakingThis ? 'Stop Speaking' : 'Listen with YASMIN voice'}
                          className={`p-1 rounded hover:bg-neutral-800 transition cursor-pointer ${
                            isSpeakingThis ? 'text-pink-400' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.text)}
                          title="Copy text"
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                        >
                          {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              Y
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-neutral-900 border border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>YASMIN is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Thumbnail preview */}
      {selectedImage && (
        <div className="my-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between max-w-xs">
          <div className="flex items-center gap-2">
            <img src={selectedImage} alt="Attachment thumbnail" className="w-8 h-8 rounded object-cover" />
            <span className="text-[11px] font-mono text-neutral-300 truncate max-w-[140px]">Image attached</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="text-neutral-400 hover:text-rose-400 text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-neutral-800/80">
        <div className="flex items-center gap-2">
          {/* Image Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image or Photo for Vision Analysis"
            className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-cyan-400 transition cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Cockpit quick switch */}
          <button
            type="button"
            onClick={onOpenVoice}
            title="Open Voice Cockpit"
            className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-pink-400 transition cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message YASMIN in English, Hindi, or Hinglish...`}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-cyan-400 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            aria-label="Send message"
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-white disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
