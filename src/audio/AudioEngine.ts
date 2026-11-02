/**
 * Web Audio Engine for Arushi Voice Assistant.
 * Handles microphone capture (16kHz 16-bit PCM) and native Gemini Live playback (24kHz PCM).
 */

import {
  float32ToInt16PCM,
  int16PCMToFloat32,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  resampleAudio,
} from '../utils/audioEncoding';

export interface AudioLogEntry {
  id: string;
  timestamp: number;
  stage: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export type LogListener = (entry: AudioLogEntry) => void;

export class AudioEngine {
  private outputCtx: AudioContext | null = null;
  private inputCtx: AudioContext | null = null;
  private outputGain: GainNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  private nextStartTime = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isPlayingAudio = false;

  private logListeners: Set<LogListener> = new Set();

  public onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor() {
    this.log('init', 'info', 'AudioEngine instance constructed');
  }

  public addLogListener(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private log(
    stage: string,
    level: 'info' | 'success' | 'warn' | 'error',
    message: string,
    details?: Record<string, unknown>
  ) {
    const entry: AudioLogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      stage,
      level,
      message,
      details,
    };

    const prefix = `[AudioEngine:${stage}]`;
    if (level === 'error') {
      console.error(prefix, message, details || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }

    this.logListeners.forEach((l) => {
      try {
        l(entry);
      } catch (err) {
        console.error('Log listener error:', err);
      }
    });
  }

  /**
   * Initializes or returns the persistent output AudioContext (24kHz).
   * MUST be called during or after a user gesture.
   */
  public async ensureOutputContext(): Promise<AudioContext> {
    if (!this.outputCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      // Output sample rate 24000 for Gemini Live native output
      this.outputCtx = new AudioCtxClass({ sampleRate: 24000 });
      this.log('output_ctx_create', 'info', 'Created output AudioContext', {
        sampleRate: this.outputCtx.sampleRate,
        state: this.outputCtx.state,
      });

      this.outputGain = this.outputCtx.createGain();
      this.outputGain.gain.setValueAtTime(1.0, this.outputCtx.currentTime);

      this.outputAnalyser = this.outputCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;

      this.outputGain.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputCtx.destination);
    }

    if (this.outputCtx.state === 'suspended') {
      this.log('output_ctx_resume', 'info', 'Resuming suspended output AudioContext...');
      await this.outputCtx.resume();
      this.log('output_ctx_resume', 'success', `AudioContext resumed. State: ${this.outputCtx.state}`);
    }

    return this.outputCtx;
  }

  /**
   * Plays a 440Hz test tone through the exact same output graph to verify speaker output.
   */
  public async playSpeakerTestTone(): Promise<void> {
    const ctx = await this.ensureOutputContext();
    this.log('speaker_test', 'info', 'Starting 440Hz diagnostic tone test...', {
      ctxState: ctx.state,
      currentTime: ctx.currentTime,
    });

    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);

    // Fade in and out to prevent click
    const now = ctx.currentTime;
    toneGain.gain.setValueAtTime(0.001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
    toneGain.gain.setValueAtTime(0.4, now + 0.7);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(toneGain);
    if (this.outputGain) {
      toneGain.connect(this.outputGain);
    } else {
      toneGain.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 0.95);

    osc.onended = () => {
      osc.disconnect();
      toneGain.disconnect();
      this.log('speaker_test', 'success', 'Speaker diagnostic tone finished playing successfully');
    };
  }

  /**
   * Decodes a Base64 PCM chunk from Gemini Live and schedules it for sequential gapless playback.
   */
  public async enqueueAudioChunk(base64Data: string, mimeType = 'audio/pcm;rate=24000'): Promise<void> {
    try {
      const ctx = await this.ensureOutputContext();

      if (ctx.state !== 'running') {
        this.log('audio_chunk', 'warn', `AudioContext was in state ${ctx.state}, resuming...`);
        await ctx.resume();
      }

      this.log('pcm_decode', 'info', 'Decoding Gemini audio chunk...', {
        base64Length: base64Data.length,
        mimeType,
      });

      const rawBuffer = base64ToArrayBuffer(base64Data);
      const float32Samples = int16PCMToFloat32(rawBuffer);

      if (float32Samples.length === 0) {
        this.log('pcm_decode', 'warn', 'Decoded empty float32 array, skipping');
        return;
      }

      // Live model output is 24000 Hz mono
      const sampleRate = 24000;
      const audioBuffer = ctx.createBuffer(1, float32Samples.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Samples);

      const duration = audioBuffer.duration;

      // Schedule gapless playback
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime + 0.005, this.nextStartTime);
      this.nextStartTime = startTime + duration;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputGain) {
        source.connect(this.outputGain);
      } else {
        source.connect(ctx.destination);
      }

      this.activeSources.add(source);

      if (!this.isPlayingAudio) {
        this.isPlayingAudio = true;
        this.onSpeakingChange?.(true);
      }

      source.onended = () => {
        this.activeSources.delete(source);
        source.disconnect();

        if (this.activeSources.size === 0) {
          // Check if no new chunks were scheduled
          if (ctx.currentTime >= this.nextStartTime - 0.05) {
            this.isPlayingAudio = false;
            this.nextStartTime = 0;
            this.onSpeakingChange?.(false);
            this.log('playback_end', 'info', 'All queued audio chunks finished playing');
          }
        }
      };

      source.start(startTime);
      this.log('playback_start', 'success', 'Scheduled audio chunk', {
        samples: float32Samples.length,
        durationSeconds: duration.toFixed(3),
        scheduledAt: startTime.toFixed(3),
        currentCtxTime: currentTime.toFixed(3),
        activeSourcesCount: this.activeSources.size,
      });
    } catch (err) {
      this.log('audio_chunk_error', 'error', 'Failed to decode or play audio chunk', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Immediately stops all currently playing and queued audio chunks (for interruptions).
   */
  public interruptPlayback(): void {
    this.log('interruption', 'warn', 'Interrupting playback: stopping all active sources and clearing queue', {
      sourcesCount: this.activeSources.size,
    });

    this.activeSources.forEach((src) => {
      try {
        src.stop(0);
        src.disconnect();
      } catch {
        // Ignored if already stopped
      }
    });

    this.activeSources.clear();
    this.nextStartTime = 0;
    this.isPlayingAudio = false;
    this.onSpeakingChange?.(false);
  }

  /**
   * Starts microphone recording at 16kHz and sends Base64 PCM chunks to callback.
   */
  public async startMicrophoneCapture(onChunk: (base64Pcm: string) => void): Promise<void> {
    this.log('mic_req', 'info', 'Requesting microphone permission from navigator.mediaDevices...');

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.log('mic_granted', 'success', 'Microphone permission granted by user');

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.inputCtx = new AudioCtxClass();

      if (this.inputCtx.state === 'suspended') {
        await this.inputCtx.resume();
      }

      const inputSampleRate = this.inputCtx.sampleRate;
      this.log('mic_start', 'info', 'Input AudioContext initialized', {
        sampleRate: inputSampleRate,
        state: this.inputCtx.state,
      });

      this.micSource = this.inputCtx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.inputCtx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micSource.connect(this.micAnalyser);

      // ScriptProcessor with bufferSize 4096 (approx 85-90ms of audio at 48kHz / 256ms at 16kHz)
      this.micProcessor = this.inputCtx.createScriptProcessor(4096, 1, 1);
      this.micAnalyser.connect(this.micProcessor);
      this.micProcessor.connect(this.inputCtx.destination);

      let chunkCount = 0;

      this.micProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Resample to 16000 Hz if input context is different (e.g. 44100 or 48000 Hz)
        const resampled = inputSampleRate !== 16000 ? resampleAudio(inputData, inputSampleRate, 16000) : inputData;

        // Convert to 16-bit linear PCM
        const pcmBuffer = float32ToInt16PCM(resampled);
        const base64 = arrayBufferToBase64(pcmBuffer);

        chunkCount++;
        if (chunkCount % 20 === 1) {
          this.log('mic_chunk', 'info', `Captured mic chunk #${chunkCount}`, {
            inputSamples: inputData.length,
            pcmBytes: pcmBuffer.byteLength,
            base64Length: base64.length,
          });
        }

        onChunk(base64);
      };

      this.log('mic_active', 'success', 'Microphone capture loop is actively streaming PCM audio');
    } catch (err) {
      this.log('mic_error', 'error', 'Failed to start microphone capture', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Stops microphone recording and releases media tracks.
   */
  public stopMicrophoneCapture(): void {
    this.log('mic_stop', 'info', 'Stopping microphone capture...');

    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor.onaudioprocess = null;
      this.micProcessor = null;
    }

    if (this.micAnalyser) {
      this.micAnalyser.disconnect();
      this.micAnalyser = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.inputCtx) {
      this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }

    this.log('mic_stop', 'success', 'Microphone stopped and tracks released');
  }

  /**
   * Retrieves live mic audio level (0.0 to 1.0) for visualizer listening state.
   */
  public getMicVolume(): number {
    if (!this.micAnalyser) return 0;
    const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  }

  /**
   * Retrieves live output audio level (0.0 to 1.0) for visualizer speaking state.
   */
  public getOutputVolume(): number {
    if (!this.outputAnalyser || !this.isPlayingAudio) return 0;
    const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
    this.outputAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  }

  /**
   * Completely cleans up all audio contexts and sources.
   */
  public cleanup(): void {
    this.stopMicrophoneCapture();
    this.interruptPlayback();

    if (this.outputCtx) {
      this.outputCtx.close().catch(() => {});
      this.outputCtx = null;
      this.outputGain = null;
      this.outputAnalyser = null;
    }

    this.log('cleanup', 'info', 'AudioEngine fully cleaned up');
  }
}
