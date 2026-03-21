import { NextResponse } from "next/server";
import type { VoiceRouterInput, VoiceRouterOutput } from "@/types";
import { orchestrationSystemPrompt } from "@/config/prompts";

export async function POST(request: Request) {
  const input = (await request.json()) as VoiceRouterInput;

  const response: VoiceRouterOutput = {
    intent: "fallback",
    entity: null,
    route: input.activeRoute ?? null,
    card: "overview",
    section: null,
    spokenResponse:
      "Gemini orchestration is not wired yet. The deterministic voice router is ready, and this endpoint is reserved for future model-based fallback.",
    confidence: 0.2,
    followUpSuggestions: [
      "Show me Matrix",
      "Open resume",
      "Compare HeyGen and Momenta",
    ],
  };

  return NextResponse.json({
    ...response,
    debug: {
      systemPromptPreview: orchestrationSystemPrompt.trim(),
      todo: "Wire Gemini server-side call here and fall back to /api/voice-router when deterministic matches win.",
    },
  });
}
