"use client";

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { usePortfolioStore } from "@/store/usePortfolioStore";

interface RightSideCardProps {
  children: React.ReactNode;
}

export function RightSideCard({ children }: RightSideCardProps) {
  const isCardOpen = usePortfolioStore((state) => state.isCardOpen);

  return (
    <AnimatePresence initial={false}>
      {isCardOpen ? (
        <motion.aside
          key="portfolio-card"
          initial={{ opacity: 0, x: 36, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={clsx(
            "panel-blur pointer-events-auto w-full max-w-[34rem] rounded-[2rem] border border-white/12 bg-ink-900/72 p-6 shadow-panel",
            "md:w-[34vw] md:min-w-[26rem] md:max-w-[35vw]",
          )}
        >
          {children}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
