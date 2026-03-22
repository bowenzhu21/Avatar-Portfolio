"use client";

import { create } from "zustand";
import { derivePhoneScreen } from "@/utils/phone";
import type {
  CardType,
  ConversationMode,
  ConversationTurn,
  InteractionPhase,
  OrchestrationIntent,
  PhoneScreenState,
  PortfolioEntity,
  SubmittedUtterance,
  VoiceRouterInput,
  VoiceRouterOutput,
} from "@/types";

interface PortfolioState {
  activeRoute: string;
  activeCard: CardType;
  activeEntity: PortfolioEntity | null;
  activeSection: string | null;
  recentEntities: string[];
  followUpSuggestions: string[];
  conversationMode: ConversationMode;
  interactionPhase: InteractionPhase;
  lastIntent: OrchestrationIntent | null;
  partialTranscript: string;
  latestUserUtterance: string;
  latestSpokenResponse: string;
  pendingUtterance: SubmittedUtterance | null;
  conversationHistory: ConversationTurn[];
  phoneScreen: PhoneScreenState;
  latestRouterPayload: VoiceRouterInput | null;
  latestRouterResponse: VoiceRouterOutput | null;
  isCardOpen: boolean;
  setActiveRoute: (route: string) => void;
  setActiveEntity: (entity: PortfolioEntity | null) => void;
  setActiveCard: (card: CardType) => void;
  setActiveSection: (section: string | null) => void;
  pushRecentEntity: (entityId: string) => void;
  setFollowUpSuggestions: (suggestions: string[]) => void;
  setLastIntent: (intent: OrchestrationIntent | null) => void;
  setConversationMode: (mode: ConversationMode) => void;
  setInteractionPhase: (phase: InteractionPhase) => void;
  beginListeningCycle: () => void;
  setPartialTranscript: (partialTranscript: string) => void;
  submitUtterance: (text: string, source?: SubmittedUtterance["source"]) => SubmittedUtterance | null;
  acknowledgePendingUtterance: (utteranceId: string) => void;
  setLatestSpokenResponse: (responseText: string) => void;
  clearTurnCaption: () => void;
  setPhoneScreen: (screen: PhoneScreenState) => void;
  syncPhoneScreenFromRoute: (route: string, entity: PortfolioEntity | null, card?: CardType) => void;
  setLatestRouterPayload: (payload: VoiceRouterInput | null) => void;
  setLatestRouterResponse: (payload: VoiceRouterOutput | null) => void;
  toggleCard: () => void;
  openCard: () => void;
}

let utteranceCounter = 0;

function createTurnId(prefix: string) {
  utteranceCounter += 1;
  return `${prefix}-${utteranceCounter}`;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  activeRoute: "/",
  activeCard: "overview",
  activeEntity: null,
  activeSection: null,
  recentEntities: [],
  followUpSuggestions: [],
  conversationMode: "default",
  interactionPhase: "idle",
  lastIntent: null,
  partialTranscript: "",
  latestUserUtterance: "",
  latestSpokenResponse: "",
  pendingUtterance: null,
  conversationHistory: [],
  phoneScreen: derivePhoneScreen({ route: "/" }),
  latestRouterPayload: null,
  latestRouterResponse: null,
  isCardOpen: true,
  setActiveRoute: (route) => set({ activeRoute: route }),
  setActiveEntity: (entity) => set({ activeEntity: entity }),
  setActiveCard: (card) =>
    set((state) => ({
      activeCard: card,
      phoneScreen: {
        ...state.phoneScreen,
        card,
      },
    })),
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
  setConversationMode: (conversationMode) => set({ conversationMode }),
  setInteractionPhase: (interactionPhase) => set({ interactionPhase }),
  beginListeningCycle: () =>
    set({
      partialTranscript: "",
      latestUserUtterance: "",
      pendingUtterance: null,
      interactionPhase: "listening",
    }),
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),
  submitUtterance: (text, source = "voice") => {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    const pendingUtterance = {
      id: createTurnId("utterance"),
      text: trimmed,
      source,
    };

    set((state) => ({
      pendingUtterance,
      partialTranscript: "",
      latestUserUtterance: trimmed,
      latestSpokenResponse: "",
      interactionPhase: "thinking",
      conversationHistory: [
        ...state.conversationHistory,
        {
          id: createTurnId("user"),
          role: "user" as const,
          text: trimmed,
          timestamp: Date.now(),
        },
      ].slice(-12),
    }));

    return pendingUtterance;
  },
  acknowledgePendingUtterance: (utteranceId) =>
    set((state) => ({
      pendingUtterance:
        state.pendingUtterance?.id === utteranceId ? null : state.pendingUtterance,
    })),
  setLatestSpokenResponse: (latestSpokenResponse) =>
    set((state) => ({
      latestSpokenResponse,
      interactionPhase: latestSpokenResponse ? "speaking" : state.interactionPhase,
      conversationHistory: latestSpokenResponse
        ? [
            ...state.conversationHistory,
            {
              id: createTurnId("assistant"),
              role: "assistant" as const,
              text: latestSpokenResponse,
              timestamp: Date.now(),
            },
          ].slice(-12)
        : state.conversationHistory,
    })),
  clearTurnCaption: () =>
    set({
      partialTranscript: "",
      latestUserUtterance: "",
    }),
  setPhoneScreen: (phoneScreen) => set({ phoneScreen }),
  syncPhoneScreenFromRoute: (route, entity, card = get().activeCard) =>
    set({
      phoneScreen: derivePhoneScreen({
        route,
        entity,
        card,
      }),
    }),
  setLatestRouterPayload: (latestRouterPayload) => set({ latestRouterPayload }),
  setLatestRouterResponse: (latestRouterResponse) => set({ latestRouterResponse }),
  toggleCard: () => set((state) => ({ isCardOpen: !state.isCardOpen })),
  openCard: () => set({ isCardOpen: true }),
}));
