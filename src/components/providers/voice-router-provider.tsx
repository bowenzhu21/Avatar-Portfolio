"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { orchestrateWithGemini, routeVoiceIntent } from "@/lib/orchestrator";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityByRoute } from "@/utils/portfolio";

export function VoiceRouterProvider() {
  const router = useRouter();
  const {
    isSpeaking: isAvatarSpeaking,
    speak,
    interrupt,
    unlockAudio,
  } = useAvatarSpeech();
  const lastHandledUtteranceRef = useRef("");
  const pendingUtterance = usePortfolioStore((state) => state.pendingUtterance);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const activeRoute = usePortfolioStore((state) => state.activeRoute);
  const activeEntity = usePortfolioStore((state) => state.activeEntity);
  const activeCard = usePortfolioStore((state) => state.activeCard);
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const recentEntities = usePortfolioStore((state) => state.recentEntities);
  const conversationMode = usePortfolioStore((state) => state.conversationMode);
  const lastIntent = usePortfolioStore((state) => state.lastIntent);
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const setActiveCard = usePortfolioStore((state) => state.setActiveCard);
  const setFollowUpSuggestions = usePortfolioStore((state) => state.setFollowUpSuggestions);
  const setLastIntent = usePortfolioStore((state) => state.setLastIntent);
  const setConversationMode = usePortfolioStore((state) => state.setConversationMode);
  const setInteractionPhase = usePortfolioStore((state) => state.setInteractionPhase);
  const setLatestSpokenResponse = usePortfolioStore((state) => state.setLatestSpokenResponse);
  const setLatestRouterPayload = usePortfolioStore((state) => state.setLatestRouterPayload);
  const setLatestRouterResponse = usePortfolioStore((state) => state.setLatestRouterResponse);
  const acknowledgePendingUtterance = usePortfolioStore(
    (state) => state.acknowledgePendingUtterance,
  );
  const clearTurnCaption = usePortfolioStore((state) => state.clearTurnCaption);
  const openCard = usePortfolioStore((state) => state.openCard);
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);
  const syncPhoneScreenFromRoute = usePortfolioStore((state) => state.syncPhoneScreenFromRoute);

  useEffect(() => {
    if (isAvatarSpeaking) {
      setInteractionPhase("speaking");
    } else if (interactionPhase === "speaking") {
      setInteractionPhase("idle");
    }
  }, [interactionPhase, isAvatarSpeaking, setInteractionPhase]);

  useEffect(() => {
    const utterance = pendingUtterance;
    if (!utterance || utterance.id === lastHandledUtteranceRef.current) {
      return;
    }

    lastHandledUtteranceRef.current = utterance.id;

    const run = async () => {
      const transcript = utterance.text.trim();
      const payload = {
        transcript,
        activeRoute,
        activeEntityId: activeEntity?.id ?? null,
        activeCard,
        activeSection,
        recentEntities,
        conversationMode,
        lastIntent,
      } as const;

      await interrupt();
      setInteractionPhase("thinking");
      setLatestRouterPayload(payload);
      setLatestSpokenResponse("");

      try {
        const result = await routeVoiceIntent(payload);
        setLatestRouterResponse(result);

        openCard();
        setActiveCard(result.card);
        setLastIntent(result.intent);
        setFollowUpSuggestions(result.followUpSuggestions);

        if (/\b(recruiter|hiring manager)\b/i.test(transcript)) {
          setConversationMode("recruiter");
        } else if (/\b(technical|backend|architecture|deeper)\b/i.test(transcript)) {
          setConversationMode("technical");
        } else if (/\b(concise|brief|shorter)\b/i.test(transcript)) {
          setConversationMode("concise");
        }

        const nextEntity =
          result.entity ?? (result.route ? getEntityByRoute(result.route) : null);

        setActiveEntity(nextEntity);
        setActiveSection(result.section);

        if (nextEntity) {
          pushRecentEntity(nextEntity.id);
        }

        if (result.route && result.route !== activeRoute) {
          setActiveRoute(result.route);
          syncPhoneScreenFromRoute(result.route, nextEntity, result.card);
          router.push(result.route as Route);
        } else {
          syncPhoneScreenFromRoute(activeRoute, nextEntity ?? activeEntity, result.card);
        }

        const narration = await orchestrateWithGemini({
          input: payload,
          routerResult: result,
        }).catch(() => ({
          spokenResponse: result.spokenResponse,
        }));
        const conciseResponse = narration.spokenResponse
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 320);

        acknowledgePendingUtterance(utterance.id);
        clearTurnCaption();
        setLatestSpokenResponse(conciseResponse);

        if (conciseResponse) {
          await unlockAudio();
          await speak(conciseResponse);
        } else {
          setInteractionPhase("idle");
        }
      } catch {
        acknowledgePendingUtterance(utterance.id);
        setInteractionPhase("idle");
        setLatestSpokenResponse(
          "I couldn’t route that cleanly. Try naming a project, role, or section again.",
        );
      }
    };

    void run();
  }, [
    acknowledgePendingUtterance,
    activeCard,
    activeEntity,
    activeRoute,
    activeSection,
    interrupt,
    clearTurnCaption,
    conversationMode,
    lastIntent,
    openCard,
    pendingUtterance,
    pushRecentEntity,
    recentEntities,
    router,
    setActiveCard,
    setActiveEntity,
    setActiveRoute,
    setActiveSection,
    setConversationMode,
    setFollowUpSuggestions,
    setInteractionPhase,
    setLastIntent,
    setLatestRouterPayload,
    setLatestRouterResponse,
    setLatestSpokenResponse,
    speak,
    syncPhoneScreenFromRoute,
    unlockAudio,
  ]);

  return null;
}
