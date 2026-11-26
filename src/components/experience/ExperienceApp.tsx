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

export function ExperienceApp({ screenId }: { screenId: keyof typeof experienceScreens }) {
  const screen = experienceScreens[screenId];
  const [activeTab, setActiveTab] = useState<ExperienceTabId>("home");
  const isLightText = screen.textTone === "light";
  const shellStyle = screen.backgroundImageSrc
    ? {
        backgroundImage: `url("${screen.backgroundImageSrc}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: screen.background };

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.45rem]"
      style={shellStyle}
    >
      <div className={`relative z-10 flex min-h-0 flex-1 flex-col ${isLightText ? "text-white" : "text-[#172033]"}`}>
        <header className={`border-b px-5 pb-5 pt-5 ${isLightText ? "glass-surface bg-black/10" : "glass-surface-light bg-white/[0.16]"}`}>
          <h1 className={`text-[2.1rem] font-semibold tracking-[-0.07em] ${isLightText ? "text-white" : "text-[#172033]"}`}>
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

        {screen.status !== "incoming" ? <nav
          className={`absolute inset-x-7 bottom-5 z-20 overflow-hidden rounded-[1.7rem] border ${isLightText ? "glass-surface-strong bg-black/[0.16]" : "glass-surface-light bg-white/40"}`}
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
                    isLightText
                      ? active ? "bg-white/[0.16]" : "hover:bg-white/10"
                      : active ? "bg-black/[0.08]" : "hover:bg-black/5"
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
                      className={`object-contain brightness-0 transition ${isLightText ? "invert" : ""} ${active ? "scale-105 opacity-100" : "opacity-70"}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </nav> : null}
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
  const typeLabel = screenId === "school" ? "Education" : screen.status === "incoming" ? "Up next" : "Experience";
  const isLightText = screen.textTone === "light";

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-[2rem] border ${isLightText ? "glass-surface bg-black/[0.12]" : "glass-surface-light bg-white/[0.12]"}`}>
        <div className={`absolute inset-0 ${
          isLightText
            ? "bg-[linear-gradient(180deg,rgba(0,0,0,0.32),rgba(0,0,0,0.18))]"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))]"
        }`} />
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
            <p className={`mt-2 text-[1.05rem] font-medium leading-6 ${isLightText ? "text-white" : "text-[#172033]"}`}>
              {screen.role}
            </p>
            <p className={`mt-1 text-[0.78rem] ${isLightText ? "text-white/78" : "text-[#41516d]"}`}>
              {screen.date}
              {screen.location ? ` | ${screen.location}` : ""}
            </p>
          </div>
        </div>
      </div>

      {screen.description ? (
        <div className="border-l pl-4" style={{ borderColor: `${screen.accent}55` }}>
          <p className={`text-[0.88rem] leading-7 ${isLightText ? "text-white/84" : "text-[#23314a]"}`}>{screen.description}</p>
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
  const isLightText = screen.textTone === "light";

  if (!screen.bullets.length) {
    return (
      <div
        className={`rounded-[1.7rem] border px-4 py-4 text-[0.82rem] leading-6 ${isLightText ? "glass-surface bg-black/[0.12] text-white/84" : "glass-surface-light bg-white/[0.12] text-[#31415e]"}`}
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
                <span className={`absolute left-[0.96rem] top-9 bottom-0 w-px ${isLightText ? "bg-white/[0.16]" : "bg-[#172033]/12"}`} />
              ) : null}
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-white/[0.12] text-[11px] font-semibold ${isLightText ? "glass-surface text-white" : "glass-surface-light text-[#172033]"}`}
                style={{ borderColor: `${screen.accent}55` }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className={`pt-1 text-[0.82rem] leading-6 ${isLightText ? "text-white/84" : "text-[#22314a]"}`}>{bullet}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
