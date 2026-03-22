"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";

export function AvatarStage() {
  const startedOnLoadRef = useRef(false);
  const {
    videoRef,
    audioRef,
    status,
    isConnected,
    createAndStartSession,
  } = useHeyGenAvatar();

  useEffect(() => {
    if (startedOnLoadRef.current) {
      return;
    }

    if (status !== "idle") {
      return;
    }

    startedOnLoadRef.current = true;
    void createAndStartSession().catch(() => {
      startedOnLoadRef.current = false;
    });
  }, [createAndStartSession, status]);

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[2.6rem] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.28))] shadow-[0_24px_70px_rgba(134,114,92,0.2)] backdrop-blur-[20px]">
      <div className="absolute left-6 top-5 z-20">
        <p className="text-xs uppercase tracking-[0.34em] text-stone-700">Bowen Zhu</p>
      </div>
      <video
        ref={videoRef}
        className={clsx(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          isConnected ? "opacity-100" : "opacity-0",
        )}
        autoPlay
        playsInline
        muted
      />
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(255,255,255,0.34),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(19,16,13,0.1)_62%,rgba(19,16,13,0.24)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#171310]/28 via-[#171310]/10 to-transparent" />

      {!isConnected ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 py-8">
          <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/72 px-4 py-2 text-sm text-stone-800 shadow-[0_12px_34px_rgba(140,119,99,0.14)] backdrop-blur-xl">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-stone-700" />
            <span>
              {status === "session_loading" || status === "session_created"
                ? "Connecting avatar…"
                : "Preparing avatar…"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
