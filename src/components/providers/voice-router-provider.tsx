"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { allChatContacts, phoneContacts } from "@/data/chatContacts";
import {
  findSpotifyTrackByQuery,
  getNextSpotifyTrackId,
  getSpotifyTrackById,
  spotifyTracks,
} from "@/data/spotify";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { usePromptFeedback } from "@/hooks/usePromptFeedback";
import { stopRealtimeSTTListening } from "@/hooks/useRealtimeSTT";
import { orchestrateWithGemini, routeVoiceIntent } from "@/lib/orchestrator";
import { abortPromptRequest, beginPromptRequest, isActivePromptRequest } from "@/lib/prompt-request";
import { boundReply } from "@/lib/bounded-reply";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import type { ChatContactId, PhoneCallMode } from "@/types";
import { getEntityByRoute } from "@/utils/portfolio";

type SpotifyVoiceCommand =
  | {
      kind: "play_track" | "next_track" | "resume" | "pause" | "unknown_track";
      responseText: string;
      trackId?: string;
      shouldPause?: boolean;
      followUpSuggestions: string[];
    };

type ContactVoiceCommand = {
  app: "phone" | "messages";
  contactId: ChatContactId;
  callMode: PhoneCallMode | null;
  responseText: string;
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

const contactAliasMap: Record<ChatContactId, string[]> = {
  bowen: ["bowen"],
  lara: ["lara"],
  yalda: ["yalda"],
  alisha: ["alisha"],
  pious: ["pious"],
};

function normalizeVoiceCommand(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildContactMatchers(
  contacts: Array<{ id: ChatContactId; name: string }>,
) {
  return contacts.map((contact) => {
    const aliases = Array.from(
      new Set([
        normalizeVoiceCommand(contact.name),
        ...contactAliasMap[contact.id].map((alias) => normalizeVoiceCommand(alias)),
      ]),
    ).filter(Boolean);

    return {
      ...contact,
      aliases,
    };
  });
}

const messageContactMatchers = buildContactMatchers(allChatContacts);
const callableContactMatchers = buildContactMatchers(phoneContacts);

const contactTargetStopWords = new Set([
  "a",
  "an",
  "and",
  "chat",
  "friend",
  "for",
  "hey",
  "my",
  "now",
  "please",
  "the",
  "to",
  "up",
  "with",
]);

function findMentionedContact(
  normalizedTranscript: string,
  contacts: ReturnType<typeof buildContactMatchers>,
) {
  const matches = contacts
    .flatMap((contact) =>
      contact.aliases
        .map((alias) => {
          const pattern = new RegExp(`\\b${escapeRegex(alias).replace(/\s+/g, "\\s+")}\\b`);
          const match = pattern.exec(normalizedTranscript);

          if (!match) {
            return null;
          }

          return {
            contact,
            index: match.index,
            aliasLength: alias.length,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    )
    .sort((left, right) => {
      if (left.index !== right.index) {
        return left.index - right.index;
      }

      return right.aliasLength - left.aliasLength;
    });

  return matches[0]?.contact ?? null;
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;

    for (let column = 1; column <= right.length; column += 1) {
      const nextDiagonal = previous[column];
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;

      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + cost,
      );
      diagonal = nextDiagonal;
    }
  }

  return previous[right.length];
}

function cleanContactTarget(value: string) {
  return normalizeVoiceCommand(value)
    .split(" ")
    .filter((token) => token && !contactTargetStopWords.has(token))
    .join(" ")
    .trim();
}

function buildContactTargetCandidates(target: string) {
  const tokens = target.split(" ").filter(Boolean);
  const candidates = new Set<string>();

  if (target) {
    candidates.add(target);
  }

  if (tokens.length >= 2) {
    candidates.add(tokens.slice(-2).join(" "));
  }

  if (tokens.length >= 1) {
    candidates.add(tokens[tokens.length - 1]);
  }

  tokens.forEach((token) => {
    if (token.length >= 3) {
      candidates.add(token);
    }
  });

  return [...candidates];
}

function getAllowedEditDistance(length: number) {
  if (length <= 4) {
    return 1;
  }

  if (length <= 7) {
    return 2;
  }

  return 3;
}

function findFuzzyContactMatch(
  target: string | null,
  contacts: ReturnType<typeof buildContactMatchers>,
) {
  if (!target) {
    return null;
  }

  const cleanedTarget = cleanContactTarget(target);

  if (!cleanedTarget) {
    return null;
  }

  const candidates = buildContactTargetCandidates(cleanedTarget);
  let bestMatch:
    | {
        contact: ReturnType<typeof buildContactMatchers>[number];
        similarity: number;
        distance: number;
        aliasLength: number;
      }
    | null = null;

  for (const contact of contacts) {
    for (const alias of contact.aliases) {
      for (const candidate of candidates) {
        if (!candidate || candidate[0] !== alias[0]) {
          continue;
        }

        if (
          Math.min(candidate.length, alias.length) <= 5 &&
          candidate.slice(0, 2) !== alias.slice(0, 2)
        ) {
          continue;
        }

        const distance = levenshteinDistance(candidate, alias);
        const longestLength = Math.max(candidate.length, alias.length);
        const similarity = 1 - distance / longestLength;

        if (distance > getAllowedEditDistance(longestLength) || similarity < 0.64) {
          continue;
        }

        if (
          !bestMatch ||
          similarity > bestMatch.similarity ||
          (similarity === bestMatch.similarity && distance < bestMatch.distance) ||
          (similarity === bestMatch.similarity &&
            distance === bestMatch.distance &&
            alias.length > bestMatch.aliasLength)
        ) {
          bestMatch = {
            contact,
            similarity,
            distance,
            aliasLength: alias.length,
          };
        }
      }
    }
  }

  return bestMatch?.contact ?? null;
}

function extractContactTarget(args: {
  normalizedTranscript: string;
  mode: "call" | "message";
}) {
  const patterns =
    args.mode === "call"
      ? [
          /\b(?:call|phone|dial|ring)\s+(.+)$/,
          /\b(?:facetime|face time|video call|video chat)\s+(.+)$/,
        ]
      : [
          /\b(?:text|message|messages|imessage|dm)\s+(?:to\s+)?(.+)$/,
          /\bsend(?:\s+\w+){0,3}\s+(?:a\s+)?(?:text|message)\s+(?:to\s+)?(.+)$/,
        ];

  for (const pattern of patterns) {
    const match = args.normalizedTranscript.match(pattern);
    const target = cleanContactTarget(match?.[1] ?? "");

    if (target) {
      return target;
    }
  }

  return null;
}

function buildContactSuggestions(contactName: string) {
  const suggestions = [`Text ${contactName}`];

  if (phoneContacts.some((contact) => contact.name === contactName)) {
    suggestions.push(`Call ${contactName}`);
  }

  suggestions.push(
    ...phoneContacts
      .filter((contact) => contact.name !== contactName)
      .slice(0, 2)
      .map((contact) => `Call ${contact.name}`),
  );

  return suggestions.slice(0, 3);
}

function detectContactVoiceCommand(transcript: string): ContactVoiceCommand | null {
  const normalized = normalizeVoiceCommand(transcript);
  const wantsMessage =
    /\b(?:text|message|messages|imessage|dm)\b/.test(normalized) ||
    /\bsend(?:\s+\w+){0,3}\s+(?:a\s+)?(?:text|message)\b/.test(normalized);
  const wantsFaceTime = /\b(?:facetime|face time|video call|video chat)\b/.test(normalized);
  const wantsCall = wantsFaceTime || /\b(?:call|phone|dial|ring)\b/.test(normalized);

  if (wantsMessage) {
    const contact =
      findMentionedContact(normalized, messageContactMatchers) ??
      findFuzzyContactMatch(
        extractContactTarget({
          normalizedTranscript: normalized,
          mode: "message",
        }),
        messageContactMatchers,
      );

    if (contact) {
      return {
        app: "messages",
        contactId: contact.id,
        callMode: null,
        responseText: `Opening messages with ${contact.name}.`,
        followUpSuggestions: buildContactSuggestions(contact.name),
      };
    }
  }

  if (wantsCall) {
    const contact =
      findMentionedContact(normalized, callableContactMatchers) ??
      findFuzzyContactMatch(
        extractContactTarget({
          normalizedTranscript: normalized,
          mode: "call",
        }),
        callableContactMatchers,
      );

    if (contact) {
      const callMode: PhoneCallMode = wantsFaceTime ? "facetime" : "call";

      return {
        app: "phone",
        contactId: contact.id,
        callMode,
        responseText:
          callMode === "facetime"
            ? `Starting FaceTime with ${contact.name}.`
            : `Calling ${contact.name}.`,
        followUpSuggestions: buildContactSuggestions(contact.name),
      };
    }
  }

  return null;
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
  const audio = useAvatarSpeech();
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const lastHandledUtteranceRef = useRef("");
  const activeRequestRef = useRef<AbortController | null>(null);
  const pendingUtterance = usePortfolioStore((state) => state.pendingUtterance);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);

  useEffect(() => () => {
    abortPromptRequest();
    activeRequestRef.current = null;
  }, []);

  useEffect(() => {
    const state = usePortfolioStore.getState();
    if (state.pendingUtterance) return;
    if (audio.isSpeaking) {
      state.setInteractionPhase("speaking");
    } else if (state.interactionPhase === "speaking") {
      state.setInteractionPhase("idle");
    }
  }, [audio.isSpeaking, interactionPhase]);

  useEffect(() => {
    if (interactionPhase === "listening" && !pendingUtterance) {
      abortPromptRequest();
      activeRequestRef.current = null;
    }
  }, [interactionPhase, pendingUtterance]);

  useEffect(() => {
    const utterance = pendingUtterance;
    if (!utterance || (utterance.id === lastHandledUtteranceRef.current && activeRequestRef.current)) return;
    lastHandledUtteranceRef.current = utterance.id;

    const controller = beginPromptRequest();
    activeRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000);
    const state = usePortfolioStore.getState();
    const transcript = utterance.text.trim();
    const payload = {
      transcript,
      activeRoute: state.activeRoute,
      activeEntityId: state.activeEntity?.id ?? null,
      activeCard: state.activeCard,
      activeSection: state.activeSection,
      recentEntities: state.recentEntities,
      recentUserTranscripts: state.conversationHistory
        .filter((turn) => turn.role === "user")
        .slice(-4)
        .map((turn) => turn.text),
      conversationMode: state.conversationMode,
      lastIntent: state.lastIntent,
    } as const;

    // Store changes can precede the effect for the next turn. Check both identities.
    function isCurrent() {
      const pending = usePortfolioStore.getState().pendingUtterance;
      return isActivePromptRequest(controller) &&
        usePortfolioStore.getState().interactionPhase !== "listening" &&
        (!pending || pending.id === utterance!.id);
    }

    async function finish(responseText: string) {
      if (!isCurrent()) return;
      state.acknowledgePendingUtterance(utterance!.id);
      state.clearTurnCaption();
      state.setLatestSpokenResponse(responseText);
      state.setInteractionPhase("idle");
      window.clearTimeout(timeoutId);

      // Typing is deliberately quiet and never unlocks browser audio.
      if (!responseText || utterance!.source === "text" || document.hidden) return;
      await stopRealtimeSTTListening();
      if (!isCurrent()) return;
      await audioRef.current.unlockAudio();
      if (!isCurrent()) return;
      try {
        await audioRef.current.speak(responseText);
      } catch {
        if (isCurrent()) state.setInteractionPhase("idle");
      }
    }

    const run = async () => {
      usePromptFeedback.getState().clearError();
      try {
        await audioRef.current.interrupt();
        if (!isCurrent()) return;
        state.setInteractionPhase("thinking");
        state.setLatestRouterPayload(payload);
        state.setLatestSpokenResponse("");

        const contactCommand = detectContactVoiceCommand(transcript);
        if (contactCommand) {
          state.setLatestRouterResponse(null);
          state.openCard();
          state.setActiveCard("overview");
          state.setActiveEntity(null);
          state.setActiveSection(null);
          state.setLastIntent("navigate");
          state.setFollowUpSuggestions(contactCommand.followUpSuggestions);
          state.setPhoneScreen({
            app: contactCommand.app,
            view: "detail",
            title: contactCommand.app === "phone" ? "Phone" : "Messages",
            entityId: null,
            route: null,
            card: "overview",
            contactId: contactCommand.contactId,
            callMode: contactCommand.callMode,
          });
          await finish(contactCommand.responseText);
          return;
        }

        const spotifyCommand = detectSpotifyVoiceCommand({
          transcript,
          currentTrackId: state.selectedSpotifyTrackId,
          isSpotifyPaused: state.isSpotifyPaused,
        });
        if (spotifyCommand) {
          state.setLatestRouterResponse(null);
          state.setFollowUpSuggestions(spotifyCommand.followUpSuggestions);
          if (spotifyCommand.trackId) {
            state.setSelectedSpotifyTrackId(spotifyCommand.trackId);
          } else if (typeof spotifyCommand.shouldPause === "boolean") {
            state.setSpotifyPaused(spotifyCommand.shouldPause);
          }
          await finish(spotifyCommand.responseText);
          return;
        }

        const result = await routeVoiceIntent(payload, controller.signal);
        if (!isCurrent()) return;
        state.setLatestRouterResponse(result);
        state.openCard();
        state.setActiveCard(result.card);
        state.setLastIntent(result.intent);
        state.setFollowUpSuggestions(result.followUpSuggestions);

        if (/\b(recruiter|hiring manager)\b/i.test(transcript)) {
          state.setConversationMode("recruiter");
        } else if (/\b(technical|backend|architecture|deeper)\b/i.test(transcript)) {
          state.setConversationMode("technical");
        } else if (/\b(concise|brief|shorter)\b/i.test(transcript)) {
          state.setConversationMode("concise");
        }

        const nextEntity = result.entity ?? (result.route ? getEntityByRoute(result.route) : null);
        state.setActiveEntity(nextEntity);
        state.setActiveSection(result.section);
        if (nextEntity) state.pushRecentEntity(nextEntity.id);

        if (result.route && result.route !== state.activeRoute) {
          state.setActiveRoute(result.route);
          state.syncPhoneScreenFromRoute(result.route, nextEntity, result.card);
          router.push(result.route as Route);
        } else {
          state.syncPhoneScreenFromRoute(state.activeRoute, nextEntity ?? state.activeEntity, result.card);
        }

        const shouldSkipNarrationModel = result.intent === "navigate" &&
          !result.entity && result.route && deterministicAppRoutes.has(result.route);
        const narration = shouldSkipNarrationModel
          ? { spokenResponse: result.spokenResponse }
          : await orchestrateWithGemini({ input: payload, routerResult: result }, controller.signal)
              .catch((error: unknown) => {
                if (controller.signal.aborted) throw error;
                return { spokenResponse: result.spokenResponse };
              });
        if (!isCurrent()) return;
        const conciseResponse = boundReply(narration.spokenResponse, 60, 320);
        await finish(conciseResponse);
      } catch {
        if (!isCurrent()) return;
        state.acknowledgePendingUtterance(utterance.id);
        state.setInteractionPhase("idle");
        usePromptFeedback.getState().reportError(
          "Couldn’t get a reply. Check your connection and try again.",
          transcript,
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void run();
  }, [pendingUtterance, router]);

  return null;
}
