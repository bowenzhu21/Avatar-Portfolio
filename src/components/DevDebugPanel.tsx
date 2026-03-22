"use client";

import { useState } from "react";
import { useHeyGenAvatar } from "@/hooks/useHeyGenAvatar";
import { useRealtimeSTT } from "@/hooks/useRealtimeSTT";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function DevDebugPanel() {
  const [open, setOpen] = useState(false);
  const avatar = useHeyGenAvatar();
  const stt = useRealtimeSTT();
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const latestUserUtterance = usePortfolioStore((state) => state.latestUserUtterance);
  const latestSpokenResponse = usePortfolioStore((state) => state.latestSpokenResponse);
  const latestRouterPayload = usePortfolioStore((state) => state.latestRouterPayload);
  const latestRouterResponse = usePortfolioStore((state) => state.latestRouterResponse);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-6 left-6 z-30 w-[24rem] max-w-[calc(100vw-3rem)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="panel-blur rounded-full border border-white/12 bg-black/45 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/70"
      >
        {open ? "Hide debug" : "Show debug"}
      </button>

      {open ? (
        <div className="panel-blur mt-3 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/65 p-4 text-xs text-white/75 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-2 gap-2">
            <DebugRow label="Avatar status" value={avatar.status} />
            <DebugRow label="Room state" value={avatar.debug.roomState} />
            <DebugRow label="Remote participant" value={String(avatar.debug.hasRemoteParticipant)} />
            <DebugRow label="Video subscribed" value={String(avatar.debug.remoteVideoSubscribed)} />
            <DebugRow label="Audio subscribed" value={String(avatar.debug.remoteAudioSubscribed)} />
            <DebugRow label="Audio attached" value={String(avatar.debug.audioElementAttached)} />
            <DebugRow label="Audio started" value={String(avatar.debug.audioPlaybackStarted)} />
            <DebugRow label="Audio blocked" value={String(avatar.debug.audioPlaybackBlocked)} />
            <DebugRow label="Listening" value={String(stt.isListening)} />
            <DebugRow label="Speaking" value={String(avatar.isSpeaking)} />
            <DebugRow label="Phase" value={interactionPhase} />
            <DebugRow label="Session" value={avatar.session?.sessionId.slice(0, 8) ?? "-"} />
          </div>
          <DebugBlock label="Partial transcript" value={stt.partialTranscript} />
          <DebugBlock label="Final utterance" value={latestUserUtterance} />
          <DebugBlock label="Spoken response" value={latestSpokenResponse} />
          <DebugBlock
            label="Router payload"
            value={latestRouterPayload ? JSON.stringify(latestRouterPayload, null, 2) : ""}
          />
          <DebugBlock
            label="Router response"
            value={latestRouterResponse ? JSON.stringify(latestRouterResponse, null, 2) : ""}
          />
        </div>
      ) : null}
    </div>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-1 font-mono text-[11px] text-white/82">{value || "-"}</p>
    </div>
  );
}

function DebugBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</p>
      <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-white/78">
        {value || "-"}
      </pre>
    </div>
  );
}
