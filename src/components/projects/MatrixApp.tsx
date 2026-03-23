"use client";

import Image from "next/image";
import { useState } from "react";

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

export function MatrixApp() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = matrixImages[activeIndex] ?? matrixImages[0];

  function showPrevious() {
    setActiveIndex((current) => (current > 0 ? current - 1 : matrixImages.length - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current < matrixImages.length - 1 ? current + 1 : 0));
  }

  return (
    <div
      className="relative h-full overflow-y-auto text-white"
      style={{
        backgroundImage:
          'linear-gradient(180deg,rgba(8,11,18,0.18),rgba(7,10,16,0.62)), url("/matrix/matrix_bg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(149,217,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_24%)]" />

      <div className="relative z-10 px-4 pb-5 pt-7">
        <div className="space-y-4">
          <section className="px-1 pt-1">
            <h1 className="text-[2rem] font-semibold tracking-[-0.055em] text-white">Matrix</h1>

            <div className="relative mt-4">
              <div className="relative aspect-[1.18/1] overflow-hidden rounded-[1.55rem] border border-white/10 bg-white/6 shadow-[0_20px_52px_rgba(5,10,20,0.16)] backdrop-blur-[30px]">
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  sizes="(max-width: 768px) 90vw, 320px"
                  className="object-cover"
                  priority
                />
              </div>

              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-2 top-1/2 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[1.8rem] text-white/92 transition hover:text-white"
                aria-label="Previous Matrix image"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={showNext}
                className="absolute right-2 top-1/2 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[1.8rem] text-white/92 transition hover:text-white"
                aria-label="Next Matrix image"
              >
                ›
              </button>

              <div className="mt-3 flex justify-center gap-1.5">
                {matrixImages.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-1.5 rounded-full transition ${
                      index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/42"
                    }`}
                    aria-label={`Show Matrix image ${image.id}`}
                  />
                ))}
              </div>
            </div>

            <p className="mt-4 max-w-[29rem] text-[0.86rem] leading-6 text-white/88">
              Matrix is a system for simulating agent-based environments, enabling the
              generation, interaction, and analysis of complex networks and behavioral
              dynamics.
            </p>

            <div className="mt-4 flex gap-2">
              <a
                href="https://github.com/bowenzhu21/matrix"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/18 bg-white/12 px-3.5 py-2 text-[0.72rem] font-medium text-white shadow-[0_8px_24px_rgba(8,10,18,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/18 hover:shadow-[0_14px_30px_rgba(8,10,18,0.18)]"
              >
                GitHub
              </a>
              <a
                href="https://devpost.com/software/matrix-uj8gdk"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-cyan-100/22 bg-cyan-300/18 px-3.5 py-2 text-[0.72rem] font-medium text-white shadow-[0_8px_24px_rgba(8,10,18,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300/26 hover:shadow-[0_14px_30px_rgba(8,10,18,0.18)]"
              >
                Devpost
              </a>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.07))] p-4 shadow-[0_20px_52px_rgba(5,10,20,0.16)] backdrop-blur-[30px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.92rem] font-semibold tracking-[-0.03em] text-white">
                Highlights
              </h2>
            </div>

            <ul className="space-y-2.5">
              {matrixBullets.map((bullet) => (
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
