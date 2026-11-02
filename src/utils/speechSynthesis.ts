/**
 * Speech Synthesis Controller for YASMIN AI's female voice output.
 */

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  default: boolean;
  isFemale: boolean;
}

class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  public isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): SpeechVoiceOption[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }

    return this.voices.map((v) => {
      const nameLower = v.name.toLowerCase();
      const isFemale =
        nameLower.includes('female') ||
        nameLower.includes('woman') ||
        nameLower.includes('girl') ||
        nameLower.includes('samantha') ||
        nameLower.includes('victoria') ||
        nameLower.includes('karen') ||
        nameLower.includes('zira') ||
        nameLower.includes('moira') ||
        nameLower.includes('fiona') ||
        nameLower.includes('tessa') ||
        nameLower.includes('veena') ||
        nameLower.includes('lekha') ||
        nameLower.includes('swara') ||
        nameLower.includes('hindi') ||
        nameLower.includes('google');

      return {
        name: v.name,
        lang: v.lang,
        default: v.default,
        isFemale,
      };
    });
  }

  public getPreferredFemaleVoice(voiceName?: string, langCode = 'en-IN'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }

    // 1. Explicit matching by name if provided
    if (voiceName) {
      const match = this.voices.find((v) => v.name === voiceName);
      if (match) return match;
    }

    // 2. Hindi / Indian English female voices
    const indianFemale = this.voices.find(
      (v) =>
        (v.lang.startsWith('hi') || v.lang === 'en-IN') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('veena'))
    );
    if (indianFemale) return indianFemale;

    // 3. Any female voice matching language code
    const langFemale = this.voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'))
    );
    if (langFemale) return langFemale;

    // 4. Any female voice
    const anyFemale = this.voices.find(
      (v) =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('zira')
    );
    if (anyFemale) return anyFemale;

    // 5. Default voice fallback
    return this.voices.find((v) => v.default) || this.voices[0] || null;
  }

  public speak(
    text: string,
    options?: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ): void {
    if (!this.synth) {
      options?.onEnd?.();
      return;
    }

    this.stop();

    // Clean text: strip markdown code blocks and symbols that sound strange when read aloud
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~>]/g, '')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = this.getPreferredFemaleVoice(options?.voiceName, options?.lang || 'en-IN');
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.1; // Slightly higher pitch for natural female tone

    utterance.onstart = () => {
      this.isSpeaking = true;
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onError?.(e);
      options?.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }
}

export const speech = new SpeechController();
