export interface ElevenLabsTranscriptChunk {
  text: string;
  isFinal: boolean;
  receivedAt: string;
}

export interface ElevenLabsRealtimeSession {
  id: string;
  model: string;
  status: "idle" | "connecting" | "active" | "closed";
}

export async function createRealtimeTranscriptionSession(): Promise<ElevenLabsRealtimeSession> {
  // TODO: Initialize realtime websocket/session with ElevenLabs STT credentials.
  return {
    id: "stub-elevenlabs-session",
    model: "scribe_v1_stub",
    status: "active",
  };
}

export async function closeRealtimeTranscriptionSession(
  _sessionId: string,
): Promise<void> {
  return;
}

export function subscribeToRealtimeTranscript(
  _sessionId: string,
  _onChunk: (chunk: ElevenLabsTranscriptChunk) => void,
): () => void {
  // TODO: Attach websocket listeners and emit transcript chunks.
  return () => undefined;
}
