import { compactPortfolioRegistry } from "@/data/portfolio";
import type {
  AvatarNarrationInput,
  AvatarNarrationOutput,
  PortfolioEntity,
  VoiceRouterInput,
  VoiceRouterOutput,
} from "@/types";
import { orchestrationSystemPrompt } from "@/config/prompts";

export async function routeVoiceIntent(
  payload: VoiceRouterInput,
): Promise<VoiceRouterOutput> {
  const response = await fetch("/api/voice-router", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Voice router request failed.");
  }

  return (await response.json()) as VoiceRouterOutput;
}

export async function orchestrateWithGemini(
  payload: AvatarNarrationInput,
): Promise<AvatarNarrationOutput> {
  const response = await fetch("/api/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Narration orchestration request failed.");
  }

  return (await response.json()) as AvatarNarrationOutput;
}

function detectConversationLens(transcript: string): "technical" | "recruiter" | "general" {
  const normalized = transcript.toLowerCase();

  if (
    /\b(technical|architecture|implementation|stack|code|engineering|system design)\b/.test(
      normalized,
    )
  ) {
    return "technical";
  }

  if (/\b(recruiter|hiring|fit|impact|leadership|summary)\b/.test(normalized)) {
    return "recruiter";
  }

  return "general";
}

function overlapScore(transcript: string, candidate: (typeof compactPortfolioRegistry)[number]) {
  const haystack = transcript.toLowerCase();
  const tokens = new Set(
    [candidate.title, candidate.route, ...candidate.aliases, ...candidate.tags]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9/.-]+/)
      .filter(Boolean),
  );

  let score = 0;

  for (const token of tokens) {
    if (token.length > 2 && haystack.includes(token)) {
      score += token.length;
    }
  }

  return score;
}

export function getTopCandidateMatches(transcript: string, limit = 4) {
  return compactPortfolioRegistry
    .map((candidate) => ({
      ...candidate,
      score: overlapScore(transcript, candidate),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...candidate }) => candidate);
}

export function getCompactEntityContext(entity: PortfolioEntity | null) {
  if (!entity) {
    return null;
  }

  return {
    id: entity.id,
    title: entity.title,
    type: entity.type,
    route: entity.route,
    shortSummary: entity.shortSummary,
    sections: entity.sections.map((section) => ({
      id: section.id,
      title: section.title,
    })),
  };
}

export const geminiVoiceRouterSchema = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["navigate", "answer", "navigate_and_answer", "compare", "clarify", "fallback"],
    },
    entity: {
      anyOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: { type: "string", enum: ["project", "experience", "other"] },
            route: { type: "string" },
            aliases: { type: "array", items: { type: "string" } },
            shortSummary: { type: "string" },
            technicalSummary: { type: "string" },
            recruiterSummary: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["id", "title", "summary"],
              },
            },
            relatedItems: { type: "array", items: { type: "string" } },
          },
          required: [
            "id",
            "title",
            "type",
            "route",
            "aliases",
            "shortSummary",
            "technicalSummary",
            "recruiterSummary",
            "tags",
            "sections",
            "relatedItems",
          ],
        },
        { type: "null" },
      ],
    },
    route: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    card: {
      type: "string",
      enum: [
        "overview",
        "technical",
        "recruiter",
        "comparison",
        "contact",
        "timeline",
        "highlights",
      ],
    },
    section: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    spokenResponse: { type: "string" },
    confidence: { type: "number" },
    followUpSuggestions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "intent",
    "entity",
    "route",
    "card",
    "section",
    "spokenResponse",
    "confidence",
    "followUpSuggestions",
  ],
} as const;

export function buildGeminiVoiceRouterPrompt(args: {
  input: VoiceRouterInput;
  currentEntity: PortfolioEntity | null;
  topCandidates: ReturnType<typeof getTopCandidateMatches>;
  deterministicHint: VoiceRouterOutput | null;
}) {
  const lens = detectConversationLens(args.input.transcript);

  return {
    systemInstruction: `${orchestrationSystemPrompt.trim()}
Return strict JSON only.
Keep spokenResponse concise, grounded, and natural.
Prefer clarification over invention.
Adapt tone to the requested lens: ${lens}.`,
    userPrompt: JSON.stringify(
      {
        transcript: args.input.transcript,
        lens,
        currentRoute: args.input.activeRoute ?? null,
        currentCard: args.input.activeCard ?? null,
        currentEntity: getCompactEntityContext(args.currentEntity),
        recentEntities: args.input.recentEntities ?? [],
        conversationMode: args.input.conversationMode ?? "default",
        lastIntent: args.input.lastIntent ?? null,
        topCandidates: args.topCandidates,
        deterministicHint: args.deterministicHint
          ? {
              intent: args.deterministicHint.intent,
              route: args.deterministicHint.route,
              section: args.deterministicHint.section,
              confidence: args.deterministicHint.confidence,
            }
          : null,
      },
      null,
      2,
    ),
  };
}
