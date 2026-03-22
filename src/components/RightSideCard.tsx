"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import clsx from "clsx";
import { usePortfolioStore } from "@/store/usePortfolioStore";

interface RightSideCardProps {
  children: React.ReactNode;
}

export function RightSideCard({ children }: RightSideCardProps) {
  const router = useRouter();
  const isCardOpen = usePortfolioStore((state) => state.isCardOpen);
  const setPhoneScreen = usePortfolioStore((state) => state.setPhoneScreen);
  const setActiveRoute = usePortfolioStore((state) => state.setActiveRoute);
  const setActiveEntity = usePortfolioStore((state) => state.setActiveEntity);
  const setActiveSection = usePortfolioStore((state) => state.setActiveSection);
  const setActiveCard = usePortfolioStore((state) => state.setActiveCard);

  function goHome() {
    setPhoneScreen({
      app: "home",
      view: "home",
      title: "Bowen",
      entityId: null,
      route: "/",
      card: "overview",
    });
    setActiveRoute("/");
    setActiveEntity(null);
    setActiveSection(null);
    setActiveCard("overview");
    router.push("/" as Route);
  }

  return (
    <AnimatePresence initial={false}>
      {isCardOpen ? (
        <motion.aside
          key="bowen-iphone"
          initial={{ opacity: 0, x: -56, scale: 0.94, rotateY: 8 }}
          animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, x: -56, scale: 0.96, rotateY: 6 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className={clsx(
            "pointer-events-auto relative overflow-hidden rounded-[3.3rem] shadow-[0_35px_120px_rgba(2,6,14,0.62)]",
            "w-[376px] min-w-[376px] max-w-[376px]",
            "h-[812px] max-h-[calc(100vh-2.25rem)]",
            "bg-[linear-gradient(180deg,rgba(20,24,31,0.96),rgba(6,9,14,0.98))]",
          )}
          style={{ transformPerspective: 1800 }}
        >
          <div className="absolute inset-0 rounded-[3.3rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
          <div className="pointer-events-none absolute left-1/2 top-5 z-20 h-7 w-36 -translate-x-1/2 rounded-full bg-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-16 rounded-b-[2rem] bg-white/5 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[3.3rem] bg-[radial-gradient(circle_at_top,rgba(67,194,255,0.12),transparent_26%),linear-gradient(180deg,rgba(10,14,20,0.94),rgba(5,7,11,0.98))]">
            <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
            <div className="relative flex-1 overflow-hidden px-3 pb-1 pt-3">{children}</div>
            <div className="flex justify-center pb-4 pt-1">
              <button
                type="button"
                onClick={goHome}
                className="relative h-5 w-40"
                aria-label="Go to iPhone home screen"
              >
                <span className="absolute inset-x-3 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-white/78 shadow-[0_1px_0_rgba(255,255,255,0.32),0_6px_14px_rgba(0,0,0,0.28)] transition hover:bg-white" />
              </button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
