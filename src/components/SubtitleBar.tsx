"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { stopRealtimeSTTListening } from "@/hooks/useRealtimeSTT";
import { usePromptFeedback } from "@/hooks/usePromptFeedback";
import { cancelPendingPortfolioPrompt, getPromptCancellationVersion } from "@/lib/prompt-request";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SubtitleBar() {
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submissionRef = useRef(false);
  const submissionVersionRef = useRef(0);

  useEffect(() => () => { submissionVersionRef.current += 1; }, []);
  const inputExpanded = usePromptFeedback((state) => state.inputExpanded);
  const setInputExpanded = usePromptFeedback((state) => state.setInputExpanded);
  const requestError = usePromptFeedback((state) => state.requestError);
  const failedPrompt = usePromptFeedback((state) => state.failedPrompt);
  const clearError = usePromptFeedback((state) => state.clearError);
  const cancellationVersion = usePromptFeedback((state) => state.cancellationVersion);
  useEffect(() => {
    submissionVersionRef.current += 1;
    submissionRef.current = false;
    setIsSubmitting(false);
  }, [cancellationVersion]);
  const submitUtterance = usePortfolioStore((state) => state.submitUtterance);
  const pendingUtterance = usePortfolioStore((state) => state.pendingUtterance);
  const latestSpokenResponse = usePortfolioStore((state) => state.latestSpokenResponse);
  const partialTranscript = usePortfolioStore((state) => state.partialTranscript);
  const latestUserUtterance = usePortfolioStore((state) => state.latestUserUtterance);
  const conversationHistory = usePortfolioStore((state) => state.conversationHistory);
  const isPending = Boolean(pendingUtterance) || isSubmitting;

  async function sendPrompt(value: string) {
    const prompt = value.trim();
    if (!prompt || submissionRef.current || usePortfolioStore.getState().pendingUtterance) {
      return;
    }

    submissionRef.current = true;
    const submissionVersion = ++submissionVersionRef.current;
    const cancellationVersion = getPromptCancellationVersion();
    setIsSubmitting(true);
    clearError();
    try {
      await stopRealtimeSTTListening({ discardTranscript: true });
      if (submissionVersion !== submissionVersionRef.current || cancellationVersion !== getPromptCancellationVersion()) return;
      submitUtterance(prompt, "text");
      setDraft("");
    } catch {
      if (submissionVersion !== submissionVersionRef.current || cancellationVersion !== getPromptCancellationVersion()) return;
      usePromptFeedback.getState().reportError("Couldn’t send that. Please try again.", prompt);
    } finally {
      if (submissionVersion === submissionVersionRef.current) {
        submissionRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt(draft);
  }

  function openInput() {
    setInputExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const previousPrompt = [...conversationHistory].reverse().find((turn) => turn.role === "user")?.text;
  const caption = partialTranscript || latestUserUtterance || previousPrompt;

  return (
    <section
      aria-label="Ask Bowen"
      className="panel-blur relative mx-auto w-full max-w-3xl rounded-[1.6rem] border border-white/30 bg-black/40 px-4 py-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-[8px] sm:px-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/65">
          Ask Bowen
        </p>
        <button
          type="button"
          onClick={inputExpanded ? () => setInputExpanded(false) : openInput}
          aria-expanded={inputExpanded}
          aria-controls="portfolio-prompt-form"
          className="-my-2 min-h-10 rounded-lg px-2 text-xs text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {inputExpanded ? "Close keyboard" : "Type instead"}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true" className="mt-1">
        {caption && (
          <p className="mb-1 truncate text-xs text-white/60" title={caption}>
            {caption}
          </p>
        )}
        <p className="text-sm font-medium leading-relaxed text-white/95 sm:text-[15px]">
          {isPending
            ? "Thinking…"
            : requestError
              ? "Let’s try that again."
              : latestSpokenResponse || "Projects, experience, or a little more about me."}
        </p>
        {isPending && (
          <button
            type="button"
            onClick={() => {
              submissionVersionRef.current += 1;
              submissionRef.current = false;
              setIsSubmitting(false);
              setDraft(pendingUtterance?.text ?? draft);
              cancelPendingPortfolioPrompt();
              void stopRealtimeSTTListening({ discardTranscript: true });
            }}
            className="mt-1 min-h-9 rounded-lg px-2 text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Cancel
          </button>
        )}
      </div>

      {inputExpanded && (
        <form
          id="portfolio-prompt-form"
          onSubmit={handleSubmit}
          className="mt-3 flex items-center gap-2 rounded-full border border-white/25 bg-white/10 p-1.5 focus-within:border-white/65"
          aria-busy={isPending}
        >
          <label htmlFor="portfolio-prompt" className="sr-only">Your question for Bowen</label>
          <input
            ref={inputRef}
            id="portfolio-prompt"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
            }}
            maxLength={600}
            autoComplete="off"
            placeholder="Show me ModelGate…"
            aria-describedby={requestError ? "portfolio-prompt-error" : "portfolio-prompt-hint"}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-white outline-none placeholder:text-white/65 sm:text-sm"
          />
          <button
            type="submit"
            disabled={isPending || !draft.trim()}
            aria-label={isPending ? "Waiting for a reply" : "Send question"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#3d3630] transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5m-6 6 6-6 6 6" />
            </svg>
          </button>
        </form>
      )}

      {requestError ? (
        <div id="portfolio-prompt-error" role="alert" className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-xs text-[#ffe2d4]">
          <span>{requestError}</span>
          {failedPrompt && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => void sendPrompt(failedPrompt)}
              className="min-h-10 rounded-lg px-2 font-semibold underline decoration-white/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40"
            >
              Try again
            </button>
          )}
        </div>
      ) : inputExpanded && (
        <p id="portfolio-prompt-hint" className="mt-2 pl-1 text-[10px] text-white/50">Quiet replies. No microphone needed.</p>
      )}
    </section>
  );
}
