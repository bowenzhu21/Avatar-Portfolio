"use client";

import Image from "next/image";
import { experienceScreens } from "@/data/experienceScreens";

export function ExperienceApp({ screenId }: { screenId: keyof typeof experienceScreens }) {
  const screen = experienceScreens[screenId];

  return (
    <div
      className="h-full overflow-y-auto px-4 pb-6 pt-5"
      style={{ background: screen.background }}
    >
      <div className="space-y-4">
        <section className="rounded-[2rem] border border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.18))] p-5 shadow-[0_24px_52px_rgba(31,38,60,0.16)] backdrop-blur-[34px]">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.25rem] border border-white/62 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.48))] shadow-[0_14px_28px_rgba(25,30,48,0.16)] backdrop-blur-[22px]">
              <Image
                src={screen.iconSrc}
                alt={screen.title}
                fill
                sizes="64px"
                className="object-cover"
                priority
              />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-[0.66rem] font-semibold uppercase tracking-[0.24em]"
                style={{ color: screen.accent }}
              >
                {screenId === "school" ? "Education" : "Experience"}
              </p>
              <h1 className="mt-1 text-[1.7rem] font-semibold tracking-[-0.05em] text-[#172033]">
                {screen.title}
              </h1>
              <p className="mt-1 text-[0.84rem] font-medium text-[#33415d]">{screen.role}</p>
              <p className="mt-1 text-[0.75rem] text-[#50617e]">
                {screen.date}
                {screen.location ? ` | ${screen.location}` : ""}
              </p>
            </div>
          </div>

          {screen.description ? (
            <p className="mt-4 text-[0.82rem] leading-6 text-[#25324a]">{screen.description}</p>
          ) : null}
        </section>

        {screen.bullets.length ? (
          <section className="rounded-[2rem] border border-white/42 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.16))] p-4 shadow-[0_24px_52px_rgba(31,38,60,0.14)] backdrop-blur-[34px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-[-0.03em] text-[#172033]">
                Highlights
              </h2>
            </div>

            <ul className="space-y-2.5">
              {screen.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-[1.35rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.2))] px-4 py-3.5 text-[0.78rem] leading-5 text-[#24314a] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-[20px]"
                >
                  <div className="flex gap-3">
                    <span
                      className="mt-[0.42rem] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: screen.accent }}
                    />
                    <span>{bullet}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
