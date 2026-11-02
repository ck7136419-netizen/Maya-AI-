import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScreenId,
  UserSettings,
  ChatMessage,
  ConversationSession,
  MemoryItem,
  ReminderTask,
  AssistantVoiceState,
} from './types/yasmin';
import { AudioEngine, AudioLogEntry } from './audio/AudioEngine';
import { TopHUD } from './components/TopHUD';
import { BottomNavigation } from './components/BottomNavigation';
import { ScreenFlashlight } from './components/ScreenFlashlight';
import { SpeakerDiagnosticModal } from './components/SpeakerDiagnosticModal';
import { AssistiveTouchWidget } from './components/AssistiveTouchWidget';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ChatScreen } from './screens/ChatScreen';
import { VoiceCockpitScreen } from './screens/VoiceCockpitScreen';
import { CodingStudioScreen } from './screens/CodingStudioScreen';
import { AppControlScreen } from './screens/AppControlScreen';
import { YouTubeMusicScreen } from './screens/YouTubeMusicScreen';
import { AIToolsScreen } from './screens/AIToolsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { PlannerScreen } from './screens/PlannerScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BrainSettingsScreen } from './screens/BrainSettingsScreen';
import { PermissionsScreen } from './screens/PermissionsScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';

import { useAuth } from './firebase/AuthContext';
import {
  loadCloudMemories,
  addCloudMemory,
  deleteCloudMemory,
  loadCloudTasks,
  saveCloudTask,
  loadUserPreferencesFromCloud,
  saveUserPreferencesToCloud,
  saveCloudMessage,
} from './firebase/db';

import {
  ActionResult,
  DEFAULT_CONTACTS,
  executeCallContact,
  executeMakeCall,
  executeOpenApp,
  executeOpenUrl,
  executeOpenWhatsApp,
  executePlayYouTubeMusic,
  executeSendSMS,
  openAccessibilitySettings,
  executeAccessibilityScroll,
  executeAccessibilityType,
  executeAccessibilityGlobalAction,
  ScrollDirection,
  GlobalActionType,
} from './utils/deviceBridge';
import { sounds } from './utils/soundEffects';
import { speech } from './utils/speechSynthesis';

export default function App() {
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [hasBooted, setHasBooted] = useState(false);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('yasmin_settings') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      nickname: 'Boss',
      personality: 'caring',
      language: 'hinglish',
      geminiApiKey: '',
      geminiModel: 'gemini-3.8-flash',
      temperature: 0.7,
      ttsVoiceName: '',
      ttsPitch: 1.1,
      ttsRate: 1.0,
      soundEffects: true,
      theme: 'cyan',
      memoryEnabled: true,
      wakeWordEnabled: true,
      hasCompletedOnboarding: true,
    };
  });

  // Sound effects toggle sync
  useEffect(() => {
    sounds.enabled = settings.soundEffects;
    if (typeof window !== 'undefined') {
      localStorage.setItem('yasmin_settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Voice & Audio States
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>('IDLE');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);

  // Modals & Overlays
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
  const [isTorchOverlayOpen, setIsTorchOverlayOpen] = useState(false);
  const [floatingWidgetEnabled, setFloatingWidgetEnabled] = useState(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('yasmin_floating_assistive') !== 'false'
      : true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yasmin_floating_assistive', floatingWidgetEnabled ? 'true' : 'false');
    }
  }, [floatingWidgetEnabled]);

  // Chat & History
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('yasmin_chat') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: `Greetings ${settings.nickname}! I am YASMIN, your personal AI companion. All JARVIS subroutines and voice channels are calibrated and ready. How may I assist you today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('yasmin_sessions') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  const [isChatLoading, setIsChatLoading] = useState(false);

  // Memories
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('yasmin_memories') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      { id: '1', content: `User preferred nickname is ${settings.nickname}`, category: 'preference', createdAt: Date.now() },
      { id: '2', content: 'Prefers natural conversational Hinglish & English', category: 'preference', createdAt: Date.now() },
      { id: '3', content: 'Loves romantic Bollywood music and Arijit Singh songs', category: 'personal', createdAt: Date.now() },
      { id: '4', content: 'Building innovative mobile Android applications', category: 'work', createdAt: Date.now() },
    ];
  });

  // Daily Tasks & Reminders
  const [tasks, setTasks] = useState<ReminderTask[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('yasmin_tasks') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      { id: 't1', title: 'Review Android APK Release & Permissions', time: '10:00 AM', date: 'Today', completed: false, priority: 'high' },
      { id: 't2', title: 'Drink water and take a quick posture break', time: '02:30 PM', date: 'Today', completed: true, priority: 'low' },
      { id: 't3', title: 'Listen to Arijit Singh playlist on YouTube Music', time: '07:00 PM', date: 'Today', completed: false, priority: 'medium' },
    ];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('yasmin_chat', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('yasmin_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('yasmin_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('yasmin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Audio Engine & WebSocket references
  const { currentUser, isOwner, cloudUser } = useAuth();
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Load cloud data on authentication
  useEffect(() => {
    if (!currentUser) return;

    loadCloudMemories(currentUser.uid)
      .then((cloudMems) => {
        if (cloudMems && cloudMems.length > 0) {
          setMemories(cloudMems);
        }
      })
      .catch((err) => console.warn('[Cloud] Memory sync failed:', err));

    loadUserPreferencesFromCloud(currentUser.uid)
      .then((prefs) => {
        if (prefs) {
          setSettings((prev) => ({ ...prev, ...prefs }));
        }
      })
      .catch((err) => console.warn('[Cloud] Preferences sync failed:', err));

    loadCloudTasks(currentUser.uid)
      .then((cloudTasks) => {
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
        }
      })
      .catch((err) => console.warn('[Cloud] Tasks sync failed:', err));
  }, [currentUser]);
  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const voiceStateRef = useRef<AssistantVoiceState>(voiceState);
  voiceStateRef.current = voiceState;

  // Initialize AudioEngine
  useEffect(() => {
    const engine = new AudioEngine();
    audioEngineRef.current = engine;

    engine.onSpeakingChange = (isSpeaking) => {
      if (isSpeaking) {
        setVoiceState('SPEAKING');
      } else if (voiceStateRef.current === 'SPEAKING') {
        setVoiceState('LISTENING');
      }
    };

    const updateVol = () => {
      if (audioEngineRef.current) {
        setMicVolume(audioEngineRef.current.getMicVolume());
        setOutputVolume(audioEngineRef.current.getOutputVolume());
      }
      animFrameRef.current = requestAnimationFrame(updateVol);
    };
    updateVol();

    return () => {
      engine.cleanup();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Tool Calls handler for Live session
  const handleToolCalls = useCallback(
    async (functionCalls: Array<{ id?: string; name: string; args: Record<string, unknown> }>) => {
      const responses = [];

      for (const call of functionCalls) {
        const { id, name, args } = call;
        let result: ActionResult;

        try {
          if (name === 'openWhatsApp') {
            result = await executeOpenWhatsApp({
              phoneNumber: typeof args.phoneNumber === 'string' ? args.phoneNumber : undefined,
              message: typeof args.message === 'string' ? args.message : undefined,
            });
          } else if (name === 'openApp') {
            result = await executeOpenApp(String(args.appName || ''));
          } else if (name === 'openUrl') {
            result = await executeOpenUrl(String(args.url || ''));
          } else if (name === 'makeCall') {
            result = await executeMakeCall(String(args.phoneNumber || ''));
          } else if (name === 'callContact') {
            result = await executeCallContact(String(args.contactName || ''), DEFAULT_CONTACTS);
          } else if (name === 'playYouTubeMusic') {
            result = await executePlayYouTubeMusic(String(args.query || ''));
          } else if (name === 'openAccessibilitySettings') {
            result = await openAccessibilitySettings();
          } else if (name === 'scrollScreen') {
            const dir = (args.direction as ScrollDirection) || 'down';
            const dist = typeof args.distance === 'number' ? args.distance : 450;
            result = await executeAccessibilityScroll(dir, dist);
          } else if (name === 'typeText') {
            result = await executeAccessibilityType(String(args.text || ''));
          } else if (name === 'globalAction') {
            result = await executeAccessibilityGlobalAction(args.action as GlobalActionType);
          } else {
            result = {
              success: false,
              action: name,
              message: `Unknown action "${name}"`,
            };
          }
        } catch (err) {
          result = {
            success: false,
            action: name,
            message: `Execution failed: ${err instanceof Error ? err.message : String(err)}`,
          };
        }

        setLastAction(result);
        if (result.success) sounds.playSuccessChime();

        responses.push({
          id: id || '',
          name,
          response: {
            output: {
              success: result.success,
              action: result.action,
              message: result.message,
              error: result.error || null,
              details: result.details || {},
            },
          },
        });
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'tool_response',
            functionResponses: responses,
          })
        );
      }
    },
    []
  );

  // Stop live session
  const stopLiveSession = useCallback(() => {
    setVoiceState('IDLE');
    setIsLiveConnected(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioEngineRef.current) {
      audioEngineRef.current.stopMicrophoneCapture();
      audioEngineRef.current.interruptPlayback();
    }
  }, []);

  // Start continuous Gemini Live voice session
  const startLiveSession = useCallback(async () => {
    setVoiceState('THINKING');
    sounds.playVoiceActivated();

    const engine = audioEngineRef.current;
    if (!engine) return;

    try {
      await engine.ensureOutputContext();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const keyParam = settings.geminiApiKey ? `&key=${encodeURIComponent(settings.geminiApiKey)}` : '';
      const nickParam = `&nickname=${encodeURIComponent(settings.nickname)}`;
      const persParam = `&personality=${encodeURIComponent(settings.personality)}`;
      const wsUrl = `${protocol}//${window.location.host}/live-session?${nickParam}${persParam}${keyParam}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          await engine.startMicrophoneCapture((pcmBase64) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'audio', data: pcmBase64 }));
            }
          });
          setIsLiveConnected(true);
          setVoiceState('LISTENING');
        } catch {
          setVoiceState('ERROR');
          stopLiveSession();
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.data) {
            await engine.enqueueAudioChunk(msg.data, msg.mimeType);
          } else if (msg.type === 'interrupted') {
            engine.interruptPlayback();
            setVoiceState('LISTENING');
          } else if (msg.type === 'tool_call' && msg.functionCalls) {
            await handleToolCalls(msg.functionCalls);
          } else if (msg.type === 'transcription' && msg.text) {
            setTranscription((prev) => `${prev} ${msg.text}`.trim().slice(-250));
          } else if (msg.type === 'error') {
            setVoiceState('ERROR');
          } else if (msg.type === 'session_closed') {
            stopLiveSession();
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onerror = () => {
        setVoiceState('ERROR');
        stopLiveSession();
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
        if (voiceStateRef.current !== 'ERROR') {
          setVoiceState('IDLE');
        }
      };
    } catch {
      setVoiceState('ERROR');
      stopLiveSession();
    }
  }, [settings, handleToolCalls, stopLiveSession]);

  const toggleVoiceSession = () => {
    if (isLiveConnected || voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  const handleInterruptVoice = () => {
    audioEngineRef.current?.interruptPlayback();
    speech.stop();
    setVoiceState('LISTENING');
  };

  // Send message in Chat Screen
  const handleSendChatMessage = async (text: string, imageBase64?: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
      imageAttachment: imageBase64,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      if (imageBase64) {
        // Image vision analysis
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: imageBase64,
            prompt: text || 'Analyze this image and explain what you see.',
            customApiKey: settings.geminiApiKey || undefined,
          }),
        });
        const data = await res.json();
        const replyText = data.result || data.error || 'Image processed.';
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: replyText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        sounds.playSuccessChime();
      } else {
        // Check direct accessibility triggers
        const lower = text.toLowerCase().trim();
        if (
          lower.includes('accessibility') &&
          (lower.includes('setting') || lower.includes('permission') || lower.includes('kholo') || lower.includes('open') || lower.includes('de do'))
        ) {
          const res = await openAccessibilitySettings();
          setLastAction(res);
        } else if (lower === 'scroll down' || lower.includes('niche scroll') || lower.includes('scroll niche')) {
          const res = await executeAccessibilityScroll('down', 500);
          setLastAction(res);
        } else if (lower === 'scroll up' || lower.includes('upar scroll') || lower.includes('scroll upar')) {
          const res = await executeAccessibilityScroll('up', 500);
          setLastAction(res);
        } else if (/^(type karo|likho|type)\s+/i.test(text)) {
          const toType = text.replace(/^(type karo|likho|type)\s+/i, '').trim();
          if (toType) {
            const res = await executeAccessibilityType(toType);
            setLastAction(res);
          }
        }

        const historyForApi = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const memoryStrings = settings.memoryEnabled ? memories.map((m) => m.content) : [];

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historyForApi,
            personality: settings.personality,
            nickname: settings.nickname,
            language: settings.language,
            model: settings.geminiModel,
            temperature: settings.temperature,
            memories: memoryStrings,
            customApiKey: settings.geminiApiKey || undefined,
          }),
        });

        const data = await res.json();
        const replyText = data.reply || data.error || 'YASMIN: Message received.';
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: replyText,
          timestamp: Date.now(),
          groundingSources: data.groundingSources,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        sounds.playSuccessChime();

        // Cloud message sync and auto memory extraction
        if (currentUser) {
          saveCloudMessage(currentUser.uid, 'active_session', 'user', text).catch(() => {});
          saveCloudMessage(currentUser.uid, 'active_session', 'assistant', replyText).catch(() => {});

          fetch('/api/cloud/extract-memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'user', text },
                { role: 'assistant', text: replyText },
              ],
              customApiKey: settings.geminiApiKey || undefined,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.extractedMemories && Array.isArray(d.extractedMemories)) {
                d.extractedMemories.forEach((em: { content: string; category: string }) => {
                  handleAddMemory(em.content, em.category as MemoryItem['category']);
                });
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error connecting to YASMIN AI Brain: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Quick Prompt from Home Screen
  const handleQuickPrompt = (prompt: string) => {
    setCurrentScreen('chat');
    handleSendChatMessage(prompt);
  };

  // Send text directly to Voice session
  const handleSendVoiceText = (text: string) => {
    if (!isLiveConnected) {
      startLiveSession();
    }
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'text', text }));
      }
    }, 700);
  };

  // Memory Handlers
  const handleAddMemory = async (content: string, category: MemoryItem['category']) => {
    const item: MemoryItem = {
      id: Date.now().toString(),
      content,
      category,
      createdAt: Date.now(),
    };
    setMemories((prev) => [item, ...prev]);

    if (currentUser) {
      try {
        await addCloudMemory(currentUser.uid, content, category);
      } catch (err) {
        console.warn('[Cloud] Failed to persist memory:', err);
      }
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    if (currentUser) {
      try {
        await deleteCloudMemory(id);
      } catch (err) {
        console.warn('[Cloud] Failed to delete memory:', err);
      }
    }
  };

  // Tasks Handlers
  const handleAddTask = async (taskData: Omit<ReminderTask, 'id' | 'completed'>) => {
    const task: ReminderTask = {
      id: Date.now().toString(),
      ...taskData,
      completed: false,
    };
    setTasks((prev) => [task, ...prev]);

    if (currentUser) {
      try {
        await saveCloudTask(currentUser.uid, task);
      } catch (err) {
        console.warn('[Cloud] Failed to persist task:', err);
      }
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Clear Chat & archive to history session
  const handleClearChat = () => {
    if (messages.length > 1) {
      const newSession: ConversationSession = {
        id: Date.now().toString(),
        title: messages[1]?.text?.slice(0, 45) || 'Archived Conversation',
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
        messages: [...messages],
      };
      setSessions((prev) => [newSession, ...prev]);
    }
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: `Chat thread cleared, ${settings.nickname}. How can I assist you now?`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Navigation Helper with click sound
  const navigateTo = (screen: ScreenId) => {
    sounds.playClickSound();
    setCurrentScreen(screen);
  };

  // Listen for global accessibility navigation events
  useEffect(() => {
    const handleNav = (e: Event) => {
      const custom = e as CustomEvent<ScreenId>;
      if (custom.detail) {
        navigateTo(custom.detail);
      }
    };
    window.addEventListener('yasmin:navigate-screen', handleNav);
    return () => window.removeEventListener('yasmin:navigate-screen', handleNav);
  }, []);

  // Splash Screen on initial launch
  if (!hasBooted) {
    return <SplashScreen onComplete={() => setHasBooted(true)} />;
  }

  // Onboarding on first configuration
  if (!settings.hasCompletedOnboarding) {
    return (
      <OnboardingScreen
        settings={settings}
        onSaveSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
        onFinish={() => navigateTo('home')}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans">
      {/* Top Futuristic HUD */}
      <TopHUD
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        isVoiceActive={isLiveConnected}
        onToggleVoice={toggleVoiceSession}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-y-auto pb-24">
        {currentScreen === 'home' && (
          <HomeScreen
            settings={settings}
            voiceState={voiceState}
            micVolume={micVolume}
            outputVolume={outputVolume}
            onToggleVoice={toggleVoiceSession}
            onNavigate={navigateTo}
            onQuickPrompt={handleQuickPrompt}
            lastAction={lastAction}
            onClearLastAction={() => setLastAction(null)}
            memoriesCount={memories.length}
            tasksCount={tasks.length}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            settings={settings}
            messages={messages}
            onSendMessage={handleSendChatMessage}
            onClearChat={handleClearChat}
            isLoading={isChatLoading}
            onOpenVoice={() => navigateTo('voice')}
          />
        )}

        {currentScreen === 'voice' && (
          <VoiceCockpitScreen
            settings={settings}
            voiceState={voiceState}
            micVolume={micVolume}
            outputVolume={outputVolume}
            onToggleVoice={toggleVoiceSession}
            onInterrupt={handleInterruptVoice}
            lastAction={lastAction}
            onClearLastAction={() => setLastAction(null)}
            transcription={transcription}
            onOpenSpeakerTest={() => setIsSpeakerModalOpen(true)}
            onSendVoiceText={handleSendVoiceText}
            isLiveConnected={isLiveConnected}
          />
        )}

        {currentScreen === 'coding' && (
          <CodingStudioScreen customApiKey={settings.geminiApiKey || undefined} />
        )}

        {currentScreen === 'app-control' && (
          <AppControlScreen
            onTriggerTorch={() => setIsTorchOverlayOpen(true)}
            onShowActionCard={(res) => setLastAction(res)}
            floatingWidgetEnabled={floatingWidgetEnabled}
            onToggleFloatingWidget={setFloatingWidgetEnabled}
          />
        )}

        {currentScreen === 'youtube' && <YouTubeMusicScreen />}

        {currentScreen === 'tools' && (
          <AIToolsScreen settings={settings} customApiKey={settings.geminiApiKey || undefined} />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            sessions={sessions}
            onSelectSession={(sess) => {
              setMessages(sess.messages);
              navigateTo('chat');
            }}
            onDeleteSession={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
            onClearAll={() => setSessions([])}
          />
        )}

        {currentScreen === 'memory' && (
          <MemoryScreen
            settings={settings}
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onClearMemories={() => setMemories([])}
            onToggleMemory={() =>
              setSettings((prev) => ({ ...prev, memoryEnabled: !prev.memoryEnabled }))
            }
          />
        )}

        {currentScreen === 'planner' && (
          <PlannerScreen
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            nickname={settings.nickname}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
            onNavigate={navigateTo}
          />
        )}

        {currentScreen === 'brain' && (
          <BrainSettingsScreen
            settings={settings}
            onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
          />
        )}

        {currentScreen === 'permissions' && <PermissionsScreen />}

        {currentScreen === 'admin' && <AdminDashboardScreen />}
      </main>

      {/* Bottom Futuristic Navigation Bar */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        isVoiceLive={isLiveConnected}
      />

      {/* Fullscreen Flashlight Torch Overlay */}
      <ScreenFlashlight
        isOpen={isTorchOverlayOpen}
        onClose={() => setIsTorchOverlayOpen(false)}
      />

      {/* Floating Assistive Touch Overlay Widget */}
      {floatingWidgetEnabled && hasBooted && (
        <AssistiveTouchWidget
          onShowActionCard={(res) => setLastAction(res)}
          onOpenVoice={() => navigateTo('voice')}
        />
      )}

      {/* 440Hz Speaker Output Diagnostic Modal */}
      {audioEngineRef.current && (
        <SpeakerDiagnosticModal
          isOpen={isSpeakerModalOpen}
          onClose={() => setIsSpeakerModalOpen(false)}
          audioEngine={audioEngineRef.current}
        />
      )}
    </div>
  );
}
