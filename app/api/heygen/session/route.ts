import { NextRequest, NextResponse } from "next/server";
import { avatarConfig } from "@/config/avatar";
import { getLiveAvatarApiKey, getServerEnv } from "@/config/env.server";

const LIVEAVATAR_SESSION_TOKEN_URL = "https://api.liveavatar.com/v1/sessions/token";
const LIVEAVATAR_SESSION_START_URL = "https://api.liveavatar.com/v1/sessions/start";
const LIVEAVATAR_SESSION_STOP_URL = "https://api.liveavatar.com/v1/sessions/stop";

type CreateSessionRequestBody = {
  language?: string;
  quality?: "low" | "medium" | "high" | "very_high";
  encoding?: "H264" | "VP8";
  interactivityType?: "CONVERSATIONAL" | "PUSH_TO_TALK";
  sandbox?: boolean;
  voiceId?: string | null;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(payload: unknown, key: string): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const directValue = payload[key];
  if (typeof directValue === "string" && directValue.trim()) {
    return directValue;
  }

  if (!isRecord(payload.data)) {
    return null;
  }

  const nestedValue = payload.data[key];
  return typeof nestedValue === "string" && nestedValue.trim() ? nestedValue : null;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const directMessage = payload.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const errorValue = payload.error;
  if (typeof errorValue === "string" && errorValue.trim()) {
    return errorValue;
  }

  if (isRecord(errorValue) && typeof errorValue.message === "string" && errorValue.message.trim()) {
    return errorValue.message;
  }

  if (isRecord(payload.data) && typeof payload.data.message === "string" && payload.data.message.trim()) {
    return payload.data.message;
  }

  return fallback;
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const apiKey = getLiveAvatarApiKey();
  const requestBody = (await request.json().catch(() => ({}))) as CreateSessionRequestBody;
  const voiceId = requestBody.voiceId ?? env.LIVEAVATAR_VOICE_ID ?? undefined;

  try {
    const tokenResponse = await fetch(LIVEAVATAR_SESSION_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      cache: "no-store",
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: avatarConfig.avatarId,
        avatar_persona: {
          context_id: avatarConfig.contextId,
          language: requestBody.language ?? "en",
          ...(voiceId ? { voice_id: voiceId } : {}),
        },
        interactivity_type: requestBody.interactivityType ?? "CONVERSATIONAL",
        quality: requestBody.quality ?? "high",
        encoding: requestBody.encoding ?? "H264",
        ...(requestBody.sandbox ? { is_sandbox: true } : {}),
      }),
    });

    const tokenPayload = (await tokenResponse.json().catch(() => null)) as unknown;

    if (!tokenResponse.ok) {
      const errorMessage = readErrorMessage(
        tokenPayload,
        "Failed to create a LiveAvatar session token.",
      );

      return NextResponse.json(
        {
          error:
            !voiceId && /voice/i.test(errorMessage)
              ? `${errorMessage} Add LIVEAVATAR_VOICE_ID to .env.local if this avatar persona requires an explicit voice binding.`
              : errorMessage,
        },
        { status: tokenResponse.status },
      );
    }

    const sessionId = readString(tokenPayload, "session_id");
    const sessionToken = readString(tokenPayload, "session_token");

    if (!sessionId || !sessionToken) {
      return NextResponse.json(
        { error: "LiveAvatar token response did not include session credentials." },
        { status: 502 },
      );
    }

    const startResponse = await fetch(LIVEAVATAR_SESSION_START_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: "no-store",
    });

    const startPayload = (await startResponse.json().catch(() => null)) as unknown;

    if (!startResponse.ok) {
      return NextResponse.json(
        {
          error: readErrorMessage(startPayload, "Failed to start the LiveAvatar session."),
        },
        { status: startResponse.status },
      );
    }

    const livekitUrl = readString(startPayload, "livekit_url");
    const livekitToken = readString(startPayload, "livekit_client_token");

    if (!livekitUrl || !livekitToken) {
      return NextResponse.json(
        { error: "LiveAvatar start response did not include LiveKit connection details." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      sessionId,
      sessionToken,
      livekitUrl,
      livekitToken,
      avatarId: avatarConfig.avatarId,
      contextId: avatarConfig.contextId,
      mode: "FULL",
      interactivityType: requestBody.interactivityType ?? "CONVERSATIONAL",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected LiveAvatar session error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const apiKey = getLiveAvatarApiKey();
  const body = (await request.json().catch(() => null)) as
    | { sessionId?: string | null }
    | null;
  const sessionId = body?.sessionId?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing LiveAvatar sessionId." }, { status: 400 });
  }

  try {
    const stopResponse = await fetch(LIVEAVATAR_SESSION_STOP_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      cache: "no-store",
      body: JSON.stringify({
        session_id: sessionId,
        reason: "USER_DISCONNECTED",
      }),
    });

    const stopPayload = (await stopResponse.json().catch(() => null)) as unknown;

    if (!stopResponse.ok) {
      return NextResponse.json(
        {
          error: readErrorMessage(stopPayload, "Failed to stop the LiveAvatar session."),
        },
        { status: stopResponse.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected LiveAvatar stop error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
