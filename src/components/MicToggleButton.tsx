"use client";

import clsx from "clsx";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function MicToggleButton() {
  const { isListening, toggleListening, session, microphonePermission, error } =
    useRealtimeSTT();
  const { unlockAudio } = useHeyGenAvatar();
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const disabled = session.status === "connecting" || session.status === "token_loading";
  const permissionDenied = microphonePermission === "denied";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => {
          void unlockAudio();
          void toggleListening();
        }}
        disabled={disabled}
        className={clsx(
          "group panel-blur relative flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-300",
          isListening
            ? "border-cyan-300/70 bg-cyan-400/20 shadow-[0_0_40px_rgba(53,200,255,0.35)]"
            : "border-white/15 bg-white/8 hover:border-white/25 hover:bg-white/12",
          disabled && "cursor-not-allowed opacity-60",
          permissionDenied && "border-rose-300/35 bg-rose-300/10",
        )}
        aria-pressed={isListening}
        aria-label={isListening ? "Stop microphone" : "Start microphone"}
      >
        <span
          className={clsx(
            "absolute inset-0 rounded-full",
            isListening && "animate-ping bg-cyan-300/20",
          )}
        />
        <span className="relative text-2xl">
          {permissionDenied ? "!" : isListening ? "■" : "◉"}
        </span>
      </button>

      <p className="text-[11px] uppercase tracking-[0.32em] text-white/55">
        {isListening
          ? "Listening live"
          : interactionPhase === "thinking"
            ? "Routing intent"
            : interactionPhase === "speaking"
              ? "Avatar speaking"
              : "Tap to talk"}
      </p>

      {(permissionDenied || error) && (
        <div className="panel-blur max-w-xs rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-center text-xs text-rose-100">
          {permissionDenied
            ? "Microphone access is blocked. Enable permissions in your browser to continue."
            : error}
        </div>
      )}
    </div>
  );
}
