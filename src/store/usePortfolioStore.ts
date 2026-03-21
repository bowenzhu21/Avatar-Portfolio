"use client";

import { create } from "zustand";
import type {
  CardType,
  ConversationMode,
  OrchestrationIntent,
  PortfolioEntity,
} from "@/types";

interface PortfolioState {
  activeRoute: string;
  activeCard: CardType;
  activeEntity: PortfolioEntity | null;
  activeSection: string | null;
  recentEntities: string[];
  followUpSuggestions: string[];
  conversationMode: ConversationMode;
  lastIntent: OrchestrationIntent | null;
  transcript: string;
  partialTranscript: string;
  responseText: string;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  isCardOpen: boolean;
  setActiveRoute: (route: string) => void;
  setActiveEntity: (entity: PortfolioEntity | null) => void;
  setActiveCard: (card: CardType) => void;
  setActiveSection: (section: string | null) => void;
  pushRecentEntity: (entityId: string) => void;
  setFollowUpSuggestions: (suggestions: string[]) => void;
  setLastIntent: (intent: OrchestrationIntent | null) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partialTranscript: string) => void;
  setResponseText: (responseText: string) => void;
  setConversationMode: (mode: ConversationMode) => void;
  setListening: (value: boolean) => void;
  setThinking: (value: boolean) => void;
  setSpeaking: (value: boolean) => void;
  toggleCard: () => void;
  openCard: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activeRoute: "/",
  activeCard: "overview",
  activeEntity: null,
  activeSection: null,
  recentEntities: [],
  followUpSuggestions: [],
  conversationMode: "default",
  lastIntent: null,
  transcript: "",
  partialTranscript: "",
  responseText: "",
  isListening: false,
  isThinking: false,
  isSpeaking: false,
  isCardOpen: true,
  setActiveRoute: (route) => set({ activeRoute: route }),
  setActiveEntity: (entity) => set({ activeEntity: entity }),
  setActiveCard: (card) => set({ activeCard: card }),
  setActiveSection: (section) => set({ activeSection: section }),
  pushRecentEntity: (entityId) =>
    set((state) => ({
      recentEntities: [entityId, ...state.recentEntities.filter((item) => item !== entityId)].slice(
        0,
        5,
      ),
    })),
  setFollowUpSuggestions: (followUpSuggestions) => set({ followUpSuggestions }),
  setLastIntent: (lastIntent) => set({ lastIntent }),
  setTranscript: (transcript) => set({ transcript }),
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),
  setResponseText: (responseText) => set({ responseText }),
  setConversationMode: (conversationMode) => set({ conversationMode }),
  setListening: (isListening) =>
    set({
      isListening,
      conversationMode: isListening ? "listening" : "default",
    }),
  setThinking: (isThinking) =>
    set({
      isThinking,
      conversationMode: isThinking ? "thinking" : "default",
    }),
  setSpeaking: (isSpeaking) =>
    set({
      isSpeaking,
      conversationMode: isSpeaking ? "speaking" : "default",
    }),
  toggleCard: () => set((state) => ({ isCardOpen: !state.isCardOpen })),
  openCard: () => set({ isCardOpen: true }),
}));
