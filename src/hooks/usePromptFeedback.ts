"use client";

import { create } from "zustand";

interface PromptFeedback {
  inputExpanded: boolean;
  requestError: string | null;
  failedPrompt: string | null;
  cancellationVersion: number;
  setInputExpanded: (expanded: boolean) => void;
  clearError: () => void;
  reportError: (message: string, prompt: string) => void;
}

export const usePromptFeedback = create<PromptFeedback>((set) => ({
  inputExpanded: false,
  requestError: null,
  failedPrompt: null,
  cancellationVersion: 0,
  setInputExpanded: (inputExpanded) => set({ inputExpanded }),
  clearError: () => set({ requestError: null, failedPrompt: null }),
  reportError: (requestError, failedPrompt) =>
    set({ requestError, failedPrompt, inputExpanded: true }),
}));
