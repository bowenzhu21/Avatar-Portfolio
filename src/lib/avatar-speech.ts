"use client";

export type AvatarSpeechStatus =
  | "idle"
  | "unlocking"
  | "generating"
  | "playing"
  | "error";

export type AvatarSpeechProvider = "elevenlabs" | "browser" | null;

export interface AvatarSpeechState {
  status: AvatarSpeechStatus;
  isSpeaking: boolean;
  isAudioUnlocked: boolean;
  currentText: string;
  audioLevel: number;
  provider: AvatarSpeechProvider;
  error: string | null;
}

type StateListener = (state: AvatarSpeechState) => void;

const INITIAL_STATE: AvatarSpeechState = {
  status: "idle",
  isSpeaking: false,
  isAudioUnlocked: false,
  currentText: "",
  audioLevel: 0,
  provider: null,
  error: null,
};

async function fetchSpeechAudio(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch("/api/elevenlabs/speech", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to generate ElevenLabs speech.");
  }

  return response.arrayBuffer();
}

export class AvatarSpeechClient {
  private state: AvatarSpeechState = INITIAL_STATE;
  private listeners = new Set<StateListener>();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private levelRafId: number | null = null;
  private playbackToken = 0;
  private lastLevelCommit = 0;
  private outputVolume = 1;
  private pendingRequest: AbortController | null = null;

  subscribe(listener: StateListener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  setOutputVolume(volume: number) {
    const nextVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
    this.outputVolume = nextVolume;

    if (this.gainNode) {
      this.gainNode.gain.value = nextVolume;
    }

    if (this.currentUtterance) {
      this.currentUtterance.volume = nextVolume;
    }
  }

  async unlockAudio() {
    if (typeof document !== "undefined" && document.hidden) return;
    this.setState({
      status: this.state.isSpeaking ? "playing" : "unlocking",
      error: null,
    });

    try {
      const audioContext = this.ensureAudioContext();
      if (audioContext.state !== "running") {
        await audioContext.resume();
      }

      const silentBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      const silentSource = audioContext.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(audioContext.destination);
      silentSource.onended = () => silentSource.disconnect();
      silentSource.start();

      this.setState({
        status: this.state.isSpeaking ? "playing" : "idle",
        isAudioUnlocked: true,
        error: null,
      });
    } catch (error) {
      this.setState({
        status: "error",
        isAudioUnlocked: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to unlock browser audio playback.",
      });
    }
  }

  async speak(text: string) {
    const trimmed = text.trim();
    if (!trimmed || (typeof document !== "undefined" && document.hidden)) {
      await this.interrupt();
      return;
    }

    const token = ++this.playbackToken;
    this.pendingRequest?.abort();
    const request = new AbortController();
    this.pendingRequest = request;
    this.stopCurrentSource();
    this.stopBrowserSpeech();
    this.stopLevelTracking();

    this.setState({
      status: "generating",
      isSpeaking: false,
      currentText: trimmed,
      audioLevel: 0,
      provider: null,
      error: null,
    });

    try {
      const audioBytes = await fetchSpeechAudio(trimmed, request.signal);
      if (token !== this.playbackToken) {
        return;
      }

      const audioContext = this.ensureAudioContext();
      if (audioContext.state !== "running") {
        await audioContext.resume();
      }

      const decodedBuffer = await audioContext.decodeAudioData(audioBytes.slice(0));
      if (token !== this.playbackToken) {
        return;
      }

      const source = audioContext.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(this.analyser!);
      source.onended = () => {
        if (token !== this.playbackToken) {
          return;
        }

        source.disconnect();
        this.currentSource = null;
        this.stopLevelTracking();
        this.setState({
          status: "idle",
          isSpeaking: false,
          currentText: "",
          audioLevel: 0,
          provider: null,
        });
      };

      this.currentSource = source;
      source.start();
      this.startLevelTracking(token);

      this.setState({
        status: "playing",
        isSpeaking: true,
        isAudioUnlocked: true,
        provider: "elevenlabs",
        error: null,
      });
    } catch (error) {
      if (token !== this.playbackToken) {
        return;
      }

      try {
        await this.speakWithBrowserFallback(trimmed, token);
        if (process.env.NODE_ENV === "development") {
          console.warn("[AvatarSpeech] ElevenLabs fallback to browser TTS", error);
        }
        return;
      } catch (fallbackError) {
        this.stopCurrentSource();
        this.stopLevelTracking();

        this.setState({
          status: "error",
          isSpeaking: false,
          audioLevel: 0,
          provider: null,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "Unable to generate or play avatar speech.",
        });

        throw fallbackError;
      }
    } finally {
      if (this.pendingRequest === request) this.pendingRequest = null;
    }
  }

  async interrupt() {
    this.playbackToken += 1;
    this.pendingRequest?.abort();
    this.pendingRequest = null;
    this.stopCurrentSource();
    this.stopBrowserSpeech();
    this.stopLevelTracking();

    this.setState({
      status: "idle",
      isSpeaking: false,
      currentText: "",
      audioLevel: 0,
      provider: null,
      error: null,
    });
  }

  private stopBrowserSpeech() {
    if (this.currentUtterance) {
      this.currentUtterance.onstart = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
      this.currentUtterance = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      gainNode.gain.value = this.outputVolume;

      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      this.audioContext = audioContext;
      this.analyser = analyser;
      this.gainNode = gainNode;
    }

    return this.audioContext;
  }

  private async speakWithBrowserFallback(text: string, token: number) {
    if (!("speechSynthesis" in window)) {
      throw new Error(
        "ElevenLabs speech failed, and browser speech synthesis is unavailable.",
      );
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const englishVoice = synthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.volume = this.outputVolume;
    utterance.rate = 0.96;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (token !== this.playbackToken) {
        synthesis.cancel();
        return;
      }

      this.currentUtterance = utterance;
      this.startSyntheticLevelTracking(token);
      this.setState({
        status: "playing",
        isSpeaking: true,
        isAudioUnlocked: true,
        provider: "browser",
        error: null,
      });
    };

    utterance.onend = () => {
      if (token !== this.playbackToken) {
        return;
      }

      this.currentUtterance = null;
      this.stopLevelTracking();
      this.setState({
        status: "idle",
        isSpeaking: false,
        currentText: "",
        audioLevel: 0,
        provider: null,
        error: null,
      });
    };

    utterance.onerror = () => {
      if (token !== this.playbackToken) {
        return;
      }

      this.currentUtterance = null;
      this.stopLevelTracking();
      this.setState({
        status: "error",
        isSpeaking: false,
        audioLevel: 0,
        provider: null,
        error: "Browser speech fallback failed.",
      });
    };

    this.currentUtterance = utterance;
    synthesis.speak(utterance);
  }

  private startLevelTracking(token: number) {
    const analyser = this.analyser;
    if (!analyser) {
      return;
    }

    const timeDomain = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (token !== this.playbackToken) {
        return;
      }

      analyser.getByteTimeDomainData(timeDomain);

      let total = 0;
      for (let index = 0; index < timeDomain.length; index += 1) {
        const normalized = (timeDomain[index] - 128) / 128;
        total += normalized * normalized;
      }

      const rms = Math.sqrt(total / timeDomain.length);
      const nextLevel = Math.max(0, Math.min(1, rms * 5.5));
      const now = performance.now();

      if (
        Math.abs(nextLevel - this.state.audioLevel) > 0.03 ||
        now - this.lastLevelCommit > 48
      ) {
        this.lastLevelCommit = now;
        this.setState({ audioLevel: nextLevel });
      }

      this.levelRafId = window.requestAnimationFrame(tick);
    };

    this.levelRafId = window.requestAnimationFrame(tick);
  }

  private startSyntheticLevelTracking(token: number) {
    const tick = () => {
      if (token !== this.playbackToken) {
        return;
      }

      const now = performance.now();
      const nextLevel =
        0.16 +
        Math.abs(Math.sin(now / 160)) * 0.18 +
        Math.abs(Math.sin(now / 67)) * 0.08;

      if (now - this.lastLevelCommit > 48) {
        this.lastLevelCommit = now;
        this.setState({ audioLevel: Math.min(0.55, nextLevel) });
      }

      this.levelRafId = window.requestAnimationFrame(tick);
    };

    this.levelRafId = window.requestAnimationFrame(tick);
  }

  private stopCurrentSource() {
    if (!this.currentSource) {
      return;
    }

    this.currentSource.onended = null;
    try {
      this.currentSource.stop();
    } catch {
      // Source may already be stopped.
    }

    this.currentSource.disconnect();
    this.currentSource = null;
  }

  private stopLevelTracking() {
    if (this.levelRafId !== null) {
      window.cancelAnimationFrame(this.levelRafId);
      this.levelRafId = null;
    }

    this.lastLevelCommit = 0;
  }

  private setState(patch: Partial<AvatarSpeechState>) {
    this.state = {
      ...this.state,
      ...patch,
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const sharedAvatarSpeechClient = new AvatarSpeechClient();
