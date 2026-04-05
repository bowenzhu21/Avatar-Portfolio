"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ElevenLabsRealtimeState,
  ElevenLabsRealtimeClient,
} from "@/lib/elevenlabs";
import { sharedAvatarSpeechClient } from "@/lib/avatar-speech";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const AVATAR_SILENCE_TIMEOUT_MS = 15_000;

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

const sharedRealtimeSTTClient = new ElevenLabsRealtimeClient();

export function useRealtimeSTT() {
  const [state, setState] = useState<ElevenLabsRealtimeState>(INITIAL_STATE);
  const [autoStoppedForSilence, setAutoStoppedForSilence] = useState(false);
  const previousFinalTranscriptRef = useRef("");
  const silenceTimeoutRef = useRef<number | null>(null);
  const lastAudioActivityRef = useRef<number>(0);
  const beginListeningCycle = usePortfolioStore((store) => store.beginListeningCycle);
  const setPartialTranscript = usePortfolioStore((store) => store.setPartialTranscript);
  const submitUtterance = usePortfolioStore((store) => store.submitUtterance);
  const setInteractionPhase = usePortfolioStore((store) => store.setInteractionPhase);
  const interactionPhase = usePortfolioStore((store) => store.interactionPhase);

  function clearSilenceTimeout() {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }

  function scheduleSilenceTimeout() {
    clearSilenceTimeout();

    if (!sharedRealtimeSTTClient.getState().isListening) {
      return;
    }

    const elapsed = Date.now() - lastAudioActivityRef.current;
    const remaining = Math.max(AVATAR_SILENCE_TIMEOUT_MS - elapsed, 0);

    silenceTimeoutRef.current = window.setTimeout(() => {
      if (!sharedRealtimeSTTClient.getState().isListening) {
        return;
      }

      setAutoStoppedForSilence(true);
      void sharedRealtimeSTTClient.stopListening();
    }, remaining);
  }

  useEffect(() => {
    return sharedRealtimeSTTClient.subscribe((nextState) => {
      setState(nextState);
      if (nextState.isListening) {
        setInteractionPhase("listening");
      } else if (interactionPhase === "listening") {
        setInteractionPhase("idle");
      }
      setPartialTranscript(nextState.partialTranscript);

      if (nextState.isListening) {
        if (
          !lastAudioActivityRef.current ||
          nextState.partialTranscript.trim() ||
          nextState.lastFinalTranscript.trim()
        ) {
          lastAudioActivityRef.current = Date.now();
        }
        scheduleSilenceTimeout();
      } else {
        clearSilenceTimeout();
      }

      const finalTranscript = nextState.lastFinalTranscript.trim();
      if (
        finalTranscript &&
        finalTranscript !== previousFinalTranscriptRef.current
      ) {
        previousFinalTranscriptRef.current = finalTranscript;
        submitUtterance(finalTranscript, "voice");
        sharedRealtimeSTTClient.clearCommittedTranscript();
      }

      if (!finalTranscript) {
        previousFinalTranscriptRef.current = "";
      }
    });
  }, [interactionPhase, setInteractionPhase, setPartialTranscript, submitUtterance]);

  useEffect(() => {
    return () => {
      clearSilenceTimeout();
    };
  }, []);

  async function startListening() {
    setAutoStoppedForSilence(false);
    lastAudioActivityRef.current = Date.now();
    beginListeningCycle();
    await sharedRealtimeSTTClient.startListening();
  }

  async function stopListening() {
    setAutoStoppedForSilence(false);
    clearSilenceTimeout();
    await sharedRealtimeSTTClient.stopListening();
  }

  async function toggleListening() {
    if (!state.isListening) {
      setAutoStoppedForSilence(false);
      lastAudioActivityRef.current = Date.now();
      beginListeningCycle();
      if (sharedAvatarSpeechClient.getState().isSpeaking) {
        await sharedAvatarSpeechClient.interrupt();
      }
    } else {
      setAutoStoppedForSilence(false);
      clearSilenceTimeout();
    }

    await sharedRealtimeSTTClient.toggleListening();
  }

  return {
    ...state,
    autoStoppedForSilence,
    startListening,
    stopListening,
    toggleListening,
  };
}
