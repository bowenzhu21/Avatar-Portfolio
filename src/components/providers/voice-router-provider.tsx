"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { routeVoiceIntent } from "@/lib/orchestrator";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityByRoute } from "@/utils/portfolio";

export function VoiceRouterProvider() {
  const router = useRouter();
  const { lastFinalTranscript } = useRealtimeSTT();
  const lastHandledTranscriptRef = useRef("");
  const speakingTimeoutRef = useRef<number | null>(null);
  const activeRoute = usePortfolioStore((state) => state.activeRoute);
  const activeEntity = usePortfolioStore((state) => state.activeEntity);
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const recentEntities = usePortfolioStore((state) => state.recentEntities);
  const conversationMode = usePortfolioStore((state) => state.conversationMode);
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const setActiveCard = usePortfolioStore((state) => state.setActiveCard);
  const setFollowUpSuggestions = usePortfolioStore((state) => state.setFollowUpSuggestions);
  const setResponseText = usePortfolioStore((state) => state.setResponseText);
  const setPartialTranscript = usePortfolioStore((state) => state.setPartialTranscript);
  const setThinking = usePortfolioStore((state) => state.setThinking);
  const setSpeaking = usePortfolioStore((state) => state.setSpeaking);
  const openCard = usePortfolioStore((state) => state.openCard);
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);

  useEffect(() => {
    return () => {
      if (speakingTimeoutRef.current) {
        window.clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const transcript = lastFinalTranscript.trim();

    if (!transcript || transcript === lastHandledTranscriptRef.current) {
      return;
    }

    lastHandledTranscriptRef.current = transcript;

    const run = async () => {
      setThinking(true);
      setSpeaking(false);

      try {
        const result = await routeVoiceIntent({
          transcript,
          activeRoute,
          activeEntityId: activeEntity?.id ?? null,
          activeSection,
          recentEntities,
          conversationMode,
        });

        openCard();
        setActiveCard(result.card);
        setResponseText(result.spokenResponse);
        setFollowUpSuggestions(result.followUpSuggestions);
        setPartialTranscript("");

        const nextEntity =
          result.entity ?? (result.route ? getEntityByRoute(result.route) : null);

        setActiveEntity(nextEntity);
        setActiveSection(result.section);

        if (nextEntity) {
          pushRecentEntity(nextEntity.id);
        }

        if (result.route && result.route !== activeRoute) {
          setActiveRoute(result.route);
          router.push(result.route as Route);
        }

        setThinking(false);
        setSpeaking(true);

        if (speakingTimeoutRef.current) {
          window.clearTimeout(speakingTimeoutRef.current);
        }

        speakingTimeoutRef.current = window.setTimeout(() => {
          setSpeaking(false);
        }, Math.max(1800, Math.min(result.spokenResponse.length * 45, 6000)));
      } catch {
        setThinking(false);
        setSpeaking(false);
        setResponseText(
          "The voice router could not process that request. Try naming a project, role, or section again.",
        );
      }
    };

    void run();
  }, [
    activeEntity,
    activeRoute,
    activeSection,
    conversationMode,
    lastFinalTranscript,
    openCard,
    pushRecentEntity,
    recentEntities,
    router,
    setActiveCard,
    setActiveEntity,
    setActiveRoute,
    setActiveSection,
    setFollowUpSuggestions,
    setPartialTranscript,
    setResponseText,
    setSpeaking,
    setThinking,
  ]);

  return null;
}
