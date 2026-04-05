"use client";

import clsx from "clsx";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function MicToggleButton() {
  const {
    isListening,
    toggleListening,
    session,
    microphonePermission,
    error,
    autoStoppedForSilence,
  } =
    useRealtimeSTT();
  const { unlockAudio } = useAvatarSpeech();
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
            ? "border-cyan-500/45 bg-cyan-200/55 shadow-[0_0_40px_rgba(53,200,255,0.18)]"
            : "border-black/8 bg-white/78 shadow-[0_18px_40px_rgba(140,119,99,0.16)] hover:border-black/12 hover:bg-white/92",
          disabled && "cursor-not-allowed opacity-60",
          permissionDenied && "border-rose-300/35 bg-rose-100",
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

      <p className="text-[11px] uppercase tracking-[0.32em] text-white">
        {isListening
          ? "Listening live"
          : autoStoppedForSilence
            ? "Mic paused"
          : interactionPhase === "thinking"
            ? "Routing intent"
            : interactionPhase === "speaking"
              ? "Bowen speaking"
              : "Tap to talk"}
      </p>

      {(permissionDenied || error || autoStoppedForSilence) && (
        <div className="panel-blur max-w-xs rounded-2xl border border-rose-300/25 bg-rose-50 px-4 py-2 text-center text-xs text-rose-700">
          {permissionDenied
            ? "Microphone access is blocked. Enable permissions in your browser to continue."
            : autoStoppedForSilence
              ? "Mic stopped after silence to save voice credits. Tap to listen again."
              : error}
        </div>
      )}
    </div>
  );
}
