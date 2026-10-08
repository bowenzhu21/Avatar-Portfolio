"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DeepgramRealtimeState,
  DeepgramRealtimeClient,
} from "@/lib/deepgram";
import { sharedAvatarSpeechClient } from "@/lib/avatar-speech";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const sharedRealtimeSTTClient = new DeepgramRealtimeClient();
let consumerCount = 0;
let discardFinalTranscript = false;
let unsubscribeStore: (() => void) | null = null;

// The shared transport commits each utterance once, regardless of how many
// controls subscribe to its state.
function connectStore() {
  let wasListening = false;
  return sharedRealtimeSTTClient.subscribe((nextState) => {
    const store = usePortfolioStore.getState();
    if (nextState.isListening && !wasListening && store.interactionPhase !== "thinking") {
      store.setInteractionPhase("listening");
    } else if (
      !nextState.isListening &&
      (nextState.session.status === "idle" || nextState.session.status === "error") &&
      store.interactionPhase === "listening"
    ) {
      store.setInteractionPhase("idle");
    }
    wasListening = nextState.isListening;

    if (store.partialTranscript !== nextState.partialTranscript) {
      store.setPartialTranscript(nextState.partialTranscript);
    }

    const finalTranscript = nextState.lastFinalTranscript.trim();
    if (finalTranscript) {
      sharedRealtimeSTTClient.clearCommittedTranscript();
      if (!discardFinalTranscript && !document.hidden) {
        store.submitUtterance(finalTranscript, "voice");
      }
    }
  });
}

function stopWhenHidden() {
  if (document.hidden) {
    discardFinalTranscript = true;
    void stopRealtimeSTTListening();
  }
}

function stopForPageExit() {
  discardFinalTranscript = true;
  void stopRealtimeSTTListening();
}

export async function stopRealtimeSTTListening(options: { discardTranscript?: boolean } = {}) {
  if (options.discardTranscript) discardFinalTranscript = true;
  await sharedRealtimeSTTClient.stopListening();
}

export function useRealtimeSTT() {
  const [state, setState] = useState<DeepgramRealtimeState>(() => sharedRealtimeSTTClient.getState());

  useEffect(() => {
    if (consumerCount++ === 0) {
      unsubscribeStore = connectStore();
      document.addEventListener("visibilitychange", stopWhenHidden);
      window.addEventListener("pagehide", stopForPageExit);
    }
    const unsubscribe = sharedRealtimeSTTClient.subscribe(setState);
    return () => {
      unsubscribe();
      if (--consumerCount === 0) {
        discardFinalTranscript = true;
        unsubscribeStore?.();
        unsubscribeStore = null;
        document.removeEventListener("visibilitychange", stopWhenHidden);
        window.removeEventListener("pagehide", stopForPageExit);
        void stopRealtimeSTTListening();
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    discardFinalTranscript = false;
    usePortfolioStore.getState().beginListeningCycle();
    await sharedAvatarSpeechClient.interrupt();
    if (document.hidden) {
      usePortfolioStore.getState().setInteractionPhase("idle");
      return;
    }
    await sharedRealtimeSTTClient.startListening();
  }, []);

  const stopListening = useCallback(() => stopRealtimeSTTListening(), []);

  const toggleListening = useCallback(async () => {
    const status = sharedRealtimeSTTClient.getState().session.status;
    if (status !== "idle" && status !== "error") {
      await stopRealtimeSTTListening();
      return;
    }
    await startListening();
  }, [startListening]);

  return { ...state, startListening, stopListening, toggleListening };
}
