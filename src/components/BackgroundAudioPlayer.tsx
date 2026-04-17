"use client";

import { useEffect, useRef } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function BackgroundAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsPlaybackRef = useRef(true);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const phoneApp = usePortfolioStore((state) => state.phoneScreen.app);
  const shouldPause = phoneApp === "phone" || interactionPhase !== "idle";

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 0.18;

    async function attemptPlayback() {
      if (!audioRef.current || shouldPause) {
        return;
      }

      try {
        await audioRef.current.play();
        wantsPlaybackRef.current = true;
      } catch {
        wantsPlaybackRef.current = true;
      }
    }

    function handleUserGesture() {
      if (wantsPlaybackRef.current) {
        void attemptPlayback();
      }
    }

    void attemptPlayback();
    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("keydown", handleUserGesture);

    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, [shouldPause]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (shouldPause) {
      if (!audio.paused) {
        audio.pause();
      }
      return;
    }

    if (wantsPlaybackRef.current) {
      void audio.play().catch(() => undefined);
    }
  }, [shouldPause]);

  return (
    <audio
      ref={audioRef}
      loop
      preload="metadata"
      aria-hidden="true"
      className="hidden"
    >
      <source src="/background/california.mp4" type="audio/mp4" />
    </audio>
  );
}
