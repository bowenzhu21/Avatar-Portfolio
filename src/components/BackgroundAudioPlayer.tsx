"use client";

import { useEffect, useRef } from "react";
import { getSpotifyTrackById } from "@/data/spotify";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function BackgroundAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const phoneApp = usePortfolioStore((state) => state.phoneScreen.app);
  const selectedSpotifyTrackId = usePortfolioStore((state) => state.selectedSpotifyTrackId);
  const isSpotifyPaused = usePortfolioStore((state) => state.isSpotifyPaused);
  const portfolioVolume = usePortfolioStore((state) => state.portfolioVolume);
  const activeTrack = getSpotifyTrackById(selectedSpotifyTrackId);
  const shouldPause = isSpotifyPaused || phoneApp === "phone" || interactionPhase !== "idle";
  const pauseIntentRef = useRef(shouldPause);
  pauseIntentRef.current = shouldPause;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.2 * portfolioVolume;
    }
  }, [portfolioVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let disposed = false;
    let playPending = false;
    let gestureRequired = false;

    async function reconcilePlayback() {
      if (disposed) return;
      if (shouldPause || document.hidden) {
        audio!.pause();
        return;
      }
      if (!audio!.paused || playPending) return;

      playPending = true;
      try {
        await audio!.play();
        gestureRequired = false;
        if (audioRef.current !== audio || document.hidden || pauseIntentRef.current) audio!.pause();
      } catch (error) {
        gestureRequired = error instanceof DOMException && error.name === "NotAllowedError";
      } finally {
        playPending = false;
      }
    }

    function handleUserGesture() {
      if (gestureRequired) void reconcilePlayback();
    }

    function pauseForPageExit() {
      audio!.pause();
    }

    void reconcilePlayback();
    document.addEventListener("visibilitychange", reconcilePlayback);
    window.addEventListener("pagehide", pauseForPageExit);
    window.addEventListener("pageshow", reconcilePlayback);
    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("keydown", handleUserGesture);

    return () => {
      disposed = true;
      audio.pause();
      document.removeEventListener("visibilitychange", reconcilePlayback);
      window.removeEventListener("pagehide", pauseForPageExit);
      window.removeEventListener("pageshow", reconcilePlayback);
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, [activeTrack.audioSrc, shouldPause]);

  return (
    <audio
      ref={audioRef}
      src={activeTrack.audioSrc}
      loop
      preload="none"
      aria-hidden="true"
      className="hidden"
    />
  );
}
