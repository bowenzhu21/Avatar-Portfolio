"use client";

import Image from "next/image";

const adaptBullets = [
  "Built a 3-stage OpenAI pipeline to generate, validate & repair TypeScript components by parsing compiler errors into structured context for targeted re-prompting, isolating failure modes across imports, props & type violations.",
  "Achieved 82% prompt-to-render success across 200 prompts via max-iteration budgeting and failure mode logging.",
];

export function AdaptApp() {
  return (
    <div
      className="relative h-full overflow-y-auto text-white"
      style={{
        backgroundImage:
          'linear-gradient(180deg,rgba(8,10,18,0.2),rgba(8,10,18,0.58)), url("/adapt/adapt_bg.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(126,228,255,0.18),transparent_26%)]" />

      <div className="relative z-10 px-4 pb-5 pt-7">
        <div className="space-y-4">
          <section className="px-1 pt-1">
            <div className="max-w-[29rem]">
              <h1 className="text-[2rem] font-semibold tracking-[-0.055em] text-white">
                Adapt UI
              </h1>

              <div className="relative mt-3 aspect-[1.7/1] overflow-hidden rounded-[1.2rem]">
                <Image
                  src="/adapt/adapt.png"
                  alt="Adapt UI preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 460px"
                  className="object-contain"
                  priority
                />
              </div>

              <p className="mt-3 text-[0.86rem] leading-6 text-white/88">
                Adapt is a prompt-driven UI system that translates natural language into
                structured, working interfaces, enabling fast iteration and dynamic interface
                generation.
              </p>

              <div className="mt-4 flex gap-2">
                <a
                  href="https://github.com/bowenzhu21/Adapt-UI"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/18 bg-white/12 px-3.5 py-2 text-[0.72rem] font-medium text-white shadow-[0_8px_24px_rgba(8,10,18,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/18 hover:shadow-[0_14px_30px_rgba(8,10,18,0.18)]"
                >
                  GitHub
                </a>
                <a
                  href="https://adapt-ui.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cyan-100/22 bg-cyan-300/18 px-3.5 py-2 text-[0.72rem] font-medium text-white shadow-[0_8px_24px_rgba(8,10,18,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300/26 hover:shadow-[0_14px_30px_rgba(8,10,18,0.18)]"
                >
                  Demo
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
              {adaptBullets.map((bullet) => (
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
