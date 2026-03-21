"use client";

import StreamingAvatar, {
  AvatarQuality,
  ConnectionQuality,
  type EventHandler,
  type StartAvatarRequest,
  type StartAvatarResponse,
  StreamingEvents,
  TaskMode,
  TaskType,
} from "@heygen/streaming-avatar";
import { avatarConfig } from "@/config/avatar";

export type HeyGenAvatarStatus =
  | "idle"
  | "token_loading"
  | "session_created"
  | "connecting"
  | "connected"
  | "speaking"
  | "disconnected"
  | "error";

export interface HeyGenAvatarState {
  status: HeyGenAvatarStatus;
  isLoading: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  mediaStream: MediaStream | null;
  session: StartAvatarResponse | null;
  connectionQuality: ConnectionQuality | "unknown";
  error: string | null;
}

export interface HeyGenCreateSessionOptions {
  quality?: AvatarQuality;
  language?: string;
  knowledgeBase?: string;
  activityIdleTimeout?: number;
}

type StateListener = (state: HeyGenAvatarState) => void;

const DEFAULT_START_REQUEST: StartAvatarRequest = {
  avatarName: avatarConfig.avatarId,
  quality: AvatarQuality.High,
  activityIdleTimeout: 180,
};

const INITIAL_STATE: HeyGenAvatarState = {
  status: "idle",
  isLoading: false,
  isConnected: false,
  isSpeaking: false,
  mediaStream: null,
  session: null,
  connectionQuality: "unknown",
  error: null,
};

async function fetchSessionToken(): Promise<string> {
  const response = await fetch("/api/heygen/session-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Failed to fetch HeyGen session token.");
  }

  const body = (await response.json()) as { token: string };

  if (!body.token) {
    throw new Error("HeyGen session token response was empty.");
  }

  return body.token;
}

function toStartRequest(
  options: HeyGenCreateSessionOptions = {},
): StartAvatarRequest {
  return {
    // TODO: The current public Streaming Avatar SDK request shape does not expose a contextId field.
    // If your HeyGen account requires explicit LiveAvatar context binding, add that account-specific
    // session wiring here once the relevant endpoint or SDK field is available.
    ...DEFAULT_START_REQUEST,
    quality: options.quality ?? DEFAULT_START_REQUEST.quality,
    language: options.language,
    knowledgeBase: options.knowledgeBase,
    activityIdleTimeout:
      options.activityIdleTimeout ?? DEFAULT_START_REQUEST.activityIdleTimeout,
  };
}

export class HeyGenAvatarClient {
  private avatar: StreamingAvatar | null = null;
  private state: HeyGenAvatarState = INITIAL_STATE;
  private listeners = new Set<StateListener>();
  private pendingStartRequest: StartAvatarRequest | null = null;
  private boundHandlers = new Map<string, EventHandler>();

  getState(): HeyGenAvatarState {
    return this.state;
  }

  subscribe(listener: StateListener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async createSession(
    options: HeyGenCreateSessionOptions = {},
  ): Promise<StartAvatarResponse> {
    this.setState({
      status: "token_loading",
      isLoading: true,
      error: null,
    });

    try {
      const token = await fetchSessionToken();
      const startRequest = toStartRequest(options);

      this.disposeAvatar();
      this.avatar = new StreamingAvatar({ token });
      this.pendingStartRequest = startRequest;
      this.bindAvatarEvents(this.avatar);

      const session = await this.avatar.newSession(startRequest);

      this.setState({
        status: "session_created",
        isLoading: false,
        session,
        error: null,
        mediaStream: null,
        isConnected: false,
        isSpeaking: false,
      });

      return session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create HeyGen session.";

      this.setState({
        status: "error",
        isLoading: false,
        error: message,
      });

      throw error;
    }
  }

  async startSession(): Promise<StartAvatarResponse> {
    if (!this.avatar || !this.state.session || !this.pendingStartRequest) {
      throw new Error("Create a HeyGen session before starting it.");
    }

    this.setState({
      status: "connecting",
      isLoading: true,
      error: null,
    });

    try {
      const session = await this.avatar.startAvatar(
        this.pendingStartRequest,
        this.state.session,
      );

      this.setState({
        status: "connecting",
        isLoading: false,
        session,
      });

      return session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start HeyGen session.";

      this.setState({
        status: "error",
        isLoading: false,
        error: message,
      });

      throw error;
    }
  }

  async createAndStartSession(
    options: HeyGenCreateSessionOptions = {},
  ): Promise<StartAvatarResponse> {
    await this.createSession(options);
    return this.startSession();
  }

  async stopSession(): Promise<void> {
    if (!this.avatar) {
      this.resetState();
      return;
    }

    try {
      await this.avatar.stopAvatar();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop HeyGen session.";
      this.setState({
        status: "error",
        isLoading: false,
        error: message,
      });
      throw error;
    } finally {
      this.disposeAvatar();
      this.resetState();
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.avatar) {
      throw new Error("Start a HeyGen session before calling speak().");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    await this.avatar.speak({
      text: trimmedText,
      taskType: TaskType.TALK,
      taskMode: TaskMode.ASYNC,
    });
  }

  async interrupt(): Promise<void> {
    if (!this.avatar) {
      return;
    }

    await this.avatar.interrupt();
    this.setState({
      isSpeaking: false,
      status: this.state.isConnected ? "connected" : this.state.status,
    });
  }

  private bindAvatarEvents(avatar: StreamingAvatar) {
    const onStreamReady: EventHandler = (stream: MediaStream) => {
      this.setState({
        mediaStream: stream,
        isConnected: true,
        status: "connected",
        isLoading: false,
        error: null,
        connectionQuality: avatar.connectionQuality ?? "unknown",
      });
    };

    const onStreamDisconnected: EventHandler = () => {
      this.setState({
        status: "disconnected",
        isConnected: false,
        isSpeaking: false,
        mediaStream: null,
      });
    };

    const onAvatarStartTalking: EventHandler = () => {
      this.setState({
        status: "speaking",
        isSpeaking: true,
      });
    };

    const onAvatarStopTalking: EventHandler = () => {
      this.setState({
        status: this.state.isConnected ? "connected" : "disconnected",
        isSpeaking: false,
      });
    };

    const onConnectionQualityChanged: EventHandler = () => {
      this.setState({
        connectionQuality: avatar.connectionQuality ?? "unknown",
      });
    };

    const eventHandlers: Array<[StreamingEvents, EventHandler]> = [
      [StreamingEvents.STREAM_READY, onStreamReady],
      [StreamingEvents.STREAM_DISCONNECTED, onStreamDisconnected],
      [StreamingEvents.AVATAR_START_TALKING, onAvatarStartTalking],
      [StreamingEvents.AVATAR_STOP_TALKING, onAvatarStopTalking],
      [StreamingEvents.CONNECTION_QUALITY_CHANGED, onConnectionQualityChanged],
    ];

    for (const [event, handler] of eventHandlers) {
      avatar.on(event, handler);
      this.boundHandlers.set(event, handler);
    }
  }

  private disposeAvatar() {
    if (!this.avatar) {
      return;
    }

    for (const [event, handler] of this.boundHandlers.entries()) {
      this.avatar.off(event, handler);
    }

    this.boundHandlers.clear();
    this.avatar = null;
  }

  private resetState() {
    this.pendingStartRequest = null;
    this.setState({
      ...INITIAL_STATE,
    });
  }

  private setState(partial: Partial<HeyGenAvatarState>) {
    this.state = {
      ...this.state,
      ...partial,
    };

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const sharedHeyGenAvatarClient = new HeyGenAvatarClient();
