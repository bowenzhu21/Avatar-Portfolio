"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import clsx from "clsx";
import { useRef } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { derivePhoneScreen, getPhoneParent, resolvePhoneScreen } from "@/utils/phone";

interface RightSideCardProps {
  children: React.ReactNode;
}

export function RightSideCard({ children }: RightSideCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const swipeStartYRef = useRef<number | null>(null);
  const isCardOpen = usePortfolioStore((state) => state.isCardOpen);
  const storedPhoneScreen = usePortfolioStore((state) => state.phoneScreen);
  const activeRoute = usePortfolioStore((state) => state.activeRoute);
  const phoneScreen = resolvePhoneScreen(pathname, activeRoute, storedPhoneScreen);
  const showTopChrome = phoneScreen.view !== "detail";
  const parent = getPhoneParent(phoneScreen);

  function navigateTo(route: string) {
    usePortfolioStore.setState({
      phoneScreen: derivePhoneScreen({ route }),
      activeRoute: route,
      activeEntity: null,
      activeSection: null,
      activeCard: "overview",
    });
    if (pathname !== route) router.push(route as Route);
  }

  function goHome() {
    navigateTo("/");
  }

  function handleHomeSwipeStart(event: React.TouchEvent<HTMLButtonElement>) {
    swipeStartYRef.current = event.changedTouches[0]?.clientY ?? null;
  }

  function handleHomeSwipeEnd(event: React.TouchEvent<HTMLButtonElement>) {
    const startY = swipeStartYRef.current;
    const endY = event.changedTouches[0]?.clientY ?? null;
    swipeStartYRef.current = null;

    if (startY === null || endY === null) {
      return;
    }

    const upwardDistance = startY - endY;
    if (upwardDistance >= 42) {
      goHome();
    }
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
            "h-[min(812px,calc(100svh_-_24px))] min-h-[560px] w-[min(376px,calc(100vw_-_24px))] max-w-full shrink-0 lg:h-[min(812px,calc(100dvh_-_48px))] lg:min-h-[600px]",
            "bg-[linear-gradient(180deg,rgba(20,24,31,0.96),rgba(6,9,14,0.98))]",
          )}
          style={{ transformPerspective: 1800 }}
        >
          <div className="absolute inset-0 rounded-[3.3rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
          {showTopChrome ? (
            <>
              <div className="pointer-events-none absolute left-1/2 top-5 z-20 h-7 w-[32%] max-w-36 -translate-x-1/2 rounded-full bg-black/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-16 rounded-b-[2rem] bg-white/5 blur-2xl" />
            </>
          ) : null}

          <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[3.3rem] bg-[radial-gradient(circle_at_top,rgba(67,194,255,0.12),transparent_26%),linear-gradient(180deg,rgba(10,14,20,0.94),rgba(5,7,11,0.98))]">
            {showTopChrome ? (
              <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
            ) : null}
            <div className="relative flex-1 overflow-hidden px-[0.45rem] pb-[0.875rem] pt-[0.45rem]">
              <div
                className="isolate flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-black"
                style={{ clipPath: "inset(0 round 2.5rem)" }}
              >
                {parent ? (
                  <nav aria-label="Portfolio navigation" className="shrink-0 bg-white/[0.025] px-5 pb-1 pt-3">
                    <button
                      type="button"
                      onClick={() => navigateTo(parent.route)}
                      aria-label={`Back to ${parent.title}`}
                      className="flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 text-[11px] font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                    >
                      <span aria-hidden="true" className="text-base leading-none">‹</span>
                      <span>{parent.title}</span>
                    </button>
                  </nav>
                ) : null}
                <div className="min-h-0 flex-1">{children}</div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-30 flex justify-center">
              <button
                type="button"
                onClick={goHome}
                onTouchStart={handleHomeSwipeStart}
                onTouchEnd={handleHomeSwipeEnd}
                className="pointer-events-auto relative h-5 w-40 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
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
