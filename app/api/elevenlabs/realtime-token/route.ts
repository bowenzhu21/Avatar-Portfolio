import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env.server";

const ELEVENLABS_REALTIME_TOKEN_URL =
  "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe";

export async function POST() {
  const env = getServerEnv();

  try {
    const response = await fetch(ELEVENLABS_REALTIME_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { token?: string; detail?: string; error?: string }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.detail ??
            payload?.error ??
            "Failed to create ElevenLabs realtime token.",
        },
        { status: response.status },
      );
    }

    if (!payload?.token) {
      return NextResponse.json(
        { error: "ElevenLabs realtime token response did not include a token." },
        { status: 502 },
      );
    }

    return NextResponse.json({ token: payload.token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected ElevenLabs token error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
