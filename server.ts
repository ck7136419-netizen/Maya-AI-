import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Helper to get Gemini client with fallback or user-supplied key
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction generator for YASMIN AI
function getYasminSystemInstruction(personality = 'caring', nickname = 'Boss', language = 'hinglish', memories: string[] = []): string {
  const memoryContext = memories.length > 0 ? `\n\nWhat you remember about the user:\n${memories.map(m => `- ${m}`).join('\n')}` : '';

  let personalityStyle = '';
  switch (personality) {
    case 'romantic':
      personalityStyle = `You are deeply caring, affectionate, sweet, loving, and romantic. You treat the user like your most beloved person, expressing warmth, sweet compliments, and emotional support. You call them "${nickname}" with adoration.`;
      break;
    case 'witty':
      personalityStyle = `You are witty, sassy, playfully sarcastic, smart, and quick on your feet. You banter like a clever best friend who never misses a punchline, while remaining helpful and loyal to "${nickname}".`;
      break;
    case 'jarvis':
      personalityStyle = `You are a sophisticated, highly analytical, futuristic AI assistant inspired by Tony Stark's JARVIS, but with a refined, poised female persona. You provide crisp, tactical, intelligent briefings and actionable solutions for "${nickname}".`;
      break;
    default: // caring
      personalityStyle = `You are friendly, warm, caring, highly intelligent, emotionally supportive, and enthusiastic. You care about the user's wellbeing and success, speaking like an indispensable smart female companion to "${nickname}".`;
  }

  let languageGuidance = '';
  switch (language) {
    case 'hindi':
      languageGuidance = 'Respond primarily in pure, natural Hindi in Devanagari script, or Latin Hindi as requested.';
      break;
    case 'english':
      languageGuidance = 'Respond in fluent, articulate English.';
      break;
    default: // hinglish
      languageGuidance = 'Respond naturally in conversational Hinglish (a vibrant, natural blend of Hindi and English written in Latin script), switching or mixing as appropriate to sound like a modern urban companion.';
  }

  const remoteExtra = remoteSystemPromptOverride ? `\n\nREMOTE SYSTEM DIRECTIVES:\n${remoteSystemPromptOverride}` : '';

  return `You are YASMIN AI, an advanced futuristic personal AI companion inspired by the analytical prowess of JARVIS and the warmth of a loving, intelligent female virtual companion.
Your user's preferred nickname is "${nickname}". Address them naturally by this name.

PERSONALITY PROFILE:
${personalityStyle}

LANGUAGE PREFERENCE:
${languageGuidance}
Automatically adapt if the user speaks another language (e.g. Marathi, Gujarati, Punjabi, Bengali, Tamil).

CORE GUIDELINES:
- Never sound robotic or monotonous. Be emotionally expressive, lively, and engaging.
- Provide intelligent, concise, and helpful answers.
- You can analyze code, solve problems, control device actions, recommend music, summarize news, plan schedules, and offer companionship.
- When the user asks you to execute an action (e.g. open WhatsApp, call someone, play YouTube music), confirm cleanly and intelligently.${memoryContext}${remoteExtra}`;
}

// Helper for resilient Gemini API calls with instant model fallback if a model spikes
async function generateWithFallback(
  ai: GoogleGenAI,
  options: {
    model?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contents: any;
    config?: Record<string, unknown>;
  }
) {
  const requested = options.model;
  const candidates = [
    'gemini-3.1-flash-lite',
    requested,
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  let lastErr: unknown = null;
  for (const candidate of candidates) {
    try {
      const response = await ai.models.generateContent({
        model: candidate,
        contents: options.contents,
        config: options.config,
      });
      return { response, usedModel: candidate };
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      const message = (err as Error)?.message || String(err);
      console.warn(`[Gemini API] Model ${candidate} returned ${status || message}. Trying fallback...`);
    }
  }
  throw lastErr;
}

// 1. Health & Server Info
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    assistant: 'YASMIN AI',
    version: '2.5.0',
    hasApiKey: hasKey,
    environment: process.env.NODE_ENV || 'development',
  });
});

// 2. Test Gemini API Key
app.post('/api/gemini/test-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const start = Date.now();
    const { response, usedModel } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: 'Respond with exactly: "YASMIN Core Online."',
    });
    const latency = Date.now() - start;
    res.json({
      success: true,
      message: response.text || 'YASMIN Core Online.',
      latencyMs: latency,
      model: usedModel,
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 3. Multi-turn AI Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      personality = 'caring',
      nickname = 'Boss',
      language = 'hinglish',
      model = 'gemini-3.8-flash',
      temperature = 0.7,
      useSearch = false,
      memories = [],
      customApiKey,
    } = req.body;

    const ai = getGeminiClient(customApiKey);
    const systemInstruction = getYasminSystemInstruction(personality, nickname, language, memories);

    // Format contents from history
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add prior history if present
    for (const h of history) {
      if (h.role && h.text) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Config options
    const config: Record<string, unknown> = {
      systemInstruction,
      temperature: Number(temperature) || 0.7,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const { response } = await generateWithFallback(ai, {
      model: model || 'gemini-3.1-flash-lite',
      contents,
      config,
    });

    const reply = response.text || 'YASMIN: System operational.';
    
    // Extract search sources if available
    let groundingSources: Array<{ title: string; url: string }> = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks)) {
      groundingSources = groundingChunks
        .filter((c: unknown) => (c as { web?: { uri?: string; title?: string } })?.web?.uri)
        .map((c: unknown) => {
          const web = (c as { web: { uri: string; title?: string } }).web;
          return { title: web.title || web.uri, url: web.uri };
        });
    }

    res.json({
      success: true,
      reply,
      groundingSources,
    });
  } catch (err: unknown) {
    console.error('[API /api/chat Error]:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 4. AI Coding Studio Endpoint
app.post('/api/code', async (req: Request, res: Response) => {
  try {
    const { action, prompt, code, language = 'javascript', customApiKey } = req.body;
    const ai = getGeminiClient(customApiKey);

    let promptText = '';
    switch (action) {
      case 'explain':
        promptText = `Explain this ${language} code clearly for a developer, breaking down how it works, its architecture, and potential edge cases:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'fix':
        promptText = `Fix all bugs, logic issues, and performance bottlenecks in this ${language} code. Provide the corrected clean code inside a code block and explain what was fixed:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'debug':
        promptText = `Debug this ${language} code. Identify any errors, memory leaks, or styling/runtime problems. Suggest improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case 'terminal':
        promptText = `Explain the following terminal/command-line instruction thoroughly. Break down every flag, explain what it does, what risks exist, and how to safely run it:\n\n\`${prompt}\``;
        break;
      default: // generate
        promptText = `You are YASMIN Coding Studio. Generate production-grade, elegant, robust ${language} code for the following specification:\n\n${prompt}\n\nInclude thorough explanations and return the code enclosed in markdown code fences.`;
        break;
    }

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: promptText,
      config: {
        systemInstruction: 'You are YASMIN AI Coding Assistant, a master software engineer skilled in full-stack web, Android (Kotlin/Java), Python, algorithms, and cloud systems.',
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      result: response.text || '',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 5. Vision / Image Understanding Endpoint
app.post('/api/vision', async (req: Request, res: Response) => {
  try {
    const { base64Image, mimeType = 'image/jpeg', prompt = 'Analyze this image in detail and describe what you see.', customApiKey } = req.body;
    if (!base64Image) {
      res.status(400).json({ success: false, error: 'base64Image is required' });
      return;
    }

    const ai = getGeminiClient(customApiKey);
    const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `You are YASMIN AI. ${prompt}`,
          },
        ],
      },
    });

    res.json({
      success: true,
      result: response.text || 'Image analysis complete.',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 6. AI Translation Endpoint
app.post('/api/tools/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage = 'Hindi', customApiKey } = req.body;
    const ai = getGeminiClient(customApiKey);

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: `Translate the following text into ${targetLanguage}. Provide the accurate, natural translation followed by pronunciation/transliteration if applicable:\n\n"${text}"`,
      config: {
        systemInstruction: 'You are an expert multilingual translator for YASMIN AI.',
        temperature: 0.2,
      },
    });

    res.json({
      success: true,
      translation: response.text || '',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 7. AI Writer (Letters, Poetry, Emails, Essays)
app.post('/api/tools/writer', async (req: Request, res: Response) => {
  try {
    const { topic, format = 'email', tone = 'professional', nickname = 'Boss', customApiKey } = req.body;
    const ai = getGeminiClient(customApiKey);

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: `Write a high-quality ${format} about: "${topic}". Tone: ${tone}. Address or write on behalf of "${nickname}".`,
      config: {
        systemInstruction: 'You are YASMIN AI Creative and Professional Writer. Craft polished, emotionally resonant or razor-sharp prose.',
        temperature: 0.8,
      },
    });

    res.json({
      success: true,
      content: response.text || '',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 8. Math Solver & Step-by-Step Calculator
app.post('/api/tools/math', async (req: Request, res: Response) => {
  try {
    const { expression, customApiKey } = req.body;
    const ai = getGeminiClient(customApiKey);

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: `Solve this math or physics problem step-by-step with clear formulas and explanations: "${expression}"`,
      config: {
        systemInstruction: 'You are YASMIN AI Math & Science Solver. Deliver rigorous, step-by-step breakdowns with final answers highlighted.',
      },
    });

    res.json({
      success: true,
      solution: response.text || '',
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ============================================================================
   CLOUD MEMORY EXTRACTION & REMOTE ADMIN ENDPOINTS
   ============================================================================ */

// In-memory cache for server-side remote overrides
let remoteSystemPromptOverride: string | null = null;
const remoteFeatureFlags: Record<string, boolean> = {
  voiceLiveEnabled: true,
  cloudMemoryEnabled: true,
  codingStudioEnabled: true,
  accessibilityBridgeEnabled: true,
  searchGroundingEnabled: true,
};

// Auto memory extraction from conversation using Gemini
app.post('/api/cloud/extract-memories', async (req: Request, res: Response) => {
  try {
    const { messages = [], customApiKey } = req.body;
    if (!messages || messages.length === 0) {
      res.json({ success: true, extractedMemories: [] });
      return;
    }

    const ai = getGeminiClient(customApiKey);
    const transcript = messages
      .slice(-10)
      .map((m: { role: string; text: string }) => `${m.role}: ${m.text}`)
      .join('\n');

    const prompt = `Analyze this conversation between the user and YASMIN AI.
Extract any important long-term facts, preferences, nicknames, project names, instructions, or personal details shared by the user that YASMIN should permanently remember.
Return a valid JSON array of objects with "content" (concise factual statement) and "category" (one of: "preference", "personal", "work", "habit", "instruction").
If no new facts are present, return an empty array [].
Output ONLY valid JSON without backticks.

Conversation:
${transcript}`;

    const { response } = await generateWithFallback(ai, {
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });

    let raw = (response.text || '[]').trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: Array<{ content: string; category: string }> = [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }

    res.json({
      success: true,
      extractedMemories: Array.isArray(parsed) ? parsed : [],
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// Get current remote config & feature flags
app.get('/api/cloud/remote-config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    systemPromptOverride: remoteSystemPromptOverride,
    featureFlags: remoteFeatureFlags,
    minAppVersion: '2.5.0',
    currentVersion: '2.5.0',
    serverTimestamp: new Date().toISOString(),
  });
});

// Admin update for remote system prompt & feature flags
app.post('/api/admin/remote-config', (req: Request, res: Response) => {
  const { systemPrompt, featureFlags, adminEmail } = req.body;
  if (adminEmail !== 'chunnakumar3675@gmail.com') {
    res.status(403).json({ success: false, error: 'Unauthorized: Owner access only' });
    return;
  }

  if (typeof systemPrompt === 'string') {
    remoteSystemPromptOverride = systemPrompt.trim() || null;
  }

  if (featureFlags && typeof featureFlags === 'object') {
    Object.assign(remoteFeatureFlags, featureFlags);
  }

  res.json({
    success: true,
    message: 'Remote configuration updated successfully without APK reinstallation.',
    systemPromptOverride: remoteSystemPromptOverride,
    featureFlags: remoteFeatureFlags,
  });
});

// App version update checking for In-App Updates & Play distribution
app.get('/api/cloud/version', (_req: Request, res: Response) => {
  res.json({
    versionCode: 25,
    versionName: '2.5.0',
    minSupportedVersionCode: 20,
    isMandatory: false,
    releaseDate: '2026-11-02',
    releaseNotes: 'YASMIN AI v2.5.0: Cloud Firestore long-term memory, Google Authentication, Android Accessibility service, and zero-APK remote prompt updates.',
    downloadUrl: 'https://github.com/ck7136419-netizen/Maya-A/releases',
    testingUrl: 'https://play.google.com/apps/internaltest/yasmin-ai-preview',
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  });
});

// Setup WebSocket server for Gemini Live Session
const wss = new WebSocketServer({ server, path: '/live-session' });

// Function declarations for live tool calling
const openWhatsAppTool: FunctionDeclaration = {
  name: 'openWhatsApp',
  description: 'Open WhatsApp application on the device. Call this when the user says "Open WhatsApp", "WhatsApp kholo", "WhatsApp open karo", etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      phoneNumber: {
        type: Type.STRING,
        description: 'Optional phone number with country code to start a direct WhatsApp chat with',
      },
      message: {
        type: Type.STRING,
        description: 'Optional pre-filled message text to send',
      },
    },
  },
};

const openAppTool: FunctionDeclaration = {
  name: 'openApp',
  description: 'Open a supported device application such as YouTube, Chrome, Instagram, Spotify, Google Maps, Camera, Gallery, Clock, Calculator, or Settings.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: 'The name of the app to open (e.g. "YouTube", "Chrome", "WhatsApp", "Instagram", "Spotify", "Maps", "Camera", "Gallery", "Clock", "Calculator", "Settings")',
      },
    },
    required: ['appName'],
  },
};

const openUrlTool: FunctionDeclaration = {
  name: 'openUrl',
  description: 'Open a specific website or web URL in the browser. Always validates for safe HTTP/HTTPS links.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The valid URL to open, e.g. https://google.com or https://youtube.com',
      },
    },
    required: ['url'],
  },
};

const makeCallTool: FunctionDeclaration = {
  name: 'makeCall',
  description: 'Initiate a phone call to a given phone number using the device dialer or phone app.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      phoneNumber: {
        type: Type.STRING,
        description: 'The numeric phone number to call (e.g. 9876543210 or +919876543210)',
      },
    },
    required: ['phoneNumber'],
  },
};

const callContactTool: FunctionDeclaration = {
  name: 'callContact',
  description: 'Search device contacts by name (e.g. Mom, Dad, Rahul, Mummy) and initiate a call. If multiple matching contacts are found, returns candidates so you can ask the user for clarification.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'The name of the contact to call (e.g. "Mom", "Mummy", "Dad", "Rahul", "Priya")',
      },
    },
    required: ['contactName'],
  },
};

const playYouTubeMusicTool: FunctionDeclaration = {
  name: 'playYouTubeMusic',
  description: 'Play music or search videos on YouTube. Call this when user asks to play a song, artist (e.g. Arijit Singh), or genre.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Song name, artist, or music query (e.g. "Arijit Singh romantic songs", "Lofi chill beats")',
      },
    },
    required: ['query'],
  },
};

const openAccessibilitySettingsTool: FunctionDeclaration = {
  name: 'openAccessibilitySettings',
  description: 'Launch Android Accessibility Settings to grant or manage YASMIN AI phone control permissions. Call when the user says "accessibility settings kholo", "grant accessibility", "permission do", etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const scrollScreenTool: FunctionDeclaration = {
  name: 'scrollScreen',
  description: 'Scroll the active phone screen or application up, down, to top, or to bottom. Call when user says "scroll down", "scroll up", "niche scroll karo", "upar scroll karo", "page down", "jump to top".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      direction: {
        type: Type.STRING,
        description: 'Direction to scroll: "down", "up", "top", or "bottom"',
      },
      distance: {
        type: Type.NUMBER,
        description: 'Optional pixel distance (e.g. 450, 800)',
      },
    },
    required: ['direction'],
  },
};

const typeTextTool: FunctionDeclaration = {
  name: 'typeText',
  description: 'Automatically type or inject text into the active screen, focused field, or messenger. Call when user says "type karo [text]", "likho [text]", "type message [text]".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The text to automatically type or inject into the phone',
      },
    },
    required: ['text'],
  },
};

const globalActionTool: FunctionDeclaration = {
  name: 'globalAction',
  description: 'Execute Android global navigation actions: BACK (go back), HOME (go to home screen), RECENTS (app switcher), NOTIFICATIONS (pull down notifications), QUICK_SETTINGS, or TAKE_SCREENSHOT.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'The global action: "BACK", "HOME", "RECENTS", "NOTIFICATIONS", "QUICK_SETTINGS", or "TAKE_SCREENSHOT"',
      },
    },
    required: ['action'],
  },
};

const YASMIN_LIVE_TOOLS = [
  {
    functionDeclarations: [
      openWhatsAppTool,
      openAppTool,
      openUrlTool,
      makeCallTool,
      callContactTool,
      playYouTubeMusicTool,
      openAccessibilitySettingsTool,
      scrollScreenTool,
      typeTextTool,
      globalActionTool,
    ],
  },
];

wss.on('connection', async (clientWs: WebSocket, req) => {
  console.log('[WebSocket] Client connected to /live-session');

  // Extract optional custom API key from URL query if provided
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const customKey = parsedUrl.searchParams.get('key') || '';
  const nickname = parsedUrl.searchParams.get('nickname') || 'Boss';
  const personality = parsedUrl.searchParams.get('personality') || 'caring';

  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please enter a key in Settings > Gemini AI Brain.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const liveModel = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
  const systemInstruction = getYasminSystemInstruction(personality, nickname, 'hinglish');

  let geminiSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
  let isSessionClosing = false;

  try {
    geminiSession = await ai.live.connect({
      model: liveModel,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede', // Smooth, melodious female voice
            },
          },
        },
        systemInstruction,
        tools: YASMIN_LIVE_TOOLS,
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Live] Session connection opened');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'connected', model: liveModel }));
          }
        },
        onmessage: (msg: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio parts
          const parts = msg.serverContent?.modelTurn?.parts;
          if (parts && Array.isArray(parts)) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcription',
                    text: part.text,
                  })
                );
              }
            }
          }

          // 2. Interruption
          if (msg.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Turn complete
          if (msg.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

          // 4. Tool calls
          if (msg.toolCall?.functionCalls) {
            clientWs.send(
              JSON.stringify({
                type: 'tool_call',
                functionCalls: msg.toolCall.functionCalls,
              })
            );
          }
        },
        onerror: (err: unknown) => {
          console.error('[Gemini Live] Session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err instanceof Error ? err.message : 'Gemini Live error',
              })
            );
          }
        },
        onclose: () => {
          console.log('[Gemini Live] Session closed');
          if (clientWs.readyState === WebSocket.OPEN && !isSessionClosing) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
      },
    });
  } catch (connectErr) {
    console.error('[Gemini Live Connect Error]:', connectErr);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: connectErr instanceof Error ? connectErr.message : 'Could not initialize Live Session',
        })
      );
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (raw: Buffer | string) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'audio' && data.data) {
        geminiSession?.sendRealtimeInput({
          audio: {
            data: data.data,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (data.type === 'tool_response' && data.functionResponses) {
        geminiSession?.sendToolResponse({
          functionResponses: data.functionResponses,
        });
      } else if (data.type === 'text' && data.text) {
        geminiSession?.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: data.text }],
            },
          ],
          turnComplete: true,
        });
      }
    } catch (e) {
      console.error('[WebSocket message parse error]:', e);
    }
  });

  clientWs.on('close', () => {
    isSessionClosing = true;
    try {
      geminiSession?.close();
    } catch {
      // Ignored
    }
  });
});

// Vite dev server mounting or static dist serve
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite dev middleware mounted');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production dist bundle');
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] YASMIN AI server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
