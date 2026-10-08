"use client";

import { MotionConfig } from "framer-motion";
import { useState } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";

import { AvatarStage } from "@/components/AvatarStage";
import { BackgroundAudioPlayer } from "@/components/BackgroundAudioPlayer";
import { MicToggleButton } from "@/components/MicToggleButton";
import { RightSideCard } from "@/components/RightSideCard";
import { SubtitleBar } from "@/components/SubtitleBar";
import { stopRealtimeSTTListening } from "@/hooks/useRealtimeSTT";
import { sharedAvatarSpeechClient } from "@/lib/avatar-speech";
import { cancelPendingPortfolioPrompt } from "@/lib/prompt-request";

interface OverlayShellProps {
  children: React.ReactNode;
}

export function OverlayShell({ children }: OverlayShellProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  function toggleAssistant() {
    if (assistantOpen) {
      cancelPendingPortfolioPrompt();
      sharedAvatarSpeechClient.interrupt();
      void stopRealtimeSTTListening({ discardTranscript: true });
    }
    setAssistantOpen((value) => !value);
  }
  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-hidden bg-[#f4ede5]">
      <BackgroundAudioPlayer />
      <AmbientBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_16%_14%,rgba(255,241,225,0.26),transparent_18%),radial-gradient(circle_at_82%_20%,rgba(255,184,132,0.12),transparent_24%),radial-gradient(circle_at_52%_82%,rgba(255,146,92,0.08),transparent_30%),linear-gradient(180deg,rgba(52,28,18,0.14),rgba(78,48,34,0.06)_38%,rgba(28,14,10,0.16)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-start px-3 pb-8 pt-3 md:px-8 md:pt-6">
          <div className="grid w-full min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[376px_minmax(0,1fr)] lg:gap-8">
            <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
              <RightSideCard>{children}</RightSideCard>
            </div>

            <div className="order-1 flex min-h-0 min-w-0 flex-col justify-between lg:order-2 lg:min-h-[min(750px,calc(100dvh-72px))]">
              <div className="w-full max-w-full lg:max-w-[calc(100vw-376px-6rem)]">
                <AvatarStage />
              </div>

              <button
                type="button"
                aria-expanded={assistantOpen}
                aria-controls="portfolio-assistant-controls"
                onClick={toggleAssistant}
                className="mt-3 flex min-h-11 items-center justify-between rounded-2xl border border-white/25 bg-black/25 px-5 text-sm text-white backdrop-blur-xl lg:hidden"
              >
                <span>{assistantOpen ? "Close conversation" : "Ask Bowen"}</span>
                <span aria-hidden="true">{assistantOpen ? "−" : "+"}</span>
              </button>

              <div id="portfolio-assistant-controls" className={`${assistantOpen ? "flex" : "hidden"} mt-4 flex-col items-center gap-4 lg:flex lg:gap-5`}>
                <div className="pointer-events-auto w-full max-w-[760px]">
                  <SubtitleBar />
                </div>

                <div className="pointer-events-auto">
                  <MicToggleButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}
