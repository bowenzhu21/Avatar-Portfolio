"use client";

import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const defaultPrompts = [
  "Show me Matrix",
  "Compare HeyGen and Momenta",
  "Open Bowen's resume",
  "What's the technical summary for Adapt UI?",
];

export function SuggestedPromptChips() {
  const setTranscript = usePortfolioStore((state) => state.setTranscript);
  const setPartialTranscript = usePortfolioStore((state) => state.setPartialTranscript);
  const followUpSuggestions = usePortfolioStore((state) => state.followUpSuggestions);
  const { stopListening } = useRealtimeSTT();
  const prompts = followUpSuggestions.length > 0 ? followUpSuggestions : defaultPrompts;

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => {
            void stopListening();
            setPartialTranscript("");
            setTranscript(prompt);
          }}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-sand-100/80 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-sand-100"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
