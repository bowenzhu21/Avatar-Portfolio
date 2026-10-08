"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AvatarSpeechState,
  sharedAvatarSpeechClient,
} from "@/lib/avatar-speech";
import { usePortfolioStore } from "@/store/usePortfolioStore";

let consumerCount = 0;
function interruptWhenHidden() {
  if (document.hidden) void sharedAvatarSpeechClient.interrupt();
}
function interruptForPageExit() {
  void sharedAvatarSpeechClient.interrupt();
}

export function useAvatarSpeech() {
  const [state, setState] = useState<AvatarSpeechState>(() => sharedAvatarSpeechClient.getState());
  const portfolioVolume = usePortfolioStore((store) => store.portfolioVolume);

  useEffect(() => {
    const unsubscribe = sharedAvatarSpeechClient.subscribe(setState);
    if (consumerCount++ === 0) {
      document.addEventListener("visibilitychange", interruptWhenHidden);
      window.addEventListener("pagehide", interruptForPageExit);
    }
    return () => {
      unsubscribe();
      if (--consumerCount === 0) {
        document.removeEventListener("visibilitychange", interruptWhenHidden);
        window.removeEventListener("pagehide", interruptForPageExit);
        void sharedAvatarSpeechClient.interrupt();
      }
    };
  }, []);
  useEffect(() => {
    sharedAvatarSpeechClient.setOutputVolume(portfolioVolume);
  }, [portfolioVolume]);

  const unlockAudio = useCallback(() => sharedAvatarSpeechClient.unlockAudio(), []);
  const speak = useCallback((text: string) => sharedAvatarSpeechClient.speak(text), []);
  const interrupt = useCallback(() => sharedAvatarSpeechClient.interrupt(), []);

  return { ...state, unlockAudio, speak, interrupt };
}
