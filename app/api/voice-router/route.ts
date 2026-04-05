import { NextResponse } from "next/server";
import { portfolioEntities, portfolioEntityMap } from "@/data/portfolio";
import {
  buildGeminiVoiceRouterPrompt,
  geminiVoiceRouterSchema,
  getTopCandidateMatches,
} from "@/lib/orchestrator";
import { generateStructuredJson } from "@/lib/structured-llm.server";
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

function pickCard(intent: OrchestrationIntent, sectionId?: string | null): CardType {
  if (intent === "compare") {
    return "comparison";
  }

  if (sectionId === "architecture" || sectionId === "mechanics" || sectionId === "engineering") {
    return "architecture";
  }

  if (sectionId === "components" || sectionId === "workflow" || sectionId === "modeling") {
    return "stack";
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

function detectConversationMode(
  transcript: string,
  currentMode: VoiceRouterInput["conversationMode"],
) {
  const normalized = transcript.toLowerCase();

  if (/\b(recruiter|hiring manager|less technical|high level)\b/.test(normalized)) {
    return "recruiter" as const;
  }

  if (/\b(more technical|backend|architecture|deeper|system design|implementation)\b/.test(normalized)) {
    return "technical" as const;
  }

  if (/\b(concise|shorter|brief|quick version)\b/.test(normalized)) {
    return "concise" as const;
  }

  return currentMode === "default" ||
    currentMode === "recruiter" ||
    currentMode === "technical" ||
    currentMode === "concise"
    ? currentMode
    : "default";
}

function inferFollowUpCard(
  transcript: string,
  activeCard?: CardType | null,
): CardType | null {
  const normalized = transcript.toLowerCase();

  if (/\b(backend|architecture|deeper|system)\b/.test(normalized)) {
    return "architecture";
  }

  if (/\b(stack|tech stack|tools|frameworks)\b/.test(normalized)) {
    return "stack";
  }

  if (/\b(contact|reach out|email)\b/.test(normalized)) {
    return "contact";
  }

  if (/\b(resume|cv)\b/.test(normalized)) {
    return "resume";
  }

  if (/\b(hobbies|interests|nutrition|fitness)\b/.test(normalized)) {
    return "hobbies";
  }

  if (/\b(go deeper|more detail|expand)\b/.test(normalized)) {
    return activeCard ?? "overview";
  }

  return null;
}

function detectFollowUpIntent(input: VoiceRouterInput): {
  entity: PortfolioEntity | null;
  intent: OrchestrationIntent | null;
  card: CardType | null;
  section: string | null;
} {
  const transcript = input.transcript.toLowerCase();
  const currentEntity = getEntityById(input.activeEntityId ?? null);
  const recentEntity = getEntityById(input.recentEntities?.[0] ?? null);
  const contextEntity = currentEntity ?? recentEntity;

  if (!contextEntity) {
    return {
      entity: null,
      intent: null,
      card: null,
      section: null,
    };
  }

  if (/\b(compare that to|compare it to|versus momenta|vs momenta)\b/.test(transcript)) {
    const momenta = portfolioEntityMap.get("momenta") ?? null;
    return {
      entity: contextEntity,
      intent: momenta ? "compare" : null,
      card: "comparison",
      section: null,
    };
  }

  if (/\b(another project like that|similar project|show me another)\b/.test(transcript)) {
    const relatedProject = contextEntity.relatedItems
      .map((id) => portfolioEntityMap.get(id) ?? null)
      .find((entity) => entity?.type === "project") ?? null;

    return {
      entity: relatedProject,
      intent: relatedProject ? "navigate_and_answer" : null,
      card: "overview",
      section: null,
    };
  }

  const followUpCard = inferFollowUpCard(transcript, input.activeCard);
  if (followUpCard) {
    return {
      entity: contextEntity,
      intent: "answer",
      card: followUpCard,
      section: followUpCard === "architecture" ? "architecture" : null,
    };
  }

  return {
    entity: null,
    intent: null,
    card: null,
    section: null,
  };
}

function buildContextualResponse(args: {
  entity: PortfolioEntity;
  mode: "default" | "recruiter" | "technical" | "concise";
  card: CardType;
  section: string | null;
}): string {
  if (args.card === "comparison") {
    return `I’ll compare ${args.entity.title} against the current reference point and focus on the differences that matter most.`;
  }

  if (args.card === "contact") {
    return "I’ll switch to the contact view so the next step is easy to act on.";
  }

  if (args.card === "resume") {
    return "I’ll open the resume view for a compact summary of Bowen's background.";
  }

  if (args.card === "hobbies") {
    return "I’ll switch to nutrition and fitness to add some personal context beyond work and projects.";
  }

  if (args.mode === "recruiter") {
    return args.entity.recruiterSummary;
  }

  if (args.mode === "technical") {
    return args.entity.technicalSummary;
  }

  if (args.mode === "concise") {
    return args.entity.shortSummary;
  }

  if (args.section) {
    const section = args.entity.sections.find((item) => item.id === args.section);
    if (section) {
      return `${args.entity.title} ${section.title}: ${section.summary}`;
    }
  }

  return args.entity.shortSummary;
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

function shouldUseLlm(args: {
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

async function runModelFallback(args: {
  input: VoiceRouterInput;
  currentEntity: PortfolioEntity | null;
  deterministic: VoiceRouterOutput | null;
  topCandidates: ReturnType<typeof getTopCandidateMatches>;
}): Promise<VoiceRouterOutput | null> {
  const prompt = buildGeminiVoiceRouterPrompt({
    input: args.input,
    currentEntity: args.currentEntity,
    topCandidates: args.topCandidates,
    deterministicHint: args.deterministic,
  });

  const result = await generateStructuredJson<VoiceRouterOutput>({
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    schema: geminiVoiceRouterSchema,
    schemaName: "voice_router_output",
    temperature: 0.2,
  });

  if (!result) {
    return null;
  }

  try {
    return hydrateGeminiOutput(result.data);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const input = (await request.json()) as VoiceRouterInput;
  const transcript = input.transcript?.trim() ?? "";
  const preferredMode = detectConversationMode(transcript, input.conversationMode);

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
  const followUp = detectFollowUpIntent(input);

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

  if (!deterministicResult && followUp.intent && followUp.entity) {
    const route = followUp.entity.route;
    const card = followUp.card ?? "overview";
    const response = buildContextualResponse({
      entity: followUp.entity,
      mode: preferredMode,
      card,
      section: followUp.section,
    });

    deterministicResult = buildAnswerResponse(input, {
      intent: followUp.intent,
      entity: followUp.entity,
      route,
      card,
      section: followUp.section,
      spokenResponse: response,
      followUpSuggestions: followUp.entity.relatedItems
        .slice(0, 3)
        .map((id) => portfolioEntityMap.get(id)?.title ?? id),
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
        card: inferFollowUpCard(transcript, input.activeCard) ?? card,
        section: section?.id ?? null,
        spokenResponse: `Opening ${entity.title}.${sectionLabel} ${buildContextualResponse({
          entity,
          mode: preferredMode,
          card: inferFollowUpCard(transcript, input.activeCard) ?? card,
          section: section?.id ?? null,
        })}`.trim(),
        followUpSuggestions: entity.sections
          .slice(0, 3)
          .map((item) => `${entity.title} ${item.title}`),
      });
  }

  if (!deterministicResult && fallbackEntity) {
    const card = inferFollowUpCard(transcript, input.activeCard) ?? pickCard("answer", section?.id);
    const spokenResponse = buildContextualResponse({
      entity: fallbackEntity,
      mode: preferredMode,
      card,
      section: section?.id ?? null,
    });

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

  if (shouldUseLlm({ transcript, deterministic: deterministicResult, topCandidates })) {
    try {
      const llmResult = await runModelFallback({
        input,
        currentEntity: fallbackEntity,
        deterministic: deterministicResult,
        topCandidates,
      });

      if (llmResult) {
        if (preferredMode !== "default" && llmResult.intent !== "clarify") {
          llmResult.spokenResponse = buildContextualResponse({
            entity: llmResult.entity ?? fallbackEntity ?? portfolioEntities[0],
            mode: preferredMode,
            card: llmResult.card,
            section: llmResult.section,
          });
        }
        return NextResponse.json(llmResult);
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
