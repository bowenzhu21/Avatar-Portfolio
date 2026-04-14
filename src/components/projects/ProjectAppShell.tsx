"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface ProjectAppLink {
  title: string;
  href: string;
  iconSrc: string;
}

interface ProjectPreview {
  src: string;
  alt: string;
  fit?: "contain" | "cover";
  paddingClassName?: string;
  label?: string;
}

interface ProjectGalleryImage extends ProjectPreview {
  id: number;
}

interface ProjectAppShellProps {
  title: string;
  backgroundImageSrc: string;
  summary: string;
  bullets: string[];
  preview: ProjectPreview;
  galleryImages?: ProjectGalleryImage[];
  links: ProjectAppLink[];
  shellTone?: "dark" | "light";
}

const projectTabs = [
  { id: "overview", label: "Overview", iconSrc: "/appicons/home.webp" },
  { id: "highlights", label: "Highlights", iconSrc: "/appicons/highlights.png" },
  { id: "gallery", label: "Gallery", iconSrc: "/appicons/gallery.png" },
  { id: "links", label: "Links", iconSrc: "/appicons/links.png" },
] as const;

type ProjectTabId = (typeof projectTabs)[number]["id"];

const liquidGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05)), linear-gradient(135deg,rgba(8,12,20,0.34),rgba(8,12,20,0.14))",
} as const;

const navGlassStyle = {
  backgroundImage:
    "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)), linear-gradient(135deg,rgba(255,255,255,0.012),rgba(255,255,255,0.004))",
} as const;

export function ProjectAppShell({
  title,
  backgroundImageSrc,
  summary,
  bullets,
  preview,
  galleryImages,
  links,
  shellTone = "dark",
}: ProjectAppShellProps) {
  const [activeTab, setActiveTab] = useState<ProjectTabId>("overview");
  const resolvedGalleryImages = galleryImages?.length
    ? galleryImages
    : [{ id: 1, ...preview }];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isLightTone = shellTone === "light";

  const activeGalleryImage =
    resolvedGalleryImages[activeImageIndex] ?? resolvedGalleryImages[0];

  function showPreviousImage() {
    setActiveImageIndex((current) =>
      current > 0 ? current - 1 : resolvedGalleryImages.length - 1,
    );
  }

  function showNextImage() {
    setActiveImageIndex((current) =>
      current < resolvedGalleryImages.length - 1 ? current + 1 : 0,
    );
  }

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.45rem] ${
        isLightTone ? "text-[#121416]" : "text-white"
      }`}
      style={{
        backgroundImage: `url("${backgroundImageSrc}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header
          className={`px-5 pb-5 pt-5 backdrop-blur-[18px] ${
            isLightTone ? "border-b border-black/12" : "border-b border-white/10"
          }`}
        >
          <h1
            className={`text-[2.25rem] font-semibold tracking-[-0.07em] ${
              isLightTone ? "text-[#101214]" : "text-white"
            }`}
          >
            {title}
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
                <OverviewPage
                  summary={summary}
                  title={title}
                  preview={preview}
                  shellTone={shellTone}
                />
              ) : activeTab === "highlights" ? (
                <HighlightsPage bullets={bullets} shellTone={shellTone} />
              ) : activeTab === "gallery" ? (
                <GalleryPage
                  title={title}
                  activeImage={activeGalleryImage}
                  activeImageIndex={activeImageIndex}
                  images={resolvedGalleryImages}
                  onSelectImage={setActiveImageIndex}
                  onPrevious={showPreviousImage}
                  onNext={showNextImage}
                />
              ) : (
                <LinksPage links={links} />
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
            {projectTabs.map((tab) => {
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
  summary,
  title,
  preview,
  shellTone,
}: {
  summary: string;
  title: string;
  preview: ProjectPreview;
  shellTone: "dark" | "light";
}) {
  const isLightTone = shellTone === "light";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="relative aspect-[1.08/1] bg-black/15">
          <Image
            src={preview.src}
            alt={preview.alt}
            fill
            sizes="(max-width: 768px) 92vw, 360px"
            className={`${preview.fit === "cover" ? "object-cover" : "object-contain"} ${
              preview.paddingClassName ?? ""
            }`}
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.08)_36%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-white/56">
              {preview.label ?? "Preview"}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{title}</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-white/42">01</span>
        </div>
      </div>

      <div
        className={`border-l pl-4 ${
          isLightTone ? "border-black/18" : "border-white/22"
        }`}
      >
        <p
          className={`text-[0.88rem] leading-7 ${
            isLightTone ? "text-black/82" : "text-white/84"
          }`}
        >
          {summary}
        </p>
      </div>
    </div>
  );
}

function HighlightsPage({
  bullets,
  shellTone,
}: {
  bullets: string[];
  shellTone: "dark" | "light";
}) {
  const isLightTone = shellTone === "light";

  return (
    <div className="space-y-6">
      <ol className="space-y-0">
        {bullets.map((bullet, index) => {
          const isLast = index === bullets.length - 1;

          return (
            <li key={bullet} className={`relative pl-12 ${isLast ? "" : "pb-8"}`}>
              {!isLast ? (
                <span
                  className={`absolute left-[0.96rem] top-9 bottom-0 w-px ${
                    isLightTone ? "bg-black/14" : "bg-white/12"
                  }`}
                />
              ) : null}
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold backdrop-blur-[16px] ${
                  isLightTone
                    ? "border-black/18 bg-black/[0.03] text-black/82"
                    : "border-white/22 bg-white/6 text-white/84"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p
                className={`pt-1 text-[0.82rem] leading-6 ${
                  isLightTone ? "text-black/82" : "text-white/84"
                }`}
              >
                {bullet}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GalleryPage({
  title,
  activeImage,
  activeImageIndex,
  images,
  onSelectImage,
  onPrevious,
  onNext,
}: {
  title: string;
  activeImage: ProjectGalleryImage;
  activeImageIndex: number;
  images: ProjectGalleryImage[];
  onSelectImage: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="relative aspect-[1.08/1] bg-black/15">
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            sizes="(max-width: 768px) 92vw, 360px"
            className={`${activeImage.fit === "cover" ? "object-cover" : "object-contain"} ${
              activeImage.paddingClassName ?? ""
            }`}
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.1)_36%,rgba(0,0,0,0.34)_100%)]" />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/26 text-[1.35rem] text-white/86 backdrop-blur-xl"
              aria-label={`Previous ${title} image`}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/26 text-[1.35rem] text-white/86 backdrop-blur-xl"
              aria-label={`Next ${title} image`}
            >
              ›
            </button>
          </>
        ) : null}

        <div className="absolute bottom-4 right-4 rounded-full border border-white/12 bg-black/16 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/58 backdrop-blur-xl">
          {activeImageIndex + 1}/{images.length}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((image, index) => {
          const active = index === activeImageIndex;

          return (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelectImage(index)}
              className={`relative shrink-0 overflow-hidden rounded-[1rem] border transition ${
                active
                  ? "border-white/38 opacity-100"
                  : "border-white/10 opacity-66 hover:opacity-90"
              }`}
              aria-label={`Show ${title} image ${image.id}`}
            >
              <div className="relative h-[4.75rem] w-[4.75rem] bg-black/12">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="76px"
                  className={`${image.fit === "cover" ? "object-cover" : "object-contain"} ${
                    image.paddingClassName ?? ""
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LinksPage({ links }: { links: ProjectAppLink[] }) {
  return (
    <div className="space-y-6">
      <div className="border-y border-white/10">
        {links.map((link) => (
          <ActionRow
            key={`${link.title}-${link.href}`}
            title={link.title}
            href={link.href}
            iconSrc={link.iconSrc}
          />
        ))}
      </div>
    </div>
  );
}

function ActionRow({
  title,
  href,
  iconSrc,
}: ProjectAppLink) {
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
