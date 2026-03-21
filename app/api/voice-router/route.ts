import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env.server";
import { portfolioEntities, portfolioEntityMap } from "@/data/portfolio";
import {
  buildGeminiVoiceRouterPrompt,
  geminiVoiceRouterSchema,
  getTopCandidateMatches,
} from "@/lib/orchestrator";
import type {
  CardType,
  OrchestrationIntent,
  PortfolioEntity,
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

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

function buildSafeFallback(input: VoiceRouterInput): VoiceRouterOutput {
  return {
    intent: "clarify",
    entity: null,
    route: input.activeRoute ?? "/",
    card: "overview",
    section: null,
    spokenResponse:
      "I can help with Bowen's portfolio, but I need a clearer target. Try naming a project, role, or comparison.",
    confidence: 0.2,
    followUpSuggestions: ["Show me Matrix", "Open resume", "Compare HeyGen and Momenta"],
  };
}

function isComplexOrAmbiguousQuery(transcript: string): boolean {
  const normalized = transcript.toLowerCase();

  return (
    /\b(compare|versus|vs|between)\b/.test(normalized) ||
    /\b(technical|recruiter|hiring manager|engineering manager|architecture)\b/.test(
      normalized,
    ) ||
    /\b(which|best|better|should|fit|difference)\b/.test(normalized)
  );
}

function shouldUseGemini(args: {
  transcript: string;
  deterministic: VoiceRouterOutput | null;
  topCandidates: ReturnType<typeof getTopCandidateMatches>;
}): boolean {
  if (!args.deterministic) {
    return true;
  }

  if (args.deterministic.confidence < 0.55) {
    return true;
  }

  if (args.topCandidates.length > 1 && args.deterministic.confidence < 0.75) {
    return true;
  }

  return isComplexOrAmbiguousQuery(args.transcript);
}

function hydrateGeminiOutput(output: VoiceRouterOutput): VoiceRouterOutput {
  const entityFromRegistry =
    output.entity?.id ? portfolioEntityMap.get(output.entity.id) ?? null : null;
  const entityFromRoute =
    !entityFromRegistry && output.route
      ? portfolioEntities.find((item) => item.route === output.route) ?? null
      : null;
  const entity = entityFromRegistry ?? entityFromRoute ?? null;

  return {
    ...output,
    entity,
    route: output.route ?? entity?.route ?? null,
    card: output.card ?? "overview",
    section: output.section ?? null,
    spokenResponse: output.spokenResponse.trim(),
    confidence: Math.max(0, Math.min(output.confidence, 0.95)),
    followUpSuggestions: output.followUpSuggestions.slice(0, 4),
  };
}

async function runGeminiFallback(args: {
  input: VoiceRouterInput;
  currentEntity: PortfolioEntity | null;
  deterministic: VoiceRouterOutput | null;
  topCandidates: ReturnType<typeof getTopCandidateMatches>;
}): Promise<VoiceRouterOutput | null> {
  const env = getServerEnv();
  const prompt = buildGeminiVoiceRouterPrompt({
    input: args.input,
    currentEntity: args.currentEntity,
    topCandidates: args.topCandidates,
    deterministicHint: args.deterministic,
  });

  const response = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: prompt.systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: geminiVoiceRouterSchema,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    return null;
  }

  try {
    return hydrateGeminiOutput(JSON.parse(rawText) as VoiceRouterOutput);
  } catch {
    return null;
  }
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
  const aliasMatch = matchPortfolioAlias(transcript);
  const fallbackEntity =
    aliasMatch.entity ?? getEntityById(input.activeEntityId ?? null) ?? null;
  const section = inferSection(transcript, fallbackEntity);

  let deterministicResult: VoiceRouterOutput | null = null;
  if (comparison.detected && comparison.entities.length >= 2) {
    const primary = comparison.entities[0] ?? null;
    deterministicResult = buildAnswerResponse(input, {
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
      });
  }

  if (!deterministicResult && aliasMatch.entity) {
    const entity = aliasMatch.entity;
    const asksQuestion = /\b(what|how|why|tell me|explain)\b/i.test(transcript);
    const intent: OrchestrationIntent = asksQuestion ? "navigate_and_answer" : "navigate";
    const card = pickCard(intent, section?.id);
    const sectionLabel = section ? ` I’ll focus on the ${section.title} section.` : "";

    deterministicResult = buildAnswerResponse(input, {
        intent,
        entity,
        route: entity.route,
        card,
        section: section?.id ?? null,
        spokenResponse: `Opening ${entity.title}.${sectionLabel} ${entity.shortSummary}`.trim(),
        followUpSuggestions: entity.sections
          .slice(0, 3)
          .map((item) => `${entity.title} ${item.title}`),
      });
  }

  if (!deterministicResult && fallbackEntity) {
    const card = pickCard("answer", section?.id);
    const spokenResponse = section
      ? `${fallbackEntity.title} ${section.title}: ${section.summary}`
      : fallbackEntity.recruiterSummary;

    deterministicResult = buildAnswerResponse(input, {
        intent: "answer",
        entity: fallbackEntity,
        route: fallbackEntity.route,
        card,
        section: section?.id ?? null,
        spokenResponse,
        followUpSuggestions: fallbackEntity.sections
          .slice(0, 3)
          .map((item) => `Tell me about ${fallbackEntity.title} ${item.title}`),
      });
  }

  const topCandidates = getTopCandidateMatches(transcript);

  if (shouldUseGemini({ transcript, deterministic: deterministicResult, topCandidates })) {
    try {
      const geminiResult = await runGeminiFallback({
        input,
        currentEntity: fallbackEntity,
        deterministic: deterministicResult,
        topCandidates,
      });

      if (geminiResult) {
        return NextResponse.json(geminiResult);
      }
    } catch {
      return NextResponse.json(deterministicResult ?? buildSafeFallback(input));
    }
  }

  if (deterministicResult) {
    return NextResponse.json(deterministicResult);
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
