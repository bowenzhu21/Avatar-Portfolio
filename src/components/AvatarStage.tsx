"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { avatarConfig } from "@/config/avatar";
import { useAvatarSpeech } from "@/hooks/useAvatarSpeech";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function AvatarStage() {
  const { isSpeaking, audioLevel } = useAvatarSpeech();
  const latestUserUtterance = usePortfolioStore((state) => state.latestUserUtterance);
  const level = isSpeaking ? Math.max(audioLevel, 0.08) : 0;
  const footerLabel = latestUserUtterance ? `Latest prompt: ${latestUserUtterance}` : "";

  return (
    <div className="relative min-h-[445px] overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#050505] shadow-[0_32px_100px_rgba(0,0,0,0.42)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(0,190,255,0.15),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)_28%,rgba(255,255,255,0.05)_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative z-10 flex h-full min-h-[445px] flex-col justify-between p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/48">
              {avatarConfig.role}
            </p>
            <h2 className="mt-2 text-[2.1rem] font-semibold tracking-[-0.06em]">
              {avatarConfig.name}
            </h2>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-1">
          <motion.div
            animate={{
              scale: isSpeaking ? 1 + level * 0.08 : 1,
              y: isSpeaking ? -level * 6 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative flex h-[20.75rem] w-[20.75rem] items-center justify-center"
          >
            {[0, 1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                animate={
                  isSpeaking
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
                  repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                  delay: ring * 0.14,
                }}
                className="absolute inset-0 rounded-full border border-cyan-300/22"
              />
            ))}

            <div className="absolute inset-[1.2rem] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] blur-md" />
            <div className="relative h-[16.25rem] w-[16.25rem] overflow-hidden rounded-full border border-white/14 bg-white/6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
              <Image
                src={avatarConfig.profileImageSrc}
                alt={avatarConfig.canvasLabel}
                fill
                priority
                sizes="300px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>

        <div className="space-y-5">
          <p className="min-h-[1.25rem] text-center text-xs uppercase tracking-[0.24em] text-white/34">
            {footerLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
