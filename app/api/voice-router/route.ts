import { NextResponse } from "next/server";
import { portfolioEntities } from "@/data/portfolio";
import type {
  CardType,
  OrchestrationIntent,
  VoiceRouterInput,
  VoiceRouterOutput,
} from "@/types";
import {
  detectComparison,
  getEntityById,
  inferSection,
  matchPortfolioAlias,
  scoreConfidence,
} from "@/utils/portfolio";

function pickCard(intent: OrchestrationIntent, sectionId?: string | null): CardType {
  if (intent === "compare") {
    return "comparison";
  }

  if (sectionId === "timeline") {
    return "timeline";
  }

  if (sectionId === "highlights") {
    return "highlights";
  }

  return "overview";
}

function buildAnswerResponse(
  input: VoiceRouterInput,
  output: Omit<VoiceRouterOutput, "confidence">,
): VoiceRouterOutput {
  const confidence = scoreConfidence({
    transcript: input.transcript,
    entity: output.entity,
    alias: output.entity?.title ?? null,
    section:
      output.entity?.sections.find((section) => section.id === output.section) ?? null,
    comparisonDetected: output.intent === "compare",
  });

  return {
    ...output,
    confidence,
  };
}

export async function POST(request: Request) {
  const input = (await request.json()) as VoiceRouterInput;
  const transcript = input.transcript?.trim() ?? "";

  if (!transcript) {
    return NextResponse.json<VoiceRouterOutput>({
      intent: "clarify",
      entity: null,
      route: input.activeRoute ?? null,
      card: "overview",
      section: null,
      spokenResponse: "I didn't catch anything yet. Ask about a project, role, or section.",
      confidence: 0.12,
      followUpSuggestions: ["Show me Matrix", "Open resume", "Compare HeyGen and Momenta"],
    });
  }

  const comparison = detectComparison(transcript);

  if (comparison.detected && comparison.entities.length >= 2) {
    const primary = comparison.entities[0] ?? null;
    return NextResponse.json(
      buildAnswerResponse(input, {
        intent: "compare",
        entity: primary,
        route: primary?.route ?? null,
        card: "comparison",
        section: null,
        spokenResponse: `I can compare ${comparison.entities[0]?.title} and ${comparison.entities[1]?.title}. The card will frame the contrast while I narrate the key differences.`,
        followUpSuggestions: [
          `Show ${comparison.entities[0]?.title} details`,
          `Show ${comparison.entities[1]?.title} details`,
          "Focus on technical summary",
        ],
      }),
    );
  }

  const aliasMatch = matchPortfolioAlias(transcript);
  const fallbackEntity =
    aliasMatch.entity ?? getEntityById(input.activeEntityId ?? null) ?? null;
  const section = inferSection(transcript, fallbackEntity);

  if (aliasMatch.entity) {
    const entity = aliasMatch.entity;
    const asksQuestion = /\b(what|how|why|tell me|explain)\b/i.test(transcript);
    const intent: OrchestrationIntent = asksQuestion ? "navigate_and_answer" : "navigate";
    const card = pickCard(intent, section?.id);
    const sectionLabel = section ? ` I’ll focus on the ${section.title} section.` : "";

    return NextResponse.json(
      buildAnswerResponse(input, {
        intent,
        entity,
        route: entity.route,
        card,
        section: section?.id ?? null,
        spokenResponse: `Opening ${entity.title}.${sectionLabel} ${entity.shortSummary}`.trim(),
        followUpSuggestions: entity.sections
          .slice(0, 3)
          .map((item) => `${entity.title} ${item.title}`),
      }),
    );
  }

  if (fallbackEntity) {
    const card = pickCard("answer", section?.id);
    const spokenResponse = section
      ? `${fallbackEntity.title} ${section.title}: ${section.summary}`
      : fallbackEntity.recruiterSummary;

    return NextResponse.json(
      buildAnswerResponse(input, {
        intent: "answer",
        entity: fallbackEntity,
        route: fallbackEntity.route,
        card,
        section: section?.id ?? null,
        spokenResponse,
        followUpSuggestions: fallbackEntity.sections
          .slice(0, 3)
          .map((item) => `Tell me about ${fallbackEntity.title} ${item.title}`),
      }),
    );
  }

  const knownRoutes = portfolioEntities.slice(0, 4).map((entity) => entity.title);

  return NextResponse.json<VoiceRouterOutput>({
    intent: "fallback",
    entity: null,
    route: input.activeRoute ?? null,
    card: "overview",
    section: null,
    spokenResponse:
      "I can help navigate Bowen's portfolio, but I need a clearer target. Try naming a project, an experience, or ask for a comparison.",
    confidence: 0.18,
    followUpSuggestions: knownRoutes,
  });
}
