"use client";

import { useEffect, useState } from "react";
import {
  type AvatarSpeechState,
  sharedAvatarSpeechClient,
} from "@/lib/avatar-speech";

const INITIAL_STATE: AvatarSpeechState = {
  status: "idle",
  isSpeaking: false,
  isAudioUnlocked: false,
  currentText: "",
  audioLevel: 0,
  provider: null,
  error: null,
};

export function useAvatarSpeech() {
  const [state, setState] = useState<AvatarSpeechState>(INITIAL_STATE);

  useEffect(() => sharedAvatarSpeechClient.subscribe(setState), []);

  return {
    ...state,
    unlockAudio: () => sharedAvatarSpeechClient.unlockAudio(),
    speak: (text: string) => sharedAvatarSpeechClient.speak(text),
    interrupt: () => sharedAvatarSpeechClient.interrupt(),
  };
}
