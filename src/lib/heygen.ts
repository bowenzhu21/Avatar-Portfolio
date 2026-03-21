import { avatarConfig } from "@/config/avatar";

export interface HeyGenSessionOptions {
  avatarId?: string;
  contextId?: string;
}

export interface HeyGenSession {
  id: string;
  avatarId: string;
  contextId: string;
  startedAt: string;
}

export async function startHeyGenSession(
  options: HeyGenSessionOptions = {},
): Promise<HeyGenSession> {
  return {
    id: "stub-heygen-session",
    avatarId: options.avatarId ?? avatarConfig.heygenAvatarId,
    contextId: options.contextId ?? avatarConfig.heygenContextId,
    startedAt: new Date().toISOString(),
  };
}

export async function stopHeyGenSession(_sessionId: string): Promise<void> {
  return;
}

export async function speakWithHeyGen(
  _sessionId: string,
  _text: string,
): Promise<void> {
  // TODO: Call HeyGen Streaming Avatar / LiveAvatar speak endpoint once credentials are available.
  return;
}
