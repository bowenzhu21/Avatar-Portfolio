import { NextResponse } from "next/server";
import { avatarConfig } from "@/config/avatar";
import { getServerEnv } from "@/config/env.server";

export async function POST(request: Request) {
  const env = getServerEnv();
  const payload = (await request.json().catch(() => null)) as
    | { text?: string; voiceId?: string }
    | null;
  const text = payload?.text?.trim() ?? "";
  const voiceId = payload?.voiceId?.trim() || avatarConfig.voiceId;

  if (!text) {
    return NextResponse.json({ error: "Text is required for avatar speech." }, { status: 400 });
  }

  try {
    const elevenLabsTtsUrl = new URL(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    );
    elevenLabsTtsUrl.searchParams.set("output_format", avatarConfig.speechOutputFormat);

    const response = await fetch(elevenLabsTtsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: avatarConfig.speechModelId,
        voice_settings: {
          stability: 0.48,
          similarity_boost: 0.72,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as
        | { detail?: { message?: string } | string; error?: string }
        | null;
      const message =
        typeof errorPayload?.detail === "string"
          ? errorPayload.detail
          : errorPayload?.detail?.message ??
            errorPayload?.error ??
            "ElevenLabs text-to-speech request failed.";

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected ElevenLabs speech error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
