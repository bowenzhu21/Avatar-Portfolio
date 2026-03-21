"use client";

import clsx from "clsx";
import { avatarConfig } from "@/config/avatar";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";

const qualityLabels = {
  unknown: "Awaiting stream",
  excellent: "Excellent link",
  good: "Good link",
  poor: "Recovering link",
  lost: "Disconnected",
} as const;

export function AvatarStage() {
  const {
    videoRef,
    status,
    isLoading,
    isConnected,
    isSpeaking,
    error,
    connectionQuality,
    session,
    createAndStartSession,
    stopSession,
    interrupt,
  } = useHeyGenAvatar();

  const qualityLabel =
    qualityLabels[connectionQuality as keyof typeof qualityLabels] ??
    "Connection active";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid bg-[size:100%_100%,48px_48px,48px_48px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,17,28,0.1),rgba(4,7,13,0.72)_72%)]" />
      <div className="absolute left-[12%] top-[12%] h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[20%] left-[22%] h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <div className="relative h-[78vh] w-[52vh] max-w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 rounded-[2.5rem] border border-cyan-300/15" />
          <div className="absolute inset-x-[10%] top-[8%] h-10 rounded-full bg-white/8 blur-2xl" />
          <video
            ref={videoRef}
            className={clsx(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              isConnected ? "opacity-100" : "opacity-0",
            )}
            autoPlay
            playsInline
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(102,217,255,0.16),transparent_24%),linear-gradient(to_top,rgba(4,7,13,0.82),rgba(4,7,13,0.08)_48%,rgba(4,7,13,0.5))]" />

          <div className="absolute left-6 right-6 top-6 flex items-start justify-between gap-4">
            <div className="panel-blur rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-cyan-300">
              {avatarConfig.canvasLabel}
            </div>
            <div className="panel-blur rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-sand-100/80">
              {qualityLabel}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <div className="panel-blur rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-sm">
                  <p className="text-xs uppercase tracking-[0.38em] text-cyan-300">
                    HeyGen LiveAvatar
                  </p>
                  <p className="mt-3 font-display text-2xl text-sand-100">
                    {isConnected ? "Live stream connected" : "Avatar stage on standby"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-sand-200/70">
                    {isConnected
                      ? "The stream is attached and ready for narrated responses."
                      : "Initialize the HeyGen session to attach the live avatar stream to this stage."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!isConnected ? (
                    <button
                      type="button"
                      onClick={() => void createAndStartSession()}
                      disabled={isLoading}
                      className="rounded-full border border-cyan-300/35 bg-cyan-300/15 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Starting session..." : "Start avatar session"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void interrupt()}
                        disabled={!isSpeaking}
                        className="rounded-full border border-white/15 bg-white/6 px-4 py-3 text-sm text-sand-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Interrupt speech
                      </button>
                      <button
                        type="button"
                        onClick={() => void stopSession()}
                        className="rounded-full border border-white/15 bg-white/6 px-4 py-3 text-sm text-sand-100 transition hover:bg-white/10"
                      >
                        Stop session
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/65">
                  Status {status}
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/65">
                  Avatar {avatarConfig.avatarId}
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/65">
                  Context {avatarConfig.contextId}
                </span>
                {session?.session_id ? (
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/65">
                    Session {session.session_id.slice(0, 8)}
                  </span>
                ) : null}
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
