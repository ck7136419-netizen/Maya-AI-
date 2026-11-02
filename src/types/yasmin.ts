export type ScreenId =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'chat'
  | 'voice'
  | 'coding'
  | 'app-control'
  | 'youtube'
  | 'tools'
  | 'history'
  | 'memory'
  | 'planner'
  | 'settings'
  | 'brain'
  | 'permissions'
  | 'admin';

export type PersonalityMode = 'caring' | 'romantic' | 'witty' | 'jarvis';

export type LanguageMode = 'hinglish' | 'hindi' | 'english';

export type AssistantVoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  groundingSources?: Array<{ title: string; url: string }>;
  imageAttachment?: string;
  isSpeaking?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'personal' | 'work' | 'habit' | 'instruction';
  createdAt: number;
}

export interface ReminderTask {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface UserSettings {
  nickname: string;
  personality: PersonalityMode;
  language: LanguageMode;
  geminiApiKey: string;
  geminiModel: string;
  temperature: number;
  ttsVoiceName: string;
  ttsPitch: number;
  ttsRate: number;
  soundEffects: boolean;
  theme: 'cyan' | 'purple' | 'rose' | 'obsidian';
  memoryEnabled: boolean;
  wakeWordEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface BatteryInfo {
  supported: boolean;
  level: number; // 0 to 1
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}
