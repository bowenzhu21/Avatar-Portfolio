"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  findSpotifyTrackByQuery,
  getNextSpotifyTrackId,
  getSpotifyTrackById,
  spotifyTracks,
} from "@/data/spotify";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { stopRealtimeSTTListening } from "@/hooks/useRealtimeSTT";
import { orchestrateWithGemini, routeVoiceIntent } from "@/lib/orchestrator";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { getEntityByRoute } from "@/utils/portfolio";

type SpotifyVoiceCommand =
  | {
      kind: "play_track" | "next_track" | "resume" | "pause" | "unknown_track";
      responseText: string;
      trackId?: string;
      shouldPause?: boolean;
      followUpSuggestions: string[];
    };

const deterministicAppRoutes = new Set([
  "/",
  "/phone",
  "/messages",
  "/safari",
  "/spotify",
  "/settings",
  "/projects",
  "/primitives",
  "/experience",
]);

function normalizeVoiceCommand(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericSpotifyTrackSwitchRequest(normalizedTranscript: string) {
  return (
    /\b(?:switch|change)\b(?:\s+\w+){0,4}\s+\b(?:song|songs|sogn|sogns|track|tracks|music|tune|tunes)\b/.test(
      normalizedTranscript,
    ) ||
    /\b(?:play|put on|listen to)\b(?:\s+\w+){0,4}\s+\b(?:another|different|new)\b(?:\s+\w+){0,3}\s+\b(?:song|songs|sogn|sogns|track|tracks|music|tune|tunes)\b/.test(
      normalizedTranscript,
    ) ||
    /\b(?:another|different|new)\b(?:\s+\w+){0,3}\s+\b(?:song|songs|sogn|sogns|track|tracks|music|tune|tunes)\b/.test(
      normalizedTranscript,
    )
  );
}

function extractSpotifyTrackRequest(transcript: string) {
  const patterns = [
    /(?:play|put on|listen to)\s+(.+)$/i,
    /(?:switch|change)\s+(?:the\s+)?(?:song|songs|track|tracks|music|tune|tunes)?\s*(?:to)?\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    const target = match?.[1]
      ?.replace(/\b(?:please|for me|right now|next)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (target) {
      return target;
    }
  }

  return null;
}

function buildSpotifySuggestions(excludeTrackId?: string) {
  return spotifyTracks
    .filter((track) => track.id !== excludeTrackId)
    .slice(0, 3)
    .map((track) => `Play ${track.title}`);
}

function detectSpotifyVoiceCommand(args: {
  transcript: string;
  currentTrackId: string;
  isSpotifyPaused: boolean;
}): SpotifyVoiceCommand | null {
  const normalized = normalizeVoiceCommand(args.transcript);
  const mentionsMusic = /\b(song|songs|sogn|sogns|track|tracks|music|spotify|playlist|tune|tunes)\b/.test(
    normalized,
  );
  const currentTrack = getSpotifyTrackById(args.currentTrackId);
  const requestedTrackText = extractSpotifyTrackRequest(args.transcript);
  const isGenericTrackSwitchRequest = isGenericSpotifyTrackSwitchRequest(normalized);
  const matchedTrack = requestedTrackText
    ? findSpotifyTrackByQuery(requestedTrackText) ?? findSpotifyTrackByQuery(args.transcript)
    : findSpotifyTrackByQuery(args.transcript);
  const usesMusicSpecificVerb = /\b(put on|listen to)\b/i.test(args.transcript);

  if (
    requestedTrackText &&
    matchedTrack &&
    (mentionsMusic || /\b(play|put on|listen to|switch|change)\b/.test(normalized))
  ) {
    return {
      kind: "play_track",
      trackId: matchedTrack.id,
      shouldPause: false,
      responseText:
        matchedTrack.id === currentTrack.id && !args.isSpotifyPaused
          ? `${matchedTrack.title} by ${matchedTrack.artist} is already playing.`
          : `Switching to ${matchedTrack.title} by ${matchedTrack.artist}.`,
      followUpSuggestions: [
        "Pause music",
        "Change the song",
        ...buildSpotifySuggestions(matchedTrack.id).slice(0, 2),
      ],
    };
  }

  if (
    matchedTrack &&
    /\bplay\b/.test(normalized) &&
    !/\b(play music|play some music)\b/.test(normalized)
  ) {
    return {
      kind: "play_track",
      trackId: matchedTrack.id,
      shouldPause: false,
      responseText:
        matchedTrack.id === currentTrack.id && !args.isSpotifyPaused
          ? `${matchedTrack.title} by ${matchedTrack.artist} is already playing.`
          : `Switching to ${matchedTrack.title} by ${matchedTrack.artist}.`,
      followUpSuggestions: [
        "Pause music",
        "Change the song",
        ...buildSpotifySuggestions(matchedTrack.id).slice(0, 2),
      ],
    };
  }

  if (
    requestedTrackText &&
    !matchedTrack &&
    !isGenericTrackSwitchRequest &&
    (mentionsMusic || usesMusicSpecificVerb)
  ) {
    return {
      kind: "unknown_track",
      responseText: `I couldn't find that in my playlist. Try ${spotifyTracks
        .slice(0, 3)
        .map((track) => track.title)
        .join(", ")}.`,
      followUpSuggestions: buildSpotifySuggestions().slice(0, 3),
    };
  }

  if (
    isGenericTrackSwitchRequest ||
    (mentionsMusic &&
      (/\b(next|another|different|new)\b/.test(normalized) ||
        /\b(change|switch)\b/.test(normalized)))
  ) {
    const nextTrack = getSpotifyTrackById(getNextSpotifyTrackId(args.currentTrackId));

    return {
      kind: "next_track",
      trackId: nextTrack.id,
      shouldPause: false,
      responseText: `Switching to ${nextTrack.title} by ${nextTrack.artist}.`,
      followUpSuggestions: [
        "Pause music",
        ...buildSpotifySuggestions(nextTrack.id).slice(0, 2),
      ],
    };
  }

  if (mentionsMusic && /\b(pause|stop|mute)\b/.test(normalized)) {
    return {
      kind: "pause",
      shouldPause: true,
      responseText: args.isSpotifyPaused ? "Music is already paused." : "Pausing the music.",
      followUpSuggestions: [
        "Resume music",
        "Change the song",
        `Play ${currentTrack.title}`,
      ],
    };
  }

  if (
    (mentionsMusic && /\b(resume|unpause)\b/.test(normalized)) ||
    /\b(play music|play some music|start the music)\b/.test(normalized)
  ) {
    return {
      kind: "resume",
      shouldPause: false,
      responseText: args.isSpotifyPaused
        ? `Resuming ${currentTrack.title} by ${currentTrack.artist}.`
        : `${currentTrack.title} by ${currentTrack.artist} is already playing.`,
      followUpSuggestions: [
        "Pause music",
        "Change the song",
        ...buildSpotifySuggestions(currentTrack.id).slice(0, 1),
      ],
    };
  }

  return null;
}

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
  const selectedSpotifyTrackId = usePortfolioStore((state) => state.selectedSpotifyTrackId);
  const isSpotifyPaused = usePortfolioStore((state) => state.isSpotifyPaused);
  const setSelectedSpotifyTrackId = usePortfolioStore((state) => state.setSelectedSpotifyTrackId);
  const setSpotifyPaused = usePortfolioStore((state) => state.setSpotifyPaused);
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
        const spotifyCommand = detectSpotifyVoiceCommand({
          transcript,
          currentTrackId: selectedSpotifyTrackId,
          isSpotifyPaused,
        });

        if (spotifyCommand) {
          setLatestRouterResponse(null);
          setFollowUpSuggestions(spotifyCommand.followUpSuggestions);

          if (spotifyCommand.trackId) {
            setSelectedSpotifyTrackId(spotifyCommand.trackId);
          } else if (typeof spotifyCommand.shouldPause === "boolean") {
            setSpotifyPaused(spotifyCommand.shouldPause);
          }

          acknowledgePendingUtterance(utterance.id);
          clearTurnCaption();
          setLatestSpokenResponse(spotifyCommand.responseText);

          if (spotifyCommand.responseText) {
            await stopRealtimeSTTListening();
            await unlockAudio();

            try {
              await speak(spotifyCommand.responseText);
            } catch {
              setInteractionPhase("idle");
            }
          } else {
            setInteractionPhase("idle");
          }

          return;
        }

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

        const shouldSkipNarrationModel =
          !result.entity && result.route && deterministicAppRoutes.has(result.route);
        const narration = shouldSkipNarrationModel
          ? { spokenResponse: result.spokenResponse }
          : await orchestrateWithGemini({
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
          await stopRealtimeSTTListening();
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
    selectedSpotifyTrackId,
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
    setSelectedSpotifyTrackId,
    setSpotifyPaused,
    speak,
    syncPhoneScreenFromRoute,
    unlockAudio,
    isSpotifyPaused,
  ]);

  return null;
}
