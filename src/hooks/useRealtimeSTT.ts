"use client";

import { useEffect, useRef, useState } from "react";
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
  const previousFinalTranscriptRef = useRef("");
  const beginListeningCycle = usePortfolioStore((store) => store.beginListeningCycle);
  const setPartialTranscript = usePortfolioStore((store) => store.setPartialTranscript);
  const submitUtterance = usePortfolioStore((store) => store.submitUtterance);
  const setInteractionPhase = usePortfolioStore((store) => store.setInteractionPhase);
  const interactionPhase = usePortfolioStore((store) => store.interactionPhase);

  useEffect(() => {
    return sharedRealtimeSTTClient.subscribe((nextState) => {
      setState(nextState);
      if (nextState.isListening) {
        setInteractionPhase("listening");
      } else if (interactionPhase === "listening") {
        setInteractionPhase("idle");
      }
      setPartialTranscript(nextState.partialTranscript);

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

  async function startListening() {
    beginListeningCycle();
    await sharedRealtimeSTTClient.startListening();
  }

  async function stopListening() {
    await sharedRealtimeSTTClient.stopListening();
  }

  async function toggleListening() {
    if (!state.isListening) {
      beginListeningCycle();
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
