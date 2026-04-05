"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const matrixSummary =
  "Matrix is a system for simulating agent-based environments, enabling the generation, interaction, and analysis of complex networks and behavioral dynamics.";

const matrixImages = [1, 2, 3, 4].map((index) => ({
  id: index,
  src: `/matrix/${index}.png`,
  alt: `Matrix preview ${index}`,
}));

const matrixBullets = [
  "Designed an artificial society of graph-node LLM agents modeled on human demographic & behavior patterns using Exa, propagating via weighted BFS scored by social proximity & societal influence, with Supermemory for context.",
  "Architected a distributed Modal pipeline supporting 100 concurrent DeepSeek-1.5B node agents across 25 GPUs, with 3 instances of DeepSeek-32B for orchestration on 15 GPUs.",
  "Built live avatars for node agents, processing expressions, tone & speech with <200 ms audio & visual response.",
];

const matrixTabs = [
  { id: "overview", label: "Overview", iconSrc: "/appicons/home.webp" },
  { id: "highlights", label: "Highlights", iconSrc: "/appicons/highlights.png" },
  { id: "gallery", label: "Gallery", iconSrc: "/appicons/gallery.png" },
  { id: "links", label: "Links", iconSrc: "/appicons/links.png" },
] as const;

type MatrixTabId = (typeof matrixTabs)[number]["id"];

const shellBackgroundStyle = {
  backgroundImage: 'url("/matrix/matrix_bg.jpg")',
  backgroundSize: "cover",
  backgroundPosition: "center",
} as const;

const liquidGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04)), linear-gradient(135deg,rgba(7,16,28,0.48),rgba(7,16,28,0.24))",
} as const;

const navGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)), linear-gradient(135deg,rgba(255,255,255,0.012),rgba(255,255,255,0.004))",
} as const;

export function MatrixApp() {
  const [activeTab, setActiveTab] = useState<MatrixTabId>("overview");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = matrixImages[activeImageIndex] ?? matrixImages[0];

  function showPreviousImage() {
    setActiveImageIndex((current) =>
      current > 0 ? current - 1 : matrixImages.length - 1,
    );
  }

  function showNextImage() {
    setActiveImageIndex((current) =>
      current < matrixImages.length - 1 ? current + 1 : 0,
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden text-white"
      style={shellBackgroundStyle}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="border-b border-white/10 px-5 pb-5 pt-5 backdrop-blur-[18px]">
          <h1 className="text-[2.25rem] font-semibold tracking-[-0.07em] text-white">
            Matrix
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
              {activeTab === "overview" ? (
                <OverviewPage />
              ) : activeTab === "highlights" ? (
                <HighlightsPage />
              ) : activeTab === "gallery" ? (
                <GalleryPage
                  activeImage={activeImage}
                  activeImageIndex={activeImageIndex}
                  onSelectImage={setActiveImageIndex}
                  onPrevious={showPreviousImage}
                  onNext={showNextImage}
                />
              ) : (
                <LinksPage />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav
          className="absolute inset-x-7 bottom-5 z-20 overflow-hidden rounded-[1.7rem] border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.14)] backdrop-blur-[22px]"
          style={navGlassStyle}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/72 to-transparent" />
          <div className="absolute left-6 top-0 h-[55%] w-[34%] rounded-full bg-white/[0.12] blur-2xl" />
          <div className="absolute right-10 top-[18%] h-[38%] w-[22%] rounded-full bg-white/[0.05] blur-xl" />
          <div className="absolute inset-0 bg-white/[0.008]" />
          <div className="relative grid grid-cols-4 gap-1 px-3 py-1.5">
            {matrixTabs.map((tab) => {
              const active = tab.id === activeTab;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`mx-auto w-[3.15rem] rounded-[1.1rem] px-1 py-1.5 text-center transition ${
                    active
                      ? "bg-white/[0.035]"
                      : "hover:bg-white/[0.025]"
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

function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
        <div className="relative aspect-[1.08/1]">
          <Image
            src="/matrix/1.png"
            alt="Matrix preview"
            fill
            sizes="(max-width: 768px) 92vw, 360px"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.1)_36%,rgba(0,0,0,0.68)_100%)]" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-white/56">
              Simulation View
            </p>
            <p className="mt-2 text-sm font-medium text-white">Agent environment preview</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">01</span>
        </div>
      </div>

      <div className="border-l border-cyan-200/32 pl-4">
        <p className="text-[0.88rem] leading-7 text-white/82">{matrixSummary}</p>
      </div>
    </div>
  );
}

function HighlightsPage() {
  return (
    <div className="space-y-6">
      <ol className="space-y-0">
        {matrixBullets.map((bullet, index) => {
          const isLast = index === matrixBullets.length - 1;

          return (
            <li key={bullet} className={`relative pl-12 ${isLast ? "" : "pb-8"}`}>
              {!isLast ? (
                <span className="absolute left-[0.96rem] top-9 bottom-0 w-px bg-white/12" />
              ) : null}
              <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/22 bg-white/6 text-[11px] font-semibold text-cyan-100 backdrop-blur-[16px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="pt-1 text-[0.82rem] leading-6 text-white/82">{bullet}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GalleryPage({
  activeImage,
  activeImageIndex,
  onSelectImage,
  onPrevious,
  onNext,
}: {
  activeImage: (typeof matrixImages)[number];
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.34)]">
        <div className="relative aspect-[1.08/1]">
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            sizes="(max-width: 768px) 92vw, 360px"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.14)_36%,rgba(0,0,0,0.42)_100%)]" />

        <button
          type="button"
          onClick={onPrevious}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/26 text-[1.35rem] text-white/86 backdrop-blur-xl"
          aria-label="Previous Matrix image"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={onNext}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/26 text-[1.35rem] text-white/86 backdrop-blur-xl"
          aria-label="Next Matrix image"
        >
          ›
        </button>

        <div className="absolute bottom-4 right-4 rounded-full border border-white/12 bg-black/22 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/58 backdrop-blur-xl">
          {activeImageIndex + 1}/{matrixImages.length}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {matrixImages.map((image, index) => {
          const active = index === activeImageIndex;

          return (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelectImage(index)}
              className={`relative shrink-0 overflow-hidden rounded-[1rem] border transition ${
                active
                  ? "border-cyan-300/55 opacity-100"
                  : "border-white/10 opacity-66 hover:opacity-90"
              }`}
              aria-label={`Show Matrix image ${image.id}`}
            >
              <div className="relative h-[4.75rem] w-[4.75rem]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LinksPage() {
  return (
    <div className="space-y-6">
      <div className="border-y border-white/10">
        <ActionRow
          title="GitHub"
          href="https://github.com/bowenzhu21/matrix"
          iconSrc="/appicons/github.svg"
        />
        <ActionRow
          title="Devpost"
          href="https://devpost.com/software/matrix-uj8gdk"
          iconSrc="/appicons/devpost.webp"
        />
      </div>
    </div>
  );
}

function ActionRow({
  title,
  href,
  iconSrc,
}: {
  title: string;
  href: string;
  iconSrc: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 px-1 py-4 transition hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3">
        <div
          className="relative h-10 w-10 overflow-hidden rounded-[0.85rem] border border-white/10 backdrop-blur-[18px]"
          style={liquidGlassStyle}
        >
          <Image
            src={iconSrc}
            alt={`${title} icon`}
            fill
            sizes="40px"
            className="object-contain p-2 brightness-0 invert"
          />
        </div>
        <span className="text-[0.9rem] font-medium text-white">{title}</span>
      </div>
      <span className="text-[1.1rem] text-white/34">›</span>
    </a>
  );
}
