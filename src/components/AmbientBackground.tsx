"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionPreference = EventTarget & { saveData?: boolean };

export function AmbientBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoVariant, setVideoVariant] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const smallScreen = window.matchMedia("(max-width: 767px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: ConnectionPreference }).connection;
    const update = () => setVideoVariant(
      reducedMotion.matches || connection?.saveData ? null : smallScreen.matches ? "mobile" : "desktop",
    );
    update();
    smallScreen.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      smallScreen.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let playPending = false;
    let gestureRequired = false;

    const updatePlayback = () => {
      if (disposed) return;
      if (document.hidden) {
        video.pause();
        return;
      }
      if (!video.paused || playPending) return;
      playPending = true;
      void video.play().then(() => {
        gestureRequired = false;
        if (disposed || document.hidden) video.pause();
      }).catch(() => {
        gestureRequired = true;
      }).finally(() => {
        playPending = false;
      });
    };
    const retryPlayback = () => {
      if (gestureRequired) updatePlayback();
    };
    updatePlayback();
    document.addEventListener("visibilitychange", updatePlayback);
    window.addEventListener("pointerup", retryPlayback, { passive: true });
    window.addEventListener("keydown", retryPlayback);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", updatePlayback);
      window.removeEventListener("pointerup", retryPlayback);
      window.removeEventListener("keydown", retryPlayback);
      video.pause();
    };
  }, [videoVariant]);

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[url('/background/bay-area-mobile-poster.webp')] bg-cover bg-center bg-no-repeat md:bg-[url('/background/bay-area-poster.webp')]"
      />
      {videoVariant ? (
        <video
          key={videoVariant}
          ref={videoRef}
          src={`/background/bay-area-${videoVariant}.mp4`}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster={videoVariant === "mobile" ? "/background/bay-area-mobile-poster.webp" : "/background/bay-area-poster.webp"}
          aria-hidden="true"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(rgba(15,18,21,0.25),rgba(15,18,21,0.2))]" />
    </>
  );
}
