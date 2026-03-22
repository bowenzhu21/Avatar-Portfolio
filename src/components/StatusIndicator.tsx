"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const statusCopy = {
  default: "Default",
  recruiter: "Recruiter",
  technical: "Technical",
  concise: "Concise",
} as const;

export function StatusIndicator() {
  const mode = usePortfolioStore((state) => state.conversationMode);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const label =
    interactionPhase === "listening"
      ? "Mic live"
      : interactionPhase === "thinking"
        ? "Routing intent"
        : interactionPhase === "speaking"
          ? "Avatar speaking"
          : `${statusCopy[mode]} mode`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-panel premium-outline panel-blur inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] text-sand-200"
    >
      <motion.span
        className={clsx(
          "h-2.5 w-2.5 rounded-full transition-colors",
          interactionPhase === "idle" &&
            "bg-white/40",
          interactionPhase === "listening" &&
            "bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]",
          interactionPhase === "thinking" &&
            "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.8)]",
          interactionPhase === "speaking" &&
            "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]",
        )}
        animate={
          interactionPhase === "listening" ||
          interactionPhase === "thinking" ||
          interactionPhase === "speaking"
            ? { scale: [1, 1.25, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span>{label}</span>
    </motion.div>
  );
}
