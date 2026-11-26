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
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const isPending = Boolean(pendingUtterance) || isSubmitting;
  const liveTranscript = interactionPhase === "listening" ? partialTranscript : "";
  const hasMessage = Boolean(isPending || liveTranscript || (!requestError && latestSpokenResponse));
  const hasFeedback = hasMessage || Boolean(requestError);

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

  const inputToggle = (
    <button
      type="button"
      onClick={inputExpanded ? () => setInputExpanded(false) : openInput}
      aria-label={inputExpanded ? "Close keyboard" : "Type a question"}
      title={inputExpanded ? "Close keyboard" : "Type a question"}
      aria-expanded={inputExpanded}
      aria-controls="portfolio-prompt-form"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {inputExpanded ? <path d="m6 6 12 12M18 6 6 18" /> : (
          <>
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 15h10" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <section
      aria-label="Ask Bowen"
      className={`panel-blur relative mx-auto border border-white/25 bg-black/35 text-white shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-[8px] ${hasFeedback || inputExpanded ? "w-full max-w-3xl rounded-[1.4rem] p-3 sm:p-4" : "w-fit rounded-full p-1"}`}
    >
      {(hasMessage || !inputExpanded) && (
        <div className="flex items-start gap-2">
          {hasMessage && (
            <div aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 px-1 py-2">
              {liveTranscript && (
                <p className="mb-1 text-xs leading-relaxed text-white/60">{liveTranscript}</p>
              )}
              {(isPending || (!requestError && latestSpokenResponse)) && (
                <p className="text-sm font-medium leading-relaxed text-white/95 sm:text-[15px]">
                  {isPending ? "Thinking…" : latestSpokenResponse}
                </p>
              )}
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
          )}
          {inputToggle}
        </div>
      )}

      {inputExpanded && (
        <form
          id="portfolio-prompt-form"
          onSubmit={handleSubmit}
          className={`${hasMessage ? "mt-2 " : ""}flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.07] p-1 focus-within:border-white/55`}
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
            placeholder="Ask me…"
            aria-describedby={requestError ? "portfolio-prompt-error" : undefined}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-white outline-none focus-visible:outline-none placeholder:text-white/65 sm:text-sm"
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
          {!hasMessage && inputToggle}
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
      ) : null}
    </section>
  );
}
