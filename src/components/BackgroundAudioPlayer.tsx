"use client";

import { useEffect, useRef } from "react";
import { getSpotifyTrackById } from "@/data/spotify";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function BackgroundAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsPlaybackRef = useRef(true);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const phoneApp = usePortfolioStore((state) => state.phoneScreen.app);
  const selectedSpotifyTrackId = usePortfolioStore((state) => state.selectedSpotifyTrackId);
  const isSpotifyPaused = usePortfolioStore((state) => state.isSpotifyPaused);
  const portfolioVolume = usePortfolioStore((state) => state.portfolioVolume);
  const activeTrack = getSpotifyTrackById(selectedSpotifyTrackId);
  const shouldPause = isSpotifyPaused || phoneApp === "phone" || interactionPhase !== "idle";

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = 0.2 * portfolioVolume;

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
  }, [activeTrack.audioSrc, portfolioVolume, shouldPause]);

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
  }, [activeTrack.audioSrc, shouldPause]);

  return (
    <audio
      ref={audioRef}
      src={activeTrack.audioSrc}
      loop
      preload="auto"
      aria-hidden="true"
      className="hidden"
    />
  );
}
