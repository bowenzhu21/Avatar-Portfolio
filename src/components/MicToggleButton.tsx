"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { usePromptFeedback } from "@/hooks/usePromptFeedback";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function MicToggleButton() {
  const { isListening, toggleListening, session, microphonePermission, error } = useRealtimeSTT();
  const { unlockAudio } = useAvatarSpeech();
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const pendingUtterance = usePortfolioStore((state) => state.pendingUtterance);
  const setInputExpanded = usePromptFeedback((state) => state.setInputExpanded);
  const isConnecting = session.status === "connecting" || session.status === "token_loading";
  const disabled = Boolean(pendingUtterance) && !isListening && !isConnecting;
  const permissionDenied = microphonePermission === "denied";

  useEffect(() => {
    if (permissionDenied || error) setInputExpanded(true);
  }, [permissionDenied, error, setInputExpanded]);

  const label = isConnecting
    ? "Connecting…"
    : isListening
      ? "Listening"
      : interactionPhase === "thinking"
        ? "Thinking…"
        : interactionPhase === "speaking"
          ? "Bowen is speaking"
          : "Tap to talk";

  return (
    <div className="flex flex-col items-center gap-2.5">
      <button
        type="button"
        onClick={() => {
          if (!isListening && !isConnecting) void unlockAudio();
          void toggleListening().catch(() => undefined);
        }}
        disabled={disabled}
        className={clsx(
          "group panel-blur relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-transparent sm:h-16 sm:w-16",
          isListening
            ? "border-cyan-200/60 bg-cyan-300/15 shadow-[0_0_35px_rgba(53,200,255,0.15)]"
            : "border-white/45 bg-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:border-white/70 hover:bg-white/25",
          disabled && "cursor-not-allowed opacity-50",
          permissionDenied && "border-rose-200/55",
        )}
        aria-pressed={isListening}
        aria-label={isConnecting ? "Cancel microphone setup" : isListening ? "Stop microphone" : error ? "Try microphone again" : "Start microphone"}
        aria-describedby={permissionDenied || error ? "microphone-feedback" : undefined}
      >
        {isListening || isConnecting ? (
          <span className="h-4 w-4 rounded-[4px] bg-white" aria-hidden="true" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-white" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
          </svg>
        )}
      </button>

      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/85" aria-live="polite">
        {label}
      </p>

      {(permissionDenied || error) && (
        <p id="microphone-feedback" role="status" className="max-w-xs text-center text-xs leading-relaxed text-white/80">
          {permissionDenied
            ? "Microphone access is blocked. You can type above."
            : "Voice is unavailable right now. Try again, or type above."}
        </p>
      )}
    </div>
  );
}
