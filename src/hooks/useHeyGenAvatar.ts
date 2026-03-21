"use client";

import { useEffect, useRef, useState } from "react";
import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import {
  type HeyGenAvatarState,
  HeyGenAvatarClient,
  type HeyGenCreateSessionOptions,
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
  const clientRef = useRef<HeyGenAvatarClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<HeyGenAvatarState>(INITIAL_HOOK_STATE);

  if (!clientRef.current) {
    clientRef.current = new HeyGenAvatarClient();
  }

  useEffect(() => {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    return client.subscribe(setState);
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

  useEffect(() => {
    return () => {
      const client = clientRef.current;
      if (!client) {
        return;
      }

      void client.stopSession().catch(() => undefined);
    };
  }, []);

  async function createSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<StartAvatarResponse> {
    const client = clientRef.current;

    if (!client) {
      throw new Error("HeyGen client is unavailable.");
    }

    return client.createSession(options);
  }

  async function startSession(): Promise<StartAvatarResponse> {
    const client = clientRef.current;

    if (!client) {
      throw new Error("HeyGen client is unavailable.");
    }

    return client.startSession();
  }

  async function createAndStartSession(
    options?: HeyGenCreateSessionOptions,
  ): Promise<StartAvatarResponse> {
    const client = clientRef.current;

    if (!client) {
      throw new Error("HeyGen client is unavailable.");
    }

    return client.createAndStartSession(options);
  }

  async function stopSession(): Promise<void> {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    await client.stopSession();
  }

  async function speak(text: string): Promise<void> {
    const client = clientRef.current;

    if (!client) {
      throw new Error("HeyGen client is unavailable.");
    }

    await client.speak(text);
  }

  async function interrupt(): Promise<void> {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    await client.interrupt();
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
