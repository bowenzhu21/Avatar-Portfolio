"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { avatarConfig } from "@/config/avatar";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function AvatarStage() {
  const { isSpeaking, audioLevel } = useAvatarSpeech();
  const reducedMotion = useReducedMotion();
  const latestUserUtterance = usePortfolioStore((state) => state.latestUserUtterance);
  const level = isSpeaking ? Math.max(audioLevel, 0.08) : 0;
  const footerLabel = latestUserUtterance ? `Latest prompt: ${latestUserUtterance}` : "";

  return (
    <div className="relative min-h-[116px] overflow-hidden rounded-[2rem] border border-white/14 bg-black/40 shadow-[0_32px_100px_rgba(0,0,0,0.42)] backdrop-blur-[6px] lg:min-h-[min(445px,55dvh)] lg:rounded-[2.6rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(0,190,255,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.006)_28%,rgba(255,255,255,0.015)_100%)]" />
      <div className="absolute inset-x-10 top-0 h-24 rounded-b-[2.4rem] bg-white/7 blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[116px] items-center justify-between gap-4 px-5 py-4 text-white lg:min-h-[min(445px,55dvh)] lg:flex-col lg:items-stretch lg:gap-0 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/65 lg:text-[11px]">
              {avatarConfig.role}
            </p>
            <h2 className="mt-1 text-[1.65rem] font-semibold tracking-[-0.06em] lg:mt-2 lg:text-[2.1rem]">
              {avatarConfig.name}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center lg:flex-1 lg:py-1">
          <motion.div
            animate={{
              scale: isSpeaking && !reducedMotion ? 1 + level * 0.08 : 1,
              y: isSpeaking && !reducedMotion ? -level * 6 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative mx-auto grid aspect-square w-[76px] max-w-full shrink-0 place-items-center self-center lg:w-[min(20.75rem,36dvh)]"
          >
            {[0, 1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                animate={
                  isSpeaking && !reducedMotion
                    ? {
                        scale: [1, 1.08 + ring * 0.12 + level * 0.18, 1],
                        opacity: [0.12, 0.3 - ring * 0.04, 0.08],
                      }
                    : {
                        scale: 1,
                        opacity: ring === 0 ? 0.16 : 0.08,
                      }
                }
                transition={{
                  duration: 1.4 + ring * 0.2,
                  repeat: isSpeaking && !reducedMotion ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                  delay: ring * 0.14,
                }}
                className="absolute inset-0 rounded-full border border-cyan-300/22"
              />
            ))}

            <div className="absolute inset-[5.8%] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] blur-md" />
            <div
              className="relative z-10 h-auto shrink-0 overflow-hidden rounded-full border border-white/14 bg-white/6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
              style={{ width: "78.3%", aspectRatio: "1 / 1", flex: "0 0 auto" }}
            >
              <Image
                src={avatarConfig.profileImageSrc}
                alt={avatarConfig.canvasLabel}
                fill
                priority
                sizes="(max-width: 1023px) 76px, 332px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>

        <div className="hidden space-y-5 lg:block">
          <p className="min-h-[1.25rem] text-center text-xs uppercase tracking-[0.24em] text-white/34">
            {footerLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
