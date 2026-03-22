"use client";

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SubtitleBar() {
  const partialTranscript = usePortfolioStore((state) => state.partialTranscript);
  const latestUserUtterance = usePortfolioStore((state) => state.latestUserUtterance);
  const latestSpokenResponse = usePortfolioStore((state) => state.latestSpokenResponse);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const { isListening, error, microphonePermission } = useRealtimeSTT();

  const primaryText =
    (interactionPhase === "listening" && partialTranscript) ||
    (interactionPhase === "thinking" && "Thinking through that…") ||
    latestSpokenResponse ||
    "Chat with me";

  const supportingText =
    interactionPhase === "listening"
      ? "Live microphone input"
      : interactionPhase === "thinking" && latestUserUtterance
        ? `You asked: ${latestUserUtterance}`
        : interactionPhase === "speaking"
          ? "Bowen is responding"
          : null;

  return (
    <motion.div
      layout
      className="panel-blur relative mx-auto max-w-4xl overflow-hidden rounded-[1.9rem] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(246,239,232,0.56))] px-6 py-4 shadow-[0_18px_50px_rgba(140,119,99,0.14)] backdrop-blur-[18px]"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="flex items-center justify-center gap-3 text-sm md:text-[1.05rem]">
        <span
          className={clsx(
            "h-2.5 w-2.5 rounded-full transition-all duration-300",
            interactionPhase === "listening" &&
              "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]",
            interactionPhase === "thinking" &&
              "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.85)]",
            interactionPhase === "speaking" &&
              "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]",
            interactionPhase === "idle" && "bg-black/28",
          )}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${interactionPhase}-${primaryText}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="max-w-[48rem] text-center font-semibold leading-7 text-stone-950"
          >
            {primaryText}
          </motion.span>
        </AnimatePresence>
      </div>

      {supportingText ? (
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-stone-700">
          {supportingText}
        </p>
      ) : null}

      {(microphonePermission === "denied" || error) && (
        <p className="mt-3 text-center text-xs text-rose-700">
          {microphonePermission === "denied"
            ? "Microphone permission denied. Allow access to enable voice input."
            : error}
        </p>
      )}

      {!isListening && interactionPhase === "idle" ? (
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-stone-600">
          Ask about my projects, experiences, hobbies, etc.
        </p>
      ) : null}
    </motion.div>
  );
}
