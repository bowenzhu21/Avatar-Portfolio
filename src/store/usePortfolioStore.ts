"use client";

import { create } from "zustand";
import type { CardType, ConversationMode, PortfolioEntity } from "@/types";

interface PortfolioState {
  activeRoute: string;
  activeCard: CardType;
  activeEntity: PortfolioEntity | null;
  activeSection: string | null;
  recentEntities: string[];
  conversationMode: ConversationMode;
  transcript: string;
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
  setTranscript: (transcript: string) => void;
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
  conversationMode: "idle",
  transcript: "",
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
  setTranscript: (transcript) => set({ transcript }),
  setResponseText: (responseText) => set({ responseText }),
  setConversationMode: (conversationMode) => set({ conversationMode }),
  setListening: (isListening) =>
    set({
      isListening,
      conversationMode: isListening ? "listening" : "idle",
    }),
  setThinking: (isThinking) =>
    set({
      isThinking,
      conversationMode: isThinking ? "thinking" : "idle",
    }),
  setSpeaking: (isSpeaking) =>
    set({
      isSpeaking,
      conversationMode: isSpeaking ? "speaking" : "idle",
    }),
  toggleCard: () => set((state) => ({ isCardOpen: !state.isCardOpen })),
  openCard: () => set({ isCardOpen: true }),
}));
