"use client";

import clsx from "clsx";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function MicToggleButton() {
  const { isListening, toggleListening, session, microphonePermission, error } =
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
          "group panel-blur relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border transition-all duration-300 backdrop-blur-[0px]",
          isListening
            ? "border-cyan-200/44 bg-[linear-gradient(180deg,rgba(190,242,255,0.18),rgba(74,199,255,0.09))] shadow-[0_0_40px_rgba(53,200,255,0.18)]"
            : "border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(246,239,232,0.08))] shadow-[0_18px_40px_rgba(140,119,99,0.1)] hover:border-white/52 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(246,239,232,0.12))]",
          disabled && "cursor-not-allowed opacity-60",
          permissionDenied && "border-rose-200/42 bg-[linear-gradient(180deg,rgba(255,228,232,0.24),rgba(255,228,232,0.12))]",
        )}
        aria-pressed={isListening}
        aria-label={isListening ? "Stop microphone" : "Start microphone"}
      >
        <span className="pointer-events-none absolute inset-x-4 top-1 h-4 rounded-full bg-white/14 blur-xl" />
        <span
          className={clsx(
            "absolute inset-0 rounded-full",
            isListening && "animate-ping bg-cyan-300/20",
          )}
        />
        <span className="relative text-2xl text-white/95">
          {permissionDenied ? "!" : isListening ? "■" : "◉"}
        </span>
      </button>

      <p className="text-[11px] uppercase tracking-[0.32em] text-white/92">
        {isListening
          ? "Listening live"
          : interactionPhase === "thinking"
            ? "Routing intent"
            : interactionPhase === "speaking"
              ? "Bowen speaking"
              : "Tap to talk"}
      </p>

      {(permissionDenied || error) && (
        <div className="panel-blur max-w-xs rounded-2xl border border-rose-200/28 bg-rose-100/10 px-4 py-2 text-center text-xs text-rose-100">
          {permissionDenied
            ? "Microphone access is blocked. Enable permissions in your browser to continue."
            : error}
        </div>
      )}
    </div>
  );
}
