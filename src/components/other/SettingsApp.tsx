"use client";

import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SettingsApp() {
  const portfolioVolume = usePortfolioStore((state) => state.portfolioVolume);
  const setPortfolioVolume = usePortfolioStore((state) => state.setPortfolioVolume);
  const volumePercent = Math.round(portfolioVolume * 100);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f2f2f7] text-[#111111]">
      <header className="border-b border-black/6 bg-[rgba(242,242,247,0.92)] px-5 pb-4 pt-6 backdrop-blur-xl">
        <h1 className="text-[2.2rem] font-semibold tracking-[-0.06em] text-[#111111]">
          Settings
        </h1>

        <div className="mt-4 flex items-center gap-2 rounded-[0.9rem] bg-[#e5e5ea] px-3 py-2.5 text-[#6d6d72] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <SearchIcon />
          <span className="text-[0.95rem]">Search</span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5">
        <section>
          <p className="px-3 text-[0.73rem] font-semibold uppercase tracking-[0.12em] text-[#6d6d72]">
            Volume
          </p>

          <div className="mt-2 overflow-hidden rounded-[1.25rem] border border-black/[0.04] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 border-b border-black/[0.05] px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-[#8e8e93] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <SpeakerTileIcon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[0.96rem] font-medium text-[#111111]">Portfolio Volume</p>
                <p className="mt-0.5 text-[0.76rem] text-[#6d6d72]">
                  Controls music, avatar speech, and call audio
                </p>
              </div>

              <span className="text-[0.86rem] font-medium text-[#8e8e93]">
                {volumePercent}%
              </span>
            </div>

            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-[#8e8e93]">
                  <SpeakerLevelIcon level="low" />
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volumePercent}
                  onChange={(event) => {
                    setPortfolioVolume(Number(event.target.value) / 100);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#d1d1d6]"
                  style={{ accentColor: "#007aff" }}
                  aria-label="Portfolio volume"
                />
                <span className="text-[#8e8e93]">
                  <SpeakerLevelIcon level="high" />
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[0.74rem] text-[#8e8e93]">
                <span>Adjust output across the entire portfolio.</span>
                <span>{volumePercent}%</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.6 10.6L13.4 13.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerTileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 14.5V9.5H8.5L13.25 5.75V18.25L8.5 14.5H4.75Z"
        fill="currentColor"
      />
      <path
        d="M16.5 9.25C17.43 9.97 18 11.1 18 12.25C18 13.4 17.43 14.53 16.5 15.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerLevelIcon({ level }: { level: "low" | "high" }) {
  return (
    <svg width={level === "low" ? "16" : "18"} height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 14.5V9.5H8.5L13.25 5.75V18.25L8.5 14.5H4.75Z"
        fill="currentColor"
      />
      <path
        d="M16.25 10.1C16.88 10.63 17.25 11.4 17.25 12.25C17.25 13.1 16.88 13.87 16.25 14.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {level === "high" ? (
        <path
          d="M18.6 7.7C19.85 8.84 20.6 10.48 20.6 12.25C20.6 14.02 19.85 15.66 18.6 16.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}
