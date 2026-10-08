"use client";

import { usePromptFeedback } from "@/hooks/usePromptFeedback";
import { usePortfolioStore } from "@/store/usePortfolioStore";

let activeRequest: AbortController | null = null;

export function beginPromptRequest() {
  activeRequest?.abort();
  activeRequest = new AbortController();
  return activeRequest;
}

export function isActivePromptRequest(controller: AbortController) {
  return activeRequest === controller;
}

export function abortPromptRequest() {
  activeRequest?.abort();
  activeRequest = null;
}

export function getPromptCancellationVersion() {
  return usePromptFeedback.getState().cancellationVersion;
}

// Audio is a separate lifecycle: callers stop listening/playback when appropriate.
export function cancelPendingPortfolioPrompt() {
  abortPromptRequest();
  const state = usePortfolioStore.getState();
  if (state.pendingUtterance) state.acknowledgePendingUtterance(state.pendingUtterance.id);
  state.setInteractionPhase("idle");
  usePromptFeedback.getState().clearError();
  usePromptFeedback.setState((feedback) => ({ cancellationVersion: feedback.cancellationVersion + 1 }));
}
