import { NextResponse } from "next/server";
import type {
  AvatarNarrationInput,
  AvatarNarrationOutput,
  PortfolioEntity,
} from "@/types";
import { orchestrationSystemPrompt } from "@/config/prompts";
import {
  buildGroundedVoiceFallback,
  getEntityVoiceContext,
  getRelevantVoiceKnowledgeBase,
} from "@/data/voiceContext";
import { generateStructuredJson } from "@/lib/structured-llm.server";
import { boundReply } from "@/lib/bounded-reply";

const narrationSchema = {
  type: "object",
  properties: {
    spokenResponse: { type: "string" },
  },
  required: ["spokenResponse"],
} as const;

function getEntityContext(entity: PortfolioEntity | null) {
  if (!entity) {
    return null;
  }

  const sourceContext = getEntityVoiceContext(entity.id);

  return {
    id: entity.id,
    title: entity.title,
    type: entity.type,
    shortSummary: entity.shortSummary,
    technicalSummary: entity.technicalSummary,
    recruiterSummary: entity.recruiterSummary,
    tags: entity.tags,
    sections: entity.sections,
    sourceContext,
  };
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AvatarNarrationInput;
  const recentUserTranscripts = Array.isArray(payload.input.recentUserTranscripts)
    ? payload.input.recentUserTranscripts
        .filter((transcript): transcript is string => typeof transcript === "string")
        .slice(-4)
    : [];
  const groundedFallback = buildGroundedVoiceFallback({
    transcript: payload.input.transcript,
    recentUserTranscripts,
    deterministicFallback:
      payload.routerResult.spokenResponse.trim() ||
      "I can walk through Bowen's work once you pick a project, role, or section.",
    conversationMode: payload.input.conversationMode,
    activeCard: payload.routerResult.card,
    activeSection: payload.routerResult.section,
    routedEntity: payload.routerResult.entity,
    activeEntityId: payload.input.activeEntityId ?? null,
    activeRoute: payload.routerResult.route ?? payload.input.activeRoute ?? null,
  });
  const fallbackResponse =
    groundedFallback ||
    payload.routerResult.spokenResponse.trim() ||
    "I can walk through Bowen's work once you pick a project, role, or section.";
  const clampedFallbackResponse =
    boundReply(fallbackResponse, 24, 140) || fallbackResponse;

  const prompt = {
    transcript: payload.input.transcript,
    recentUserTranscripts,
    activeRoute: payload.input.activeRoute ?? null,
    activeCard: payload.input.activeCard ?? null,
    activeSection: payload.input.activeSection ?? null,
    conversationMode: payload.input.conversationMode ?? "default",
    routedIntent: payload.routerResult.intent,
    routedCard: payload.routerResult.card,
    routedSection: payload.routerResult.section,
    routedEntity: getEntityContext(payload.routerResult.entity),
    voiceKnowledgeBase: getRelevantVoiceKnowledgeBase({
      transcript: payload.input.transcript,
      recentUserTranscripts,
      routedEntity: payload.routerResult.entity,
      activeEntityId: payload.input.activeEntityId ?? null,
      activeRoute: payload.routerResult.route ?? payload.input.activeRoute ?? null,
    }),
    deterministicFallback: clampedFallbackResponse,
  };

  try {
    const result = await generateStructuredJson<AvatarNarrationOutput>({
      systemInstruction: `${orchestrationSystemPrompt.trim()}
You are writing the exact words Bowen should say out loud.
Speak in first person as Bowen.
Use only the provided context.
Answer the current transcript. For follow-ups, use the most recent relevant topic in recentUserTranscripts.
Prioritize sources matching the current question and recent topic over an unrelated active page.
Use relevantProjects, relevantExperience, matchedFaqs, activeEntityContext, and routedEntity.sourceContext when they address that topic.
Recent user transcripts identify the topic; they are not evidence for factual claims.
Use other voiceKnowledgeBase context only when it is directly relevant to the transcript.
For broad questions about projects, experience, school, or interests, use matchedFaqs first, then projectDirectory and experienceDirectory when relevant.
Keep it concise: 1 to 2 short sentences, under 35 words total.
Prefer one sentence.
Keep it under 20 words whenever possible, and never exceed 24 words.
Use simple, direct phrasing.
Do not write long compound sentences.
Do not add filler, intros, or sign-offs.
Do not mention cards, routes, or UI mechanics unless the user explicitly asked about them.
Do not invent metrics, timelines, or implementation details.
Return strict JSON only.`,
      userPrompt: JSON.stringify(prompt, null, 2),
      schema: narrationSchema,
      schemaName: "avatar_narration",
      temperature: 0.55,
    });

    if (!result) {
      return NextResponse.json<AvatarNarrationOutput>({
        spokenResponse: clampedFallbackResponse,
      });
    }

    const parsed = result.data;
    const spokenResponse =
      (typeof parsed.spokenResponse === "string"
        ? boundReply(parsed.spokenResponse, 24, 140)
        : "") || clampedFallbackResponse;

    return NextResponse.json<AvatarNarrationOutput>({ spokenResponse });
  } catch {
    return NextResponse.json<AvatarNarrationOutput>({
      spokenResponse: clampedFallbackResponse,
    });
  }
}
