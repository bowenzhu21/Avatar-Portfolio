"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { routeVoiceIntent } from "@/lib/orchestrator";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityByRoute } from "@/utils/portfolio";

export function VoiceRouterProvider() {
  const router = useRouter();
  const { lastFinalTranscript } = useRealtimeSTT();
  const {
    isConnected: isAvatarConnected,
    isSpeaking: isAvatarSpeaking,
    createAndStartSession,
    speak,
  } = useHeyGenAvatar();
  const lastHandledTranscriptRef = useRef("");
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
  const setResponseText = usePortfolioStore((state) => state.setResponseText);
  const setPartialTranscript = usePortfolioStore((state) => state.setPartialTranscript);
  const setThinking = usePortfolioStore((state) => state.setThinking);
  const setSpeaking = usePortfolioStore((state) => state.setSpeaking);
  const openCard = usePortfolioStore((state) => state.openCard);
  const pushRecentEntity = usePortfolioStore((state) => state.pushRecentEntity);

  useEffect(() => {
    setSpeaking(isAvatarSpeaking);
  }, [isAvatarSpeaking, setSpeaking]);

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
          activeCard,
          activeSection,
          recentEntities,
          conversationMode,
          lastIntent,
        });

        openCard();
        setActiveCard(result.card);
        setLastIntent(result.intent);
        setResponseText(result.spokenResponse);
        setFollowUpSuggestions(result.followUpSuggestions);
        setPartialTranscript("");

        if (/\b(recruiter|hiring manager)\b/i.test(transcript)) {
          setConversationMode("recruiter");
        } else if (/\b(technical|backend|architecture|deeper)\b/i.test(transcript)) {
          setConversationMode("technical");
        } else if (/\b(concise|brief|shorter)\b/i.test(transcript)) {
          setConversationMode("concise");
        } else if (conversationMode === "default") {
          setConversationMode("default");
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
          router.push(result.route as Route);
        }

        setThinking(false);
        if (!isAvatarConnected) {
          await createAndStartSession();
        }

        const conciseResponse = result.spokenResponse
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 240);

        if (conciseResponse) {
          await speak(conciseResponse);
        }
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
    activeCard,
    activeRoute,
    activeSection,
    conversationMode,
    createAndStartSession,
    isAvatarConnected,
    lastFinalTranscript,
    lastIntent,
    openCard,
    pushRecentEntity,
    recentEntities,
    router,
    setActiveCard,
    setActiveEntity,
    setActiveRoute,
    setActiveSection,
    setConversationMode,
    setFollowUpSuggestions,
    setLastIntent,
    setPartialTranscript,
    setResponseText,
    setSpeaking,
    setThinking,
    speak,
  ]);

  return null;
}
