"use client";

const ELEVENLABS_REALTIME_URL =
  "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const TARGET_SAMPLE_RATE = 16_000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

export type ElevenLabsRealtimeStatus =
  | "idle"
  | "requesting_permission"
  | "token_loading"
  | "connecting"
  | "listening"
  | "stopping"
  | "error";

export interface ElevenLabsTranscriptWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | string;
  logprob?: number;
  characters?: string[];
}

export interface ElevenLabsRealtimeSession {
  sessionId: string | null;
  modelId: "scribe_v2_realtime";
  status: ElevenLabsRealtimeStatus;
}

export interface ElevenLabsRealtimeState {
  session: ElevenLabsRealtimeSession;
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  lastFinalTranscript: string;
  error: string | null;
  microphonePermission: "unknown" | "granted" | "denied";
}

export interface ElevenLabsRealtimeTokenResponse {
  token: string;
}

export interface ElevenLabsSessionStartedMessage {
  message_type: "session_started";
  session_id: string;
  config: {
    sample_rate: number;
    audio_format: string;
    language_code?: string;
    model_id: string;
    include_timestamps: boolean;
  };
}

export interface ElevenLabsPartialTranscriptMessage {
  message_type: "partial_transcript";
  text: string;
}

export interface ElevenLabsCommittedTranscriptMessage {
  message_type: "committed_transcript";
  text: string;
}

export interface ElevenLabsCommittedTranscriptWithTimestampsMessage {
  message_type: "committed_transcript_with_timestamps";
  text: string;
  language_code?: string;
  words: ElevenLabsTranscriptWord[];
}

export interface ElevenLabsErrorMessage {
  message_type: "error";
  error: string;
}

type ElevenLabsRealtimeMessage =
  | ElevenLabsSessionStartedMessage
  | ElevenLabsPartialTranscriptMessage
  | ElevenLabsCommittedTranscriptMessage
  | ElevenLabsCommittedTranscriptWithTimestampsMessage
  | ElevenLabsErrorMessage;

type StateListener = (state: ElevenLabsRealtimeState) => void;

const INITIAL_STATE: ElevenLabsRealtimeState = {
  session: {
    sessionId: null,
    modelId: "scribe_v2_realtime",
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

function pcmToBase64(pcm16: Int16Array): string {
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  return btoa(binary);
}

async function fetchRealtimeToken(): Promise<string> {
  const response = await fetch("/api/elevenlabs/realtime-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to create ElevenLabs realtime token.");
  }

  const payload = (await response.json()) as ElevenLabsRealtimeTokenResponse;

  if (!payload.token) {
    throw new Error("ElevenLabs realtime token response did not include a token.");
  }

  return payload.token;
}

export class ElevenLabsRealtimeClient {
  private state: ElevenLabsRealtimeState = INITIAL_STATE;
  private listeners = new Set<StateListener>();
  private socket: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;

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
    if (this.state.isListening) {
      return;
    }

    this.setState({
      session: {
        ...this.state.session,
        status: "requesting_permission",
      },
      error: null,
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

      this.mediaStream = stream;

      this.setState({
        microphonePermission: "granted",
        session: {
          ...this.state.session,
          status: "token_loading",
        },
      });

      const token = await fetchRealtimeToken();
      const url = new URL(ELEVENLABS_REALTIME_URL);
      url.searchParams.set("model_id", "scribe_v2_realtime");
      url.searchParams.set("token", token);
      url.searchParams.set("include_timestamps", "true");
      url.searchParams.set("commit_strategy", "vad");
      url.searchParams.set("audio_format", "pcm_16000");
      url.searchParams.set("language_code", "en");

      this.setState({
        session: {
          ...this.state.session,
          status: "connecting",
        },
      });

      await this.connectWebSocket(url.toString());
      await this.startAudioPipeline(stream);

      this.setState({
        isListening: true,
        error: null,
        session: {
          ...this.state.session,
          status: "listening",
        },
      });
    } catch (error) {
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
          modelId: "scribe_v2_realtime",
          status: "error",
        },
      });

      throw error;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.state.isListening && !this.socket && !this.mediaStream) {
      this.resetState();
      return;
    }

    this.setState({
      session: {
        ...this.state.session,
        status: "stopping",
      },
    });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: "",
          commit: true,
        }),
      );
    }

    await this.cleanupTransport();

    this.setState({
      isListening: false,
      partialTranscript: "",
      lastFinalTranscript: "",
      session: {
        sessionId: null,
        modelId: "scribe_v2_realtime",
        status: "idle",
      },
    });
  }

  async toggleListening(): Promise<void> {
    if (this.state.isListening) {
      await this.stopListening();
      return;
    }

    await this.startListening();
  }

  clearTranscript() {
    this.setState({
      transcript: "",
      partialTranscript: "",
      lastFinalTranscript: "",
    });
  }

  private async connectWebSocket(url: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        resolve();
      };

      socket.onerror = () => {
        reject(new Error("Failed to connect to ElevenLabs realtime transcription."));
      };

      socket.onclose = () => {
        this.setState({
          isListening: false,
          partialTranscript: "",
          session: {
            sessionId: null,
            modelId: "scribe_v2_realtime",
            status:
              this.state.session.status === "error" ? "error" : "idle",
          },
        });
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ElevenLabsRealtimeMessage;
          this.handleSocketMessage(payload);
        } catch {
          this.setState({
            error: "Received an unreadable ElevenLabs realtime message.",
            session: {
              ...this.state.session,
              status: "error",
            },
          });
        }
      };
    });
  }

  private handleSocketMessage(message: ElevenLabsRealtimeMessage) {
    switch (message.message_type) {
      case "session_started": {
        this.setState({
          session: {
            sessionId: message.session_id,
            modelId: "scribe_v2_realtime",
            status: "listening",
          },
        });
        return;
      }
      case "partial_transcript": {
        this.setState({
          partialTranscript: message.text,
        });
        return;
      }
      case "committed_transcript":
      case "committed_transcript_with_timestamps": {
        this.setState({
          transcript: [this.state.transcript, message.text].filter(Boolean).join(" ").trim(),
          partialTranscript: "",
          lastFinalTranscript: message.text,
        });
        return;
      }
      default: {
        if ("error" in message && message.error) {
          this.setState({
            error: message.error,
            session: {
              ...this.state.session,
              status: "error",
            },
          });
        }
      }
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
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      const channelData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(
        channelData,
        audioContext.sampleRate,
        TARGET_SAMPLE_RATE,
      );
      const pcm16 = floatTo16BitPCM(downsampled);

      this.socket.send(
        JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: pcmToBase64(pcm16),
        }),
      );
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(audioContext.destination);

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

  private async cleanupTransport() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioContext) {
      await this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;

      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }

      this.socket = null;
    }
  }

  private resetState() {
    this.setState({
      ...INITIAL_STATE,
    });
  }

  private setState(partial: Partial<ElevenLabsRealtimeState>) {
    this.state = {
      ...this.state,
      ...partial,
      session: partial.session
        ? {
            ...this.state.session,
            ...partial.session,
          }
        : this.state.session,
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
