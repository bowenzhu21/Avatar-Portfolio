"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionPreference = EventTarget & { saveData?: boolean };

export function AmbientBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canAnimate, setCanAnimate] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: ConnectionPreference }).connection;
    const update = () => setCanAnimate(wideScreen.matches && !reducedMotion.matches && !connection?.saveData);
    update();
    wideScreen.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      wideScreen.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updatePlayback = () => {
      if (document.hidden || paused) video.pause();
      else void video.play().catch(() => undefined);
    };
    updatePlayback();
    document.addEventListener("visibilitychange", updatePlayback);
    return () => {
      document.removeEventListener("visibilitychange", updatePlayback);
      video.pause();
    };
  }, [canAnimate, paused]);

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'linear-gradient(rgba(15,18,21,0.35),rgba(15,18,21,0.25)),url("/background.jpg")' }}
      />
      {canAnimate ? (
        <>
          <video
            ref={videoRef}
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
            loop
            muted
            playsInline
            preload="none"
            poster="/background.jpg"
            aria-hidden="true"
          >
            <source src="/background/portfolio-bg-web.mp4" type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            className="fixed bottom-3 right-4 z-20 min-h-9 rounded-full border border-white/15 bg-black/25 px-3 text-[11px] text-white/80 backdrop-blur-xl transition hover:bg-black/40"
          >
            {paused ? "Play scenery" : "Pause scenery"}
          </button>
        </>
      ) : null}
    </>
  );
}
