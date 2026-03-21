import type { VoiceRouterInput, VoiceRouterOutput } from "@/types";

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
  payload: VoiceRouterInput,
): Promise<VoiceRouterOutput> {
  const response = await fetch("/api/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Gemini orchestration request failed.");
  }

  return (await response.json()) as VoiceRouterOutput;
}
