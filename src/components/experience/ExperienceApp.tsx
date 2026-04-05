"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { experienceScreens } from "@/data/experienceScreens";

const experienceTabs = [
  { id: "home", label: "Home", iconSrc: "/appicons/home.webp" },
  { id: "highlights", label: "Highlights", iconSrc: "/appicons/highlights.png" },
] as const;

type ExperienceTabId = (typeof experienceTabs)[number]["id"];

const navGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)), linear-gradient(135deg,rgba(255,255,255,0.012),rgba(255,255,255,0.004))",
} as const;

const liquidGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06)), linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))",
} as const;

export function ExperienceApp({ screenId }: { screenId: keyof typeof experienceScreens }) {
  const screen = experienceScreens[screenId];
  const [activeTab, setActiveTab] = useState<ExperienceTabId>("home");

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: screen.background }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col text-[#172033]">
        <header className="border-b border-white/22 px-5 pb-5 pt-5 backdrop-blur-[18px]">
          <h1 className="text-[2.1rem] font-semibold tracking-[-0.07em] text-[#172033]">
            {screen.title}
          </h1>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full overflow-y-auto px-5 pb-28 pt-5"
            >
              {activeTab === "home" ? (
                <OverviewPage screenId={screenId} />
              ) : (
                <HighlightsPage screenId={screenId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav
          className="absolute inset-x-7 bottom-5 z-20 overflow-hidden rounded-[1.7rem] border border-white/18 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-[22px]"
          style={navGlassStyle}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/72 to-transparent" />
          <div className="absolute left-6 top-0 h-[55%] w-[34%] rounded-full bg-white/[0.12] blur-2xl" />
          <div className="absolute right-10 top-[18%] h-[38%] w-[22%] rounded-full bg-white/[0.05] blur-xl" />
          <div className="absolute inset-0 bg-white/[0.008]" />
          <div className="relative grid grid-cols-2 gap-1 px-3 py-1.5">
            {experienceTabs.map((tab) => {
              const active = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`mx-auto w-[3.15rem] rounded-[1.1rem] px-1 py-1.5 text-center transition ${
                    active ? "bg-white/[0.035]" : "hover:bg-white/[0.025]"
                  }`}
                  aria-pressed={active}
                  aria-label={tab.label}
                >
                  <div className="relative mx-auto h-6 w-6">
                    <Image
                      src={tab.iconSrc}
                      alt={`${tab.label} icon`}
                      fill
                      sizes="24px"
                      className={`object-contain transition ${
                        active
                          ? "scale-105 opacity-100 brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.14)]"
                          : "opacity-68 brightness-0 invert"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function OverviewPage({
  screenId,
}: {
  screenId: keyof typeof experienceScreens;
}) {
  const screen = experienceScreens[screenId];
  const typeLabel = screenId === "school" ? "Education" : "Experience";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/26 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))]" />
        <div className="relative flex min-h-[18rem] flex-col justify-between p-5">
          <div className="relative h-16 w-16 overflow-hidden rounded-[1.25rem] border border-white/50 shadow-[0_14px_28px_rgba(25,30,48,0.14)]">
            <Image
              src={screen.iconSrc}
              alt={screen.title}
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>

          <div className="max-w-[18rem]">
            <p
              className="text-[10px] uppercase tracking-[0.26em]"
              style={{ color: `${screen.accent}` }}
            >
              {typeLabel}
            </p>
            <p className="mt-2 text-[1.05rem] font-medium leading-6 text-[#172033]">
              {screen.role}
            </p>
            <p className="mt-1 text-[0.78rem] text-[#41516d]">
              {screen.date}
              {screen.location ? ` | ${screen.location}` : ""}
            </p>
          </div>
        </div>
      </div>

      {screen.description ? (
        <div className="border-l pl-4" style={{ borderColor: `${screen.accent}55` }}>
          <p className="text-[0.88rem] leading-7 text-[#23314a]">{screen.description}</p>
        </div>
      ) : null}
    </div>
  );
}

function HighlightsPage({
  screenId,
}: {
  screenId: keyof typeof experienceScreens;
}) {
  const screen = experienceScreens[screenId];

  if (!screen.bullets.length) {
    return (
      <div
        className="rounded-[1.7rem] border border-white/22 px-4 py-4 text-[0.82rem] leading-6 text-[#31415e] backdrop-blur-[20px]"
        style={liquidGlassStyle}
      >
        No detailed highlights have been added for this experience yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-0">
        {screen.bullets.map((bullet, index) => {
          const isLast = index === screen.bullets.length - 1;

          return (
            <li key={bullet} className={`relative pl-12 ${isLast ? "" : "pb-8"}`}>
              {!isLast ? (
                <span className="absolute left-[0.96rem] top-9 bottom-0 w-px bg-[#172033]/12" />
              ) : null}
              <span
                className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-white/18 text-[11px] font-semibold text-[#172033] backdrop-blur-[16px]"
                style={{ borderColor: `${screen.accent}55` }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="pt-1 text-[0.82rem] leading-6 text-[#22314a]">{bullet}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
