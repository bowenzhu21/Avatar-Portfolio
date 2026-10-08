"use client";

const DEEPGRAM_LISTEN_URL = "wss://api.deepgram.com/v1/listen";
const TARGET_SAMPLE_RATE = 16_000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;
const FINALIZE_TIMEOUT_MS = 700;

export type DeepgramRealtimeStatus =
  | "idle"
  | "requesting_permission"
  | "token_loading"
  | "connecting"
  | "listening"
  | "stopping"
  | "error";

export interface DeepgramRealtimeSession {
  sessionId: string | null;
  modelId: "nova-3";
  status: DeepgramRealtimeStatus;
}

export interface DeepgramRealtimeState {
  session: DeepgramRealtimeSession;
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  lastFinalTranscript: string;
  error: string | null;
  microphonePermission: "unknown" | "granted" | "denied";
}

interface DeepgramRealtimeTokenResponse {
  token: string;
  expiresIn?: number | null;
}

interface DeepgramResultAlternative {
  transcript?: string;
}

interface DeepgramResultsMessage {
  type: "Results";
  is_final?: boolean;
  speech_final?: boolean;
  from_finalize?: boolean;
  metadata?: {
    request_id?: string;
  };
  channel?: {
    alternatives?: DeepgramResultAlternative[];
  };
}

interface DeepgramMetadataMessage {
  type: "Metadata";
  request_id?: string;
}

interface DeepgramUtteranceEndMessage {
  type: "UtteranceEnd";
}

interface DeepgramErrorMessage {
  type: "Error";
  description?: string;
  message?: string;
}

type DeepgramRealtimeMessage =
  | DeepgramResultsMessage
  | DeepgramMetadataMessage
  | DeepgramUtteranceEndMessage
  | DeepgramErrorMessage;

type StateListener = (state: DeepgramRealtimeState) => void;

const INITIAL_STATE: DeepgramRealtimeState = {
  session: {
    sessionId: null,
    modelId: "nova-3",
    status: "idle",
  },
  isListening: false,
  transcript: "",
  partialTranscript: "",
  lastFinalTranscript: "",
  error: null,
  microphonePermission: "unknown",
};

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Float32Array {
  if (outputSampleRate === inputSampleRate) {
    return buffer;
  }

  if (outputSampleRate > inputSampleRate) {
    throw new Error("Output sample rate must be less than or equal to input sample rate.");
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accumulated = 0;
    let count = 0;

    for (
      let index = offsetBuffer;
      index < nextOffsetBuffer && index < buffer.length;
      index += 1
    ) {
      accumulated += buffer[index] ?? 0;
      count += 1;
    }

    result[offsetResult] = accumulated / Math.max(count, 1);
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

async function fetchRealtimeToken(signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/deepgram/realtime-token", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to create Deepgram realtime token.");
  }

  const payload = (await response.json()) as DeepgramRealtimeTokenResponse;

  if (!payload.token) {
    throw new Error("Deepgram realtime token response did not include a token.");
  }

  return payload.token;
}

export class DeepgramRealtimeClient {
  private state: DeepgramRealtimeState = INITIAL_STATE;
  private listeners = new Set<StateListener>();
  private socket: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private finalizedSegments: string[] = [];
  private finalizePending: Promise<void> | null = null;
  private resolveFinalizePending: (() => void) | null = null;
  private sessionGeneration = 0;
  private startPending: Promise<void> | null = null;
  private stopPending: Promise<void> | null = null;
  private tokenRequest: AbortController | null = null;
  private cancelConnection: (() => void) | null = null;

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

  async startListening(): Promise<void> {
    if (this.state.isListening) return;
    if (this.startPending) return this.startPending;
    if (this.stopPending) await this.stopPending;
    // Another caller may have started while the previous stop was finishing.
    if (this.startPending) return this.startPending;

    const generation = ++this.sessionGeneration;
    const operation = this.openListeningSession(generation);
    this.startPending = operation;
    try {
      await operation;
    } finally {
      if (this.startPending === operation) this.startPending = null;
    }
  }

  private async openListeningSession(generation: number): Promise<void> {
    this.finalizedSegments = [];
    this.resolveFinalize();
    this.setState({
      session: {
        ...this.state.session,
        status: "requesting_permission",
      },
      error: null,
      transcript: "",
      partialTranscript: "",
      lastFinalTranscript: "",
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (generation !== this.sessionGeneration) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.mediaStream = stream;

      this.setState({
        microphonePermission: "granted",
        session: {
          ...this.state.session,
          status: "token_loading",
        },
      });

      const request = new AbortController();
      this.tokenRequest = request;
      const tokenTimeout = setTimeout(() => request.abort(), 15_000);
      let token: string;
      try {
        token = await fetchRealtimeToken(request.signal);
      } finally {
        clearTimeout(tokenTimeout);
        if (this.tokenRequest === request) this.tokenRequest = null;
      }
      if (generation !== this.sessionGeneration) return;
      const url = new URL(DEEPGRAM_LISTEN_URL);
      url.searchParams.set("model", "nova-3");
      url.searchParams.set("language", "en-US");
      url.searchParams.set("encoding", "linear16");
      url.searchParams.set("sample_rate", String(TARGET_SAMPLE_RATE));
      url.searchParams.set("channels", "1");
      url.searchParams.set("interim_results", "true");
      url.searchParams.set("punctuate", "true");
      url.searchParams.set("smart_format", "true");
      url.searchParams.set("endpointing", "300");

      this.setState({
        session: {
          ...this.state.session,
          status: "connecting",
        },
      });

      await this.connectWebSocket(url.toString(), token);
      if (generation !== this.sessionGeneration) return;
      await this.startAudioPipeline(stream);
      if (generation !== this.sessionGeneration) return;

      this.setState({
        isListening: true,
        error: null,
        session: {
          ...this.state.session,
          status: "listening",
        },
      });
    } catch (error) {
      if (generation !== this.sessionGeneration) return;
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start realtime transcription.";

      const permissionDenied =
        error instanceof DOMException && error.name === "NotAllowedError";

      await this.cleanupTransport();

      this.setState({
        isListening: false,
        error: permissionDenied
          ? "Microphone access was denied. Allow microphone permissions to use voice input."
          : message,
        microphonePermission: permissionDenied ? "denied" : this.state.microphonePermission,
        session: {
          sessionId: null,
          modelId: "nova-3",
          status: "error",
        },
      });

      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (this.stopPending) return this.stopPending;
    this.sessionGeneration += 1;
    this.startPending = null;
    this.tokenRequest?.abort();
    this.tokenRequest = null;
    const operation = this.finishListeningSession();
    this.stopPending = operation;
    try {
      await operation;
    } finally {
      if (this.stopPending === operation) this.stopPending = null;
    }
  }

  private async finishListeningSession(): Promise<void> {
    this.setState({
      isListening: false,
      session: { ...this.state.session, status: "stopping" },
    });
    // Stop capture immediately; finalization only drains audio already sent.
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    const socket = this.socket;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        this.finalizePending = new Promise<void>((resolve) => {
          this.resolveFinalizePending = resolve;
        });
        socket.send(JSON.stringify({ type: "Finalize" }));
        await Promise.race([
          this.finalizePending,
          new Promise<void>((resolve) => {
            timeoutId = setTimeout(resolve, FINALIZE_TIMEOUT_MS);
          }),
        ]);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "CloseStream" }));
        }
      }
    } catch {
      // A dropped connection must never prevent microphone cleanup.
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      await this.cleanupTransport();
      this.resetState();
    }
  }

  async toggleListening(): Promise<void> {
    if (this.state.session.status !== "idle" && this.state.session.status !== "error") {
      await this.stopListening();
      return;
    }
    await this.startListening();
  }

  clearTranscript() {
    this.finalizedSegments = [];
    this.setState({
      transcript: "",
      partialTranscript: "",
      lastFinalTranscript: "",
    });
  }

  clearCommittedTranscript() {
    this.finalizedSegments = [];
    this.setState({
      transcript: "",
      lastFinalTranscript: "",
    });
  }

  private async connectWebSocket(url: string, token: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url, ["bearer", token]);
      this.socket = socket;
      let connected = false;
      const timeoutId = setTimeout(() => {
        reject(new Error("Voice connection timed out. Try again, or type your question."));
      }, 10_000);
      const finishConnection = () => {
        clearTimeout(timeoutId);
        this.cancelConnection = null;
      };
      this.cancelConnection = () => {
        finishConnection();
        reject(new DOMException("Voice input cancelled.", "AbortError"));
      };

      socket.onopen = () => {
        connected = true;
        finishConnection();
        resolve();
      };
      socket.onerror = () => {
        finishConnection();
        const error = new Error("Unable to connect voice input. Try again, or type your question.");
        if (!connected) reject(error);
        else {
          this.sessionGeneration += 1;
          this.setState({
            isListening: false,
            error: error.message,
            session: { ...this.state.session, status: "error" },
          });
          void this.cleanupTransport();
        }
      };
      socket.onclose = () => {
        finishConnection();
        if (!connected) {
          reject(new Error("Voice connection closed before it was ready."));
          return;
        }
        if (this.state.session.status === "stopping") {
          this.resolveFinalize();
          return;
        }
        this.sessionGeneration += 1;
        this.setState({
          isListening: false,
          partialTranscript: "",
          error: "Voice connection closed. Try again, or type your question.",
          session: { sessionId: null, modelId: "nova-3", status: "error" },
        });
        void this.cleanupTransport();
      };
      socket.onmessage = (event) => {
        try {
          this.handleSocketMessage(JSON.parse(event.data) as DeepgramRealtimeMessage);
        } catch {
          this.sessionGeneration += 1;
          this.setState({
            isListening: false,
            error: "Voice input received an unreadable response. Please try again.",
            session: { ...this.state.session, status: "error" },
          });
          void this.cleanupTransport();
        }
      };
    });
  }

  private handleSocketMessage(message: DeepgramRealtimeMessage) {
    if (message.type === "Metadata") {
      this.setState({
        session: {
          sessionId: message.request_id ?? this.state.session.sessionId,
          modelId: "nova-3",
          status: "listening",
        },
      });
      return;
    }

    if (message.type === "Results") {
      const transcript = message.channel?.alternatives?.[0]?.transcript?.trim() ?? "";

      if (!transcript && !message.from_finalize) {
        return;
      }

      if (message.is_final && transcript) {
        this.finalizedSegments = [...this.finalizedSegments, transcript];
      }

      if (message.is_final && (message.speech_final || message.from_finalize)) {
        const finalText = this.finalizedSegments.join(" ").replace(/\s+/g, " ").trim();
        this.finalizedSegments = [];
        this.resolveFinalize();

        if (!finalText) {
          return;
        }

        this.setState({
          transcript: finalText,
          partialTranscript: "",
          lastFinalTranscript: finalText,
        });
        return;
      }

      if (!message.is_final) {
        const preview = [this.finalizedSegments.join(" "), transcript]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        this.setState({
          partialTranscript: preview,
        });
      }
      return;
    }

    if (message.type === "Error") {
      this.sessionGeneration += 1;
      this.setState({
        isListening: false,
        error: message.description || message.message || "Deepgram realtime error.",
        session: {
          ...this.state.session,
          status: "error",
        },
      });
      this.resolveFinalize();
      void this.cleanupTransport();
    }
  }

  private async startAudioPipeline(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      throw new Error("This browser does not support Web Audio microphone capture.");
    }

    const audioContext = new AudioContextCtor();
    this.audioContext = audioContext;
    this.sourceNode = audioContext.createMediaStreamSource(stream);
    this.processorNode = audioContext.createScriptProcessor(
      SCRIPT_PROCESSOR_BUFFER_SIZE,
      1,
      1,
    );

    this.processorNode.onaudioprocess = (event) => {
      if (this.state.session.status !== "listening" || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      const channelData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(
        channelData,
        audioContext.sampleRate,
        TARGET_SAMPLE_RATE,
      );
      const pcm16 = floatTo16BitPCM(downsampled);

      this.socket.send(pcm16.buffer);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(audioContext.destination);

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  private async cleanupTransport() {
    // Detach all handles before awaiting, so overlapping shutdowns cannot close
    // a newly started session or leave tracks alive while AudioContext closes.
    const processor = this.processorNode;
    const source = this.sourceNode;
    const context = this.audioContext;
    const stream = this.mediaStream;
    const socket = this.socket;
    this.processorNode = null;
    this.sourceNode = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.socket = null;
    this.tokenRequest?.abort();
    this.tokenRequest = null;
    this.cancelConnection?.();
    this.cancelConnection = null;

    if (processor) {
      processor.onaudioprocess = null;
      processor.disconnect();
    }
    source?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }
    this.resolveFinalize();
    this.finalizedSegments = [];
    if (context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
  }

  private resetState() {
    this.finalizedSegments = [];
    this.resolveFinalize();
    this.setState({
      ...INITIAL_STATE,
      microphonePermission: this.state.microphonePermission,
    });
  }

  private resolveFinalize() {
    this.resolveFinalizePending?.();
    this.resolveFinalizePending = null;
    this.finalizePending = null;
  }

  private setState(patch: Partial<DeepgramRealtimeState>) {
    this.state = {
      ...this.state,
      ...patch,
      session: {
        ...this.state.session,
        ...patch.session,
      },
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
