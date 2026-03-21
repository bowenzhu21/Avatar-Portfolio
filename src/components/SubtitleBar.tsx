"use client";

import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SubtitleBar() {
  const transcript = usePortfolioStore((state) => state.transcript);
  const responseText = usePortfolioStore((state) => state.responseText);
  const text = responseText || transcript || "Ask about a project, experience, or section.";

  return (
    <div className="panel-blur mx-auto max-w-4xl rounded-2xl border border-white/10 bg-ink-950/70 px-6 py-4 text-center text-sm text-sand-100 shadow-panel md:text-base">
      {text}
    </div>
  );
}
