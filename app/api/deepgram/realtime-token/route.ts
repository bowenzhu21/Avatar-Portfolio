import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing DEEPGRAM_API_KEY for realtime transcription." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ttl_seconds: 60,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          access_token?: string;
          expires_in?: number;
          err_msg?: string;
        }
      | null;

    if (!response.ok || !payload?.access_token) {
      const insufficientPermissions =
        payload?.err_msg?.toLowerCase().includes("sufficient permissions") ?? false;

      if (insufficientPermissions) {
        return NextResponse.json({
          token: apiKey,
          expiresIn: null,
          authMode: "api_key_fallback",
        });
      }

      return NextResponse.json(
        {
          error:
            payload?.err_msg ??
            "Unable to create a Deepgram realtime token.",
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      token: payload.access_token,
      expiresIn: payload.expires_in ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Deepgram token error.",
      },
      { status: 500 },
    );
  }
}
