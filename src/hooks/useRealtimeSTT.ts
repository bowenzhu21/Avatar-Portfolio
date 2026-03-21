"use client";

import { useEffect, useState } from "react";
import {
  type ElevenLabsRealtimeState,
  ElevenLabsRealtimeClient,
} from "@/lib/elevenlabs";
import { sharedHeyGenAvatarClient } from "@/lib/heygen";
import { usePortfolioStore } from "@/store/usePortfolioStore";

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
  const setListening = usePortfolioStore((store) => store.setListening);
  const setTranscript = usePortfolioStore((store) => store.setTranscript);
  const setPartialTranscript = usePortfolioStore((store) => store.setPartialTranscript);

  useEffect(() => {
    return sharedRealtimeSTTClient.subscribe((nextState) => {
      setState(nextState);
      setListening(nextState.isListening);
      setTranscript(nextState.transcript);
      setPartialTranscript(nextState.partialTranscript);
    });
  }, [setListening, setPartialTranscript, setTranscript]);

  async function startListening() {
    await sharedRealtimeSTTClient.startListening();
  }

  async function stopListening() {
    await sharedRealtimeSTTClient.stopListening();
  }

  async function toggleListening() {
    if (!state.isListening) {
      if (sharedHeyGenAvatarClient.getState().isSpeaking) {
        await sharedHeyGenAvatarClient.interrupt();
      }
    }

    await sharedRealtimeSTTClient.toggleListening();
  }

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
}
