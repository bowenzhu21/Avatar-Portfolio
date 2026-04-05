"use client";

import { motion } from "framer-motion";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";

export function SubtitleBar() {
  const { error, microphonePermission } = useRealtimeSTT();

  return (
    <motion.div
      layout
      className="panel-blur relative mx-auto max-w-4xl overflow-hidden rounded-[1.9rem] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(246,239,232,0.56))] px-6 py-4 shadow-[0_18px_50px_rgba(140,119,99,0.14)] backdrop-blur-[18px]"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-stone-700">
          Voice Prompt
        </p>
        <p className="mt-2 text-center text-sm font-semibold leading-7 text-stone-950 md:text-[1.05rem]">
          Ask about my projects, experience, resume, nutrition, fitness, and more.
        </p>
      </div>

      {(microphonePermission === "denied" || error) && (
        <p className="mt-3 text-center text-xs text-rose-700">
          {microphonePermission === "denied"
            ? "Microphone permission denied. Allow access to enable voice input."
            : error}
        </p>
      )}
    </motion.div>
  );
}
