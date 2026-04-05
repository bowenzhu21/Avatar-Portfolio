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
  const groundedFallback = buildGroundedVoiceFallback({
    transcript: payload.input.transcript,
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

  const prompt = {
    transcript: payload.input.transcript,
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
      routedEntity: payload.routerResult.entity,
      activeEntityId: payload.input.activeEntityId ?? null,
      activeRoute: payload.routerResult.route ?? payload.input.activeRoute ?? null,
    }),
    deterministicFallback: fallbackResponse,
  };

  try {
    const result = await generateStructuredJson<AvatarNarrationOutput>({
      systemInstruction: `${orchestrationSystemPrompt.trim()}
You are writing the exact words Bowen should say out loud.
Speak in first person as Bowen.
Use only the provided context.
Prioritize activeEntityContext, matchedFaqs, and routedEntity.sourceContext when they are present.
Use other voiceKnowledgeBase context only when it is directly relevant to the transcript.
Keep it concise: 1 to 3 short sentences, under 70 words.
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
        spokenResponse: fallbackResponse,
      });
    }

    const parsed = result.data;
    const spokenResponse =
      (typeof parsed.spokenResponse === "string"
        ? parsed.spokenResponse.replace(/\s+/g, " ").trim().slice(0, 420)
        : "") || fallbackResponse;

    return NextResponse.json<AvatarNarrationOutput>({ spokenResponse });
  } catch {
    return NextResponse.json<AvatarNarrationOutput>({
      spokenResponse: fallbackResponse,
    });
  }
}
