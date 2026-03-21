"use client";

import clsx from "clsx";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const statusCopy = {
  default: "Default",
  recruiter: "Recruiter",
  technical: "Technical",
  concise: "Concise",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
} as const;

export function StatusIndicator() {
  const mode = usePortfolioStore((state) => state.conversationMode);

  return (
    <div className="panel-blur inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sand-200">
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full transition-colors",
          (mode === "default" ||
            mode === "recruiter" ||
            mode === "technical" ||
            mode === "concise") &&
            "bg-white/40",
          mode === "listening" && "bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]",
          mode === "thinking" && "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.8)]",
          mode === "speaking" && "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]",
        )}
      />
      <span>{statusCopy[mode]}</span>
    </div>
  );
}
