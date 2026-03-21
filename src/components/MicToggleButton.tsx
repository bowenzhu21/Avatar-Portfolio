"use client";

import clsx from "clsx";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function MicToggleButton() {
  const isListening = usePortfolioStore((state) => state.isListening);
  const setListening = usePortfolioStore((state) => state.setListening);

  return (
    <button
      type="button"
      onClick={() => setListening(!isListening)}
      className={clsx(
        "group panel-blur relative flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-300",
        isListening
          ? "border-cyan-300/70 bg-cyan-400/20 shadow-[0_0_40px_rgba(53,200,255,0.35)]"
          : "border-white/15 bg-white/8 hover:border-white/25 hover:bg-white/12",
      )}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop microphone" : "Start microphone"}
    >
      <span
        className={clsx(
          "absolute inset-0 rounded-full",
          isListening && "animate-ping bg-cyan-300/20",
        )}
      />
      <span className="relative text-2xl">{isListening ? "■" : "◉"}</span>
    </button>
  );
}
