"use client";

import clsx from "clsx";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SubtitleBar() {
  const transcript = usePortfolioStore((state) => state.transcript);
  const partialTranscript = usePortfolioStore((state) => state.partialTranscript);
  const responseText = usePortfolioStore((state) => state.responseText);
  const { isListening, error, microphonePermission } = useRealtimeSTT();
  const liveTranscript = [transcript, partialTranscript].filter(Boolean).join(" ").trim();
  const primaryText =
    (isListening ? liveTranscript : responseText) ||
    "Ask about a project, experience, or section.";
  const secondaryText =
    !isListening && transcript && responseText ? `You said: ${transcript}` : null;

  return (
    <div className="panel-blur mx-auto max-w-4xl rounded-2xl border border-white/10 bg-ink-950/70 px-6 py-4 text-center text-sm text-sand-100 shadow-panel md:text-base">
      <div className="flex items-center justify-center gap-3">
        <span
          className={clsx(
            "h-2 w-2 rounded-full",
            isListening ? "bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]" : "bg-white/25",
          )}
        />
        <span>{primaryText}</span>
      </div>
      {secondaryText ? <p className="mt-2 text-sm text-sand-200/75">{secondaryText}</p> : null}
      {(partialTranscript || isListening) && !error ? (
        <p className="mt-2 text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          {partialTranscript ? "Live partial transcript" : "Listening"}
        </p>
      ) : null}
      {(microphonePermission === "denied" || error) && (
        <p className="mt-2 text-xs text-rose-200">
          {microphonePermission === "denied"
            ? "Microphone permission denied. Allow access to enable voice input."
            : error}
        </p>
      )}
    </div>
  );
}
