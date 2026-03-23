"use client";

import Image from "next/image";

const auraBullets = [
  "Built Aura, a real-time voice interface that enables conversational interaction with software using a streaming pipeline of STT, LLM reasoning, and TTS.",
  "Designed a low-latency, stateful voice system using LiveKit, ElevenLabs, and Gemini, supporting real-time audio streaming, intent routing, and multi-turn interaction.",
];

export function AuraApp() {
  return (
    <div
      className="relative h-full overflow-y-auto text-white"
      style={{
        backgroundImage:
          'linear-gradient(180deg,rgba(8,10,18,0.2),rgba(8,10,18,0.58)), url("/aura/aura_bg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(116,226,255,0.18),transparent_26%)]" />

      <div className="relative z-10 px-4 pb-5 pt-7">
        <div className="space-y-4">
          <section className="px-1 pt-1">
            <div className="max-w-[29rem]">
              <h1 className="text-[2rem] font-semibold tracking-[-0.055em] text-white">Aura</h1>

              <div className="relative mt-3 aspect-[1.7/1] overflow-hidden rounded-[1.2rem]">
                <Image
                  src="/aura/architecture.png"
                  alt="Aura architecture preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 460px"
                  className="object-contain"
                  priority
                />
              </div>

              <p className="mt-3 text-[0.86rem] leading-6 text-white/88">
                Aura is a real-time voice interface that lets you interact with software using
                natural conversation, powered by a live streaming pipeline and AI-driven
                responses.
              </p>

              <div className="mt-4 flex gap-2">
                <a
                  href="https://github.com/bowenzhu21/Aura-Dev"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/18 bg-white/12 px-3.5 py-2 text-[0.72rem] font-medium text-white shadow-[0_8px_24px_rgba(8,10,18,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/18 hover:shadow-[0_14px_30px_rgba(8,10,18,0.18)]"
                >
                  GitHub
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.07))] p-4 shadow-[0_20px_52px_rgba(5,10,20,0.16)] backdrop-blur-[30px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.92rem] font-semibold tracking-[-0.03em] text-white">
                Highlights
              </h2>
            </div>

            <ul className="space-y-2.5">
              {auraBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-[0.78rem] leading-5 text-white/86"
                >
                  <div className="flex gap-3">
                    <span className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-100/90" />
                    <span>{bullet}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
