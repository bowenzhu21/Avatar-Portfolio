"use client";

import Image from "next/image";
import { useState } from "react";

const elbowImages = [
  { id: 1, src: "/elbowexo/1.png", alt: "Elbow Exo preview 1" },
  { id: 2, src: "/elbowexo/2.PNG", alt: "Elbow Exo preview 2" },
];

const elbowBullets = [
  "Designed and built a wearable elbow sensing system using embedded IMU sensors and microcontrollers to capture real-time arm motion data.",
  "Developed a data processing pipeline to stream, synchronize, and analyze sensor inputs, enabling accurate flexion tracking and movement insights.",
];

export function ElbowExoApp() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = elbowImages[activeIndex] ?? elbowImages[0];

  function showPrevious() {
    setActiveIndex((current) => (current > 0 ? current - 1 : elbowImages.length - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current < elbowImages.length - 1 ? current + 1 : 0));
  }

  return (
    <div
      className="relative h-full overflow-y-auto text-white"
      style={{
        backgroundImage:
          'linear-gradient(180deg,rgba(10,12,18,0.22),rgba(9,11,15,0.62)), url("/elbowexo/elbow_bg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(117,228,255,0.14),transparent_26%)]" />

      <div className="relative z-10 px-4 pb-5 pt-7">
        <div className="space-y-4">
          <section className="px-1 pt-1">
            <div className="max-w-[29rem]">
              <h1 className="text-[2rem] font-semibold tracking-[-0.055em] text-white">
                Elbow Exo
              </h1>

              <div className="relative mt-3">
                <div className="relative aspect-[1.35/1] overflow-hidden rounded-[1.2rem]">
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 460px"
                    className="object-cover"
                    priority
                  />
                </div>

                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-2 top-1/2 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[1.8rem] text-white/92 transition hover:text-white"
                  aria-label="Previous Elbow Exo image"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-2 top-1/2 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[1.8rem] text-white/92 transition hover:text-white"
                  aria-label="Next Elbow Exo image"
                >
                  ›
                </button>
              </div>

              <p className="mt-3 text-[0.86rem] leading-6 text-white/88">
                Elbow Exo is a wearable sensing system that tracks arm motion in real time
                using embedded sensors, enabling analysis and feedback for biomechanics and
                human movement.
              </p>

              <div className="mt-4 flex gap-2">
                <a
                  href="https://github.com/bowenzhu21/ElbowExo"
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
              {elbowBullets.map((bullet) => (
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
