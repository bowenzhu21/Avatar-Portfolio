"use client";

import { ProjectAppShell } from "@/components/projects/ProjectAppShell";

const auraBullets = [
  "Built Aura, a real-time voice interface that enables conversational interaction with software using a streaming pipeline of STT, LLM reasoning, and TTS.",
  "Designed a low-latency, stateful voice system using LiveKit, ElevenLabs, and Gemini, supporting real-time audio streaming, intent routing, and multi-turn interaction.",
];

export function AuraApp() {
  return (
    <ProjectAppShell
      title="Aura"
      backgroundImageSrc="/aura/aura_bg.jpg"
      summary="Aura is a real-time voice interface that lets you interact with software using natural conversation, powered by a live streaming pipeline and AI-driven responses."
      bullets={auraBullets}
      preview={{
        src: "/aura/architecture.png",
        alt: "Aura architecture preview",
        fit: "contain",
        paddingClassName: "p-4",
        label: "Architecture",
      }}
      links={[
        {
          title: "GitHub",
          href: "https://github.com/bowenzhu21/Aura-Dev",
          iconSrc: "/appicons/github.svg",
        },
      ]}
    />
  );
}
