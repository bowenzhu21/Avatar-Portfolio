"use client";

import { useEffect, useRef, useState } from "react";
import {
  type HeyGenAvatarSession,
  type HeyGenAvatarState,
  type HeyGenCreateSessionOptions,
  sharedHeyGenAvatarClient,
} from "@/lib/heygen";

const INITIAL_HOOK_STATE: HeyGenAvatarState = {
  status: "idle",
  isLoading: false,
  isConnected: false,
  isSpeaking: false,
  videoStream: null,
  audioStream: null,
  session: null,
  connectionQuality: "unknown",
  error: null,
  debug: {
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
  },
};

export function useHeyGenAvatar() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<HeyGenAvatarState>(INITIAL_HOOK_STATE);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    return sharedHeyGenAvatarClient.subscribe(setState);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    element.muted = true;

    if (!state.videoStream) {
      element.srcObject = null;
      return;
    }

    element.srcObject = state.videoStream;
    const playPromise = element.play();

    if (playPromise) {
      playPromise.catch(() => {
        // Browsers generally allow muted video autoplay; no UI intervention needed here.
      });
    }
  }, [state.videoStream]);

  useEffect(() => {
    const element = audioRef.current;
    sharedHeyGenAvatarClient.markAudioElementAttached(Boolean(element));

    if (!element) {
      return;
    }

    if (!state.audioStream) {
      element.srcObject = null;
      sharedHeyGenAvatarClient.markAudioPlaybackStatus("cleared");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.debug("[LiveAvatar] audio.element.attach", {
        audioTracks: state.audioStream.getAudioTracks().length,
      });
    }

    element.srcObject = state.audioStream;
    element.muted = false;
    element.autoplay = true;

    void attemptAudioPlayback();
  }, [state.audioStream]);

  async function attemptAudioPlayback() {
    const element = audioRef.current;
    if (!element || !element.srcObject) {
      return;
    }

    try {
      await element.play();
      setAudioUnlocked(true);
      sharedHeyGenAvatarClient.markAudioPlaybackStatus("started");

      if (process.env.NODE_ENV === "development") {
        console.debug("[LiveAvatar] audio.play.success");
      }
    } catch (error) {
      sharedHeyGenAvatarClient.markAudioPlaybackStatus("blocked");

      if (process.env.NODE_ENV === "development") {
        console.debug("[LiveAvatar] audio.play.failed", {
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }

  async function unlockAudio() {
    setAudioUnlocked(true);
    await attemptAudioPlayback();
  }

  async function createSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<HeyGenAvatarSession> {
    return sharedHeyGenAvatarClient.createSession(options);
  }

  async function startSession(): Promise<HeyGenAvatarSession> {
    return sharedHeyGenAvatarClient.startSession();
  }

  async function createAndStartSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<HeyGenAvatarSession> {
    return sharedHeyGenAvatarClient.createAndStartSession(options);
  }

  async function stopSession(): Promise<void> {
    await sharedHeyGenAvatarClient.stopSession();
  }

  async function speak(text: string): Promise<void> {
    await sharedHeyGenAvatarClient.speak(text);
  }

  async function interrupt(): Promise<void> {
    await sharedHeyGenAvatarClient.interrupt();
  }

  return {
    ...state,
    videoRef,
    audioRef,
    audioUnlocked,
    unlockAudio,
    createSession,
    startSession,
    createAndStartSession,
    stopSession,
    speak,
    interrupt,
  };
}
