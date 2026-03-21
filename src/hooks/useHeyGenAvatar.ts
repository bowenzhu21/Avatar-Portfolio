"use client";

import { useEffect, useRef, useState } from "react";
import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import {
  type HeyGenAvatarState,
  type HeyGenCreateSessionOptions,
  sharedHeyGenAvatarClient,
} from "@/lib/heygen";

const INITIAL_HOOK_STATE: HeyGenAvatarState = {
  status: "idle",
  isLoading: false,
  isConnected: false,
  isSpeaking: false,
  mediaStream: null,
  session: null,
  connectionQuality: "unknown",
  error: null,
};

export function useHeyGenAvatar() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<HeyGenAvatarState>(INITIAL_HOOK_STATE);

  useEffect(() => {
    return sharedHeyGenAvatarClient.subscribe(setState);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (!state.mediaStream) {
      element.srcObject = null;
      return;
    }

    element.srcObject = state.mediaStream;

    const playPromise = element.play();
    if (playPromise) {
      playPromise.catch(() => {
        // TODO: Some browsers may still require a direct user gesture before autoplaying the remote stream with audio.
      });
    }
  }, [state.mediaStream]);

  async function createSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<StartAvatarResponse> {
    return sharedHeyGenAvatarClient.createSession(options);
  }

  async function startSession(): Promise<StartAvatarResponse> {
    return sharedHeyGenAvatarClient.startSession();
  }

  async function createAndStartSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<StartAvatarResponse> {
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
    createSession,
    startSession,
    createAndStartSession,
    stopSession,
    speak,
    interrupt,
  };
}
