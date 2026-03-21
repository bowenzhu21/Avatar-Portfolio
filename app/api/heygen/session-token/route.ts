import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env.server";

const HEYGEN_CREATE_TOKEN_URL = "https://api.heygen.com/v1/streaming.create_token";

export async function POST() {
  const env = getServerEnv();

  try {
    const response = await fetch(HEYGEN_CREATE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.HEYGEN_API_KEY,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: { token?: string };
          error?: { message?: string } | string | null;
        }
      | null;

    if (!response.ok) {
      const errorMessage =
        typeof payload?.error === "string"
          ? payload.error
          : payload?.error?.message ?? "Failed to create a HeyGen session token.";

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const token = payload?.data?.token;

    if (!token) {
      return NextResponse.json(
        { error: "HeyGen token response did not include a token." },
        { status: 502 },
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected HeyGen token error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
