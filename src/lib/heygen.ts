"use client";

import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type DataPacket_Kind,
  type DisconnectReason,
  type Participant,
  type RemoteAudioTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteVideoTrack,
} from "livekit-client";
import { avatarConfig } from "@/config/avatar";

export type HeyGenAvatarStatus =
  | "idle"
  | "session_loading"
  | "session_created"
  | "connecting"
  | "connected"
  | "speaking"
  | "disconnected"
  | "error";

export type HeyGenConnectionQuality =
  | "excellent"
  | "good"
  | "poor"
  | "lost"
  | "unknown";

export interface HeyGenAvatarSession {
  sessionId: string;
  sessionToken: string;
  livekitUrl: string;
  livekitToken: string;
  mode: "FULL";
  interactivityType: "CONVERSATIONAL" | "PUSH_TO_TALK";
  avatarId: string;
  contextId: string;
}

export interface HeyGenAvatarDebugState {
  roomState: "disconnected" | "connecting" | "connected" | "reconnecting";
  remoteParticipantIdentity: string | null;
  hasRemoteParticipant: boolean;
  remoteAudioSubscribed: boolean;
  remoteVideoSubscribed: boolean;
  remoteAudioTrackCount: number;
  remoteVideoTrackCount: number;
  audioElementAttached: boolean;
  audioPlaybackBlocked: boolean;
  audioPlaybackStarted: boolean;
}

export interface HeyGenAvatarState {
  status: HeyGenAvatarStatus;
  isLoading: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  session: HeyGenAvatarSession | null;
  connectionQuality: HeyGenConnectionQuality;
  error: string | null;
  debug: HeyGenAvatarDebugState;
}

export interface HeyGenCreateSessionOptions {
  quality?: "low" | "medium" | "high" | "very_high";
  language?: string;
  encoding?: "H264" | "VP8";
  interactivityType?: "CONVERSATIONAL" | "PUSH_TO_TALK";
  sandbox?: boolean;
  voiceId?: string | null;
}

type StateListener = (state: HeyGenAvatarState) => void;

const INITIAL_DEBUG_STATE: HeyGenAvatarDebugState = {
  roomState: "disconnected",
  remoteParticipantIdentity: null,
  hasRemoteParticipant: false,
  remoteAudioSubscribed: false,
  remoteVideoSubscribed: false,
  remoteAudioTrackCount: 0,
  remoteVideoTrackCount: 0,
  audioElementAttached: false,
  audioPlaybackBlocked: false,
  audioPlaybackStarted: false,
};

const INITIAL_STATE: HeyGenAvatarState = {
  status: "idle",
  isLoading: false,
  isConnected: false,
  isSpeaking: false,
  videoStream: null,
  audioStream: null,
  session: null,
  connectionQuality: "unknown",
  error: null,
  debug: INITIAL_DEBUG_STATE,
};

async function fetchLiveAvatarSession(
  options: HeyGenCreateSessionOptions = {},
): Promise<HeyGenAvatarSession> {
  const response = await fetch("/api/heygen/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Failed to create a LiveAvatar session.");
  }

  const body = (await response.json()) as Partial<HeyGenAvatarSession>;

  if (!body.sessionId || !body.sessionToken || !body.livekitToken || !body.livekitUrl) {
    throw new Error("LiveAvatar session response was incomplete.");
  }

  return {
    sessionId: body.sessionId,
    sessionToken: body.sessionToken,
    livekitUrl: body.livekitUrl,
    livekitToken: body.livekitToken,
    mode: "FULL",
    interactivityType: body.interactivityType ?? options.interactivityType ?? "CONVERSATIONAL",
    avatarId: body.avatarId ?? avatarConfig.avatarId,
    contextId: body.contextId ?? avatarConfig.contextId,
  };
}

function toRoomState(connectionState: ConnectionState): HeyGenAvatarDebugState["roomState"] {
  if (connectionState === ConnectionState.Connecting) {
    return "connecting";
  }

  if (connectionState === ConnectionState.Reconnecting) {
    return "reconnecting";
  }

  if (connectionState === ConnectionState.Connected) {
    return "connected";
  }

  return "disconnected";
}

export class HeyGenAvatarClient {
  private room: Room | null = null;
  private state: HeyGenAvatarState = INITIAL_STATE;
  private listeners = new Set<StateListener>();
  private remoteAudioTracks = new Map<string, MediaStreamTrack>();
  private remoteVideoTracks = new Map<string, MediaStreamTrack>();
  private speakingTimeoutId: number | null = null;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

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
  ): Promise<HeyGenAvatarSession> {
    this.setState({
      status: "session_loading",
      isLoading: true,
      error: null,
    });

    try {
      const session = await fetchLiveAvatarSession(options);
      this.log("session.created", { sessionId: session.sessionId });

      this.setState({
        status: "session_created",
        isLoading: false,
        session,
        error: null,
        videoStream: null,
        audioStream: null,
        isConnected: false,
        isSpeaking: false,
        connectionQuality: "unknown",
        debug: {
          ...INITIAL_DEBUG_STATE,
        },
      });

      return session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create the LiveAvatar session.";

      this.setState({
        status: "error",
        isLoading: false,
        error: message,
      });

      throw error;
    }
  }

  async startSession(): Promise<HeyGenAvatarSession> {
    if (!this.state.session) {
      throw new Error("Create a LiveAvatar session before starting it.");
    }

    this.setState({
      status: "connecting",
      isLoading: true,
      error: null,
      debug: {
        ...this.state.debug,
        roomState: "connecting",
      },
    });

    try {
      this.disposeRoom();

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      this.bindRoomEvents(room);
      this.log("room.connecting", { url: this.state.session.livekitUrl });
      await room.connect(this.state.session.livekitUrl, this.state.session.livekitToken);

      this.room = room;
      this.syncSubscribedTracks();

      this.setState({
        status: "connected",
        isLoading: false,
        isConnected: this.remoteVideoTracks.size > 0 || this.remoteAudioTracks.size > 0,
        connectionQuality: "good",
        debug: {
          ...this.state.debug,
          roomState: "connected",
        },
      });

      return this.state.session;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect to the LiveAvatar room.";

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
  ): Promise<HeyGenAvatarSession> {
    await this.createSession(options);
    return this.startSession();
  }

  async stopSession(): Promise<void> {
    try {
      const sessionId = this.state.session?.sessionId ?? null;

      if (sessionId) {
        const response = await fetch("/api/heygen/session", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Failed to stop the LiveAvatar session.");
        }
      }
    } finally {
      this.disposeRoom();
      this.resetState();
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.room || !this.state.isConnected) {
      throw new Error("Start a LiveAvatar session before calling speak().");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    this.setSpeaking(true);

    await this.sendAgentControlMessage({
      type: "avatar.speak_text",
      text: trimmedText,
    });

    this.armSpeakingFallback(trimmedText);
  }

  async interrupt(): Promise<void> {
    if (!this.room || !this.state.isConnected) {
      return;
    }

    await this.sendAgentControlMessage({ type: "avatar.interrupt" });

    this.clearSpeakingFallback();
    this.setSpeaking(false);
  }

  private async sendAgentControlMessage(payload: Record<string, unknown>) {
    if (!this.room) {
      throw new Error("LiveAvatar room is not available.");
    }

    await this.room.localParticipant.waitUntilActive();
    this.log("agent-control.send", payload);

    const encoded = this.textEncoder.encode(JSON.stringify(payload));

    try {
      await this.room.localParticipant.publishData(encoded, {
        reliable: true,
        topic: "agent-control",
      });
    } catch (error) {
      this.log("agent-control.retry", {
        message: error instanceof Error ? error.message : "unknown",
      });

      await new Promise((resolve) => {
        window.setTimeout(resolve, 450);
      });

      await this.room.localParticipant.publishData(encoded, {
        reliable: true,
        topic: "agent-control",
      });
    }
  }

  markAudioElementAttached(attached: boolean) {
    this.setState({
      debug: {
        ...this.state.debug,
        audioElementAttached: attached,
      },
    });
  }

  markAudioPlaybackStatus(status: "started" | "blocked" | "cleared") {
    if (status === "cleared") {
      this.setState({
        debug: {
          ...this.state.debug,
          audioPlaybackBlocked: false,
          audioPlaybackStarted: false,
        },
      });
      return;
    }

    this.setState({
      debug: {
        ...this.state.debug,
        audioPlaybackBlocked: status === "blocked",
        audioPlaybackStarted: status === "started",
      },
    });
  }

  private bindRoomEvents(room: Room) {
    room
      .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        this.log("participant.connected", { identity: participant.identity });
        this.setState({
          debug: {
            ...this.state.debug,
            hasRemoteParticipant: true,
            remoteParticipantIdentity: participant.identity,
          },
        });
      })
      .on(RoomEvent.ParticipantDisconnected, () => {
        this.log("participant.disconnected");
        this.setState({
          debug: {
            ...this.state.debug,
            hasRemoteParticipant: false,
            remoteParticipantIdentity: null,
          },
        });
      })
      .on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          publication: RemoteTrackPublication,
          participant: Participant,
        ) => {
          if (participant.isLocal) {
            return;
          }

          this.log("track.subscribed", {
            kind: track.kind,
            participant: participant.identity,
            source: publication.source,
          });

          if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
            this.attachRemoteTrack(track as RemoteVideoTrack | RemoteAudioTrack, participant);
          }
        },
      )
      .on(
        RoomEvent.TrackUnsubscribed,
        (track: RemoteTrack, _publication: RemoteTrackPublication, participant: Participant) => {
          if (participant.isLocal) {
            return;
          }

          this.log("track.unsubscribed", {
            kind: track.kind,
            participant: participant.identity,
          });
          this.detachRemoteTrack(track as RemoteVideoTrack | RemoteAudioTrack);
        },
      )
      .on(RoomEvent.ConnectionStateChanged, (connectionState: ConnectionState) => {
        this.log("room.state", { state: connectionState });
        this.setState({
          debug: {
            ...this.state.debug,
            roomState: toRoomState(connectionState),
          },
        });

        if (connectionState === ConnectionState.Connected) {
          this.setState({
            status: this.state.isSpeaking ? "speaking" : "connected",
            isConnected: true,
            isLoading: false,
            connectionQuality: "good",
            error: null,
          });
          return;
        }

        if (
          connectionState === ConnectionState.Connecting ||
          connectionState === ConnectionState.Reconnecting
        ) {
          this.setState({
            status: "connecting",
            isLoading: true,
          });
          return;
        }

        if (connectionState === ConnectionState.Disconnected) {
          this.handleDisconnected();
        }
      })
      .on(RoomEvent.Disconnected, (_reason?: DisconnectReason) => {
        this.handleDisconnected();
      })
      .on(
        RoomEvent.DataReceived,
        (
          payload: Uint8Array,
          _participant?: Participant,
          _kind?: DataPacket_Kind,
          topic?: string,
        ) => {
          this.handleDataMessage(payload, topic);
        },
      );
  }

  private attachRemoteTrack(
    track: RemoteVideoTrack | RemoteAudioTrack,
    participant: Participant,
  ) {
    const trackKey = track.sid ?? track.mediaStreamTrack.id;

    if (track.kind === Track.Kind.Audio) {
      this.remoteAudioTracks.set(trackKey, track.mediaStreamTrack);
    }

    if (track.kind === Track.Kind.Video) {
      this.remoteVideoTracks.set(trackKey, track.mediaStreamTrack);
    }

    this.syncMediaStreams(participant);
  }

  private detachRemoteTrack(track: RemoteVideoTrack | RemoteAudioTrack) {
    const trackKey = track.sid ?? track.mediaStreamTrack.id;
    if (track.kind === Track.Kind.Audio) {
      this.remoteAudioTracks.delete(trackKey);
    }

    if (track.kind === Track.Kind.Video) {
      this.remoteVideoTracks.delete(trackKey);
    }

    this.syncMediaStreams();
  }

  private syncSubscribedTracks() {
    if (!this.room) {
      return;
    }

    for (const participant of this.room.remoteParticipants.values()) {
      for (const publication of participant.trackPublications.values()) {
        const track = publication.track;
        if (track && (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio)) {
          this.attachRemoteTrack(track as RemoteVideoTrack | RemoteAudioTrack, participant);
        }
      }
    }
  }

  private syncMediaStreams(participant?: Participant) {
    const videoStream =
      this.remoteVideoTracks.size > 0
        ? new MediaStream(Array.from(this.remoteVideoTracks.values()))
        : null;
    const audioStream =
      this.remoteAudioTracks.size > 0
        ? new MediaStream(Array.from(this.remoteAudioTracks.values()))
        : null;

    if (participant) {
      this.setState({
        debug: {
          ...this.state.debug,
          hasRemoteParticipant: true,
          remoteParticipantIdentity: participant.identity,
        },
      });
    }

    this.setState({
      videoStream,
      audioStream,
      isConnected:
        this.room?.state === ConnectionState.Connected &&
        (this.remoteVideoTracks.size > 0 || this.remoteAudioTracks.size > 0),
      connectionQuality:
        this.room?.state === ConnectionState.Connected
          ? "good"
          : this.state.connectionQuality,
      debug: {
        ...this.state.debug,
        remoteAudioSubscribed: this.remoteAudioTracks.size > 0,
        remoteVideoSubscribed: this.remoteVideoTracks.size > 0,
        remoteAudioTrackCount: this.remoteAudioTracks.size,
        remoteVideoTrackCount: this.remoteVideoTracks.size,
      },
    });
  }

  private handleDataMessage(payload: Uint8Array, topic?: string) {
    const decoded = this.textDecoder.decode(payload);
    const parsed = this.safeParseJson(decoded);
    if (!this.isRecord(parsed)) {
      return;
    }

    const eventType = this.extractLifecycleEventType(parsed);
    if (!eventType) {
      return;
    }

    if (eventType === "speech_started") {
      this.clearSpeakingFallback();
      this.setSpeaking(true);
      return;
    }

    if (eventType === "speech_stopped" || topic === "agent-status") {
      this.clearSpeakingFallback();
      this.setSpeaking(false);
    }
  }

  private extractLifecycleEventType(payload: Record<string, unknown>) {
    const values = [
      payload.type,
      payload.event,
      payload.name,
      payload.status,
      payload.action,
    ]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());

    if (typeof payload.is_speaking === "boolean") {
      return payload.is_speaking ? "speech_started" : "speech_stopped";
    }

    if (
      values.some((value) =>
        [
          "avatar.speech_started",
          "avatar.speak_started",
          "avatar.start_talking",
          "speech_started",
          "speak_started",
          "agent_response_started",
        ].includes(value),
      )
    ) {
      return "speech_started";
    }

    if (
      values.some((value) =>
        [
          "avatar.speech_stopped",
          "avatar.speak_stopped",
          "avatar.stop_talking",
          "speech_stopped",
          "speak_stopped",
          "agent_response_completed",
          "agent_interrupted",
        ].includes(value),
      )
    ) {
      return "speech_stopped";
    }

    return null;
  }

  private safeParseJson(value: string) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  private armSpeakingFallback(text: string) {
    this.clearSpeakingFallback();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.min(Math.max(wordCount * 420 + 1400, 2200), 16000);
    this.speakingTimeoutId = window.setTimeout(() => {
      this.setSpeaking(false);
      this.speakingTimeoutId = null;
    }, estimatedDuration);
  }

  private clearSpeakingFallback() {
    if (this.speakingTimeoutId !== null) {
      window.clearTimeout(this.speakingTimeoutId);
      this.speakingTimeoutId = null;
    }
  }

  private setSpeaking(isSpeaking: boolean) {
    this.setState({
      isSpeaking,
      status: isSpeaking ? "speaking" : this.state.isConnected ? "connected" : this.state.status,
    });
  }

  private handleDisconnected() {
    this.log("room.disconnected");
    this.clearSpeakingFallback();
    this.remoteAudioTracks.clear();
    this.remoteVideoTracks.clear();
    this.setState({
      status: "disconnected",
      isConnected: false,
      isLoading: false,
      isSpeaking: false,
      videoStream: null,
      audioStream: null,
      connectionQuality: "lost",
      debug: {
        ...INITIAL_DEBUG_STATE,
        roomState: "disconnected",
      },
    });
  }

  private disposeRoom() {
    this.clearSpeakingFallback();

    if (!this.room) {
      this.remoteAudioTracks.clear();
      this.remoteVideoTracks.clear();
      return;
    }

    if (this.room.state !== ConnectionState.Disconnected) {
      void this.room.disconnect();
    }

    this.remoteAudioTracks.clear();
    this.remoteVideoTracks.clear();
    this.room.removeAllListeners();
    this.room = null;
  }

  private resetState() {
    this.clearSpeakingFallback();
    this.remoteAudioTracks.clear();
    this.remoteVideoTracks.clear();
    this.setState({
      ...INITIAL_STATE,
    });
  }

  private log(event: string, payload?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.debug(`[LiveAvatar] ${event}`, payload ?? {});
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
