"use client";

import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

const defaultPrompts = [
  "Show me Matrix",
  "Compare HeyGen and Momenta",
  "Open Bowen's resume",
  "What's the technical summary for Adapt UI?",
];

export function SuggestedPromptChips() {
  const setPartialTranscript = usePortfolioStore((state) => state.setPartialTranscript);
  const submitUtterance = usePortfolioStore((state) => state.submitUtterance);
  const followUpSuggestions = usePortfolioStore((state) => state.followUpSuggestions);
  const { stopListening } = useRealtimeSTT();
  const { unlockAudio } = useAvatarSpeech();
  const prompts = followUpSuggestions.length > 0 ? followUpSuggestions : defaultPrompts;

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/42">
        {followUpSuggestions.length === 0 ? "Try a voice prompt" : "Suggested follow-ups"}
      </p>
      <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => {
            void unlockAudio();
            void stopListening();
            setPartialTranscript("");
            submitUtterance(prompt, "chip");
          }}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-sand-100/80 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-sand-100"
        >
          {prompt}
        </button>
      ))}
      </div>
    </div>
  );
}
