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
    isLoading,
    isConnected,
    error,
    audioUnlocked,
    unlockAudio,
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
    <div className="absolute inset-0 overflow-hidden bg-[#04070d]">
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

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(36,212,255,0.18),transparent_26%),radial-gradient(circle_at_80%_16%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(4,7,13,0.18),rgba(4,7,13,0.46)_58%,rgba(4,7,13,0.82)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[46vh] bg-gradient-to-t from-[#02050b] via-[#02050b]/55 to-transparent" />

      {!isConnected ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="panel-blur w-full max-w-2xl rounded-[2.4rem] border border-white/12 bg-[linear-gradient(180deg,rgba(8,12,18,0.7),rgba(8,12,18,0.45))] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.38)]">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/88">
              HeyGen LiveAvatar
            </p>
            <h1 className="mt-4 font-display text-4xl leading-none text-sand-100 md:text-5xl">
              Full-screen avatar stage on standby
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-sand-200/72 md:text-base">
              The avatar begins connecting as soon as the page opens. If audio is blocked by the
              browser, use the audio unlock button once and the stream will take over the scene.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  await unlockAudio();
                  await createAndStartSession();
                }}
                disabled={isLoading}
                className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/22 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Starting session..." : "Start avatar session"}
              </button>
              {!audioUnlocked ? (
                <button
                  type="button"
                  onClick={() => void unlockAudio()}
                  className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm text-sand-100 transition hover:bg-white/12"
                >
                  Enable audio
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
