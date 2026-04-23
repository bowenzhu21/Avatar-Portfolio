"use client";

import Image from "next/image";
import clsx from "clsx";
import { getSpotifyTrackById, spotifyTracks } from "@/data/spotify";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export function SpotifyApp() {
  const selectedTrackId = usePortfolioStore((state) => state.selectedSpotifyTrackId);
  const setSelectedTrackId = usePortfolioStore((state) => state.setSelectedSpotifyTrackId);
  const isSpotifyPaused = usePortfolioStore((state) => state.isSpotifyPaused);
  const toggleSpotifyPaused = usePortfolioStore((state) => state.toggleSpotifyPaused);
  const interactionPhase = usePortfolioStore((state) => state.interactionPhase);
  const activeTrack = getSpotifyTrackById(selectedTrackId);
  const pausedForVoice = interactionPhase !== "idle";
  const isPlaybackPaused = isSpotifyPaused || pausedForVoice;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2.45rem] bg-[#050505] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% -8%, ${activeTrack.accent}88 0%, ${activeTrack.accent}34 28%, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0) 32%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.78)_52%,#050505_100%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 pb-2 pt-7">
        <div>
          <h1 className="text-[2.15rem] font-black tracking-[-0.06em]">Spotify</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760] text-[1rem] font-black text-black">
          B
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 pb-7 pt-3">
        <section className="rounded-[1.65rem] border border-white/8 bg-white/[0.045] p-4 shadow-[0_26px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
          <div className="relative mx-auto aspect-square w-[82%] overflow-hidden rounded-[1.2rem] shadow-[0_24px_45px_rgba(0,0,0,0.5)]">
            <Image
              src={activeTrack.coverSrc}
              alt={`${activeTrack.title} cover`}
              fill
              sizes="320px"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[1.35rem] font-bold tracking-[-0.04em]">
                {activeTrack.title}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white/58">
                {activeTrack.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSpotifyPaused}
              disabled={pausedForVoice}
              className={clsx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-black shadow-[0_12px_24px_rgba(30,215,96,0.24)] transition",
                "bg-[#1ed760]",
                pausedForVoice
                  ? "cursor-not-allowed opacity-70"
                  : "hover:scale-[1.04] active:scale-[0.98]",
              )}
              aria-label={
                pausedForVoice
                  ? "Music paused while Bowen is speaking"
                  : isSpotifyPaused
                    ? "Resume music"
                    : "Pause music"
              }
            >
              {isPlaybackPaused ? (
                <span className="ml-1 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-black" />
              ) : (
                <span className="flex h-4 items-center gap-[3px]" aria-hidden="true">
                  <span className="h-4 w-[4px] rounded-full bg-black" />
                  <span className="h-4 w-[4px] rounded-full bg-black" />
                </span>
              )}
            </button>
          </div>

          <div className="mt-5">
            <div className="h-1 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full w-[38%] rounded-full bg-white/86"
                style={{ boxShadow: `0 0 18px ${activeTrack.accent}` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-end text-[0.68rem] font-medium text-white/42">
              <span>{activeTrack.duration}</span>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.1rem] font-bold tracking-[-0.04em]">Songs</h2>
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#1ed760]">
              Tap to play
            </span>
          </div>

          <div className="space-y-1">
            {spotifyTracks.map((track) => {
              const active = track.id === activeTrack.id;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrackId(track.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-[1rem] px-2 py-2 text-left transition",
                    active ? "bg-white/[0.075]" : "hover:bg-white/[0.04]",
                  )}
                  aria-pressed={active}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[0.55rem] bg-white/8">
                    <Image
                      src={track.coverSrc}
                      alt={`${track.title} cover`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        "truncate text-[0.9rem] font-semibold",
                        active ? "text-[#1ed760]" : "text-white",
                      )}
                    >
                      {track.title}
                    </p>
                    <p className="mt-0.5 truncate text-[0.74rem] font-medium text-white/48">
                      {track.artist}
                    </p>
                  </div>
                  {active && !isPlaybackPaused ? (
                    <div className="flex h-5 items-end gap-[2px]" aria-hidden="true">
                      <span className="h-2 w-[3px] animate-pulse rounded-full bg-[#1ed760]" />
                      <span className="h-4 w-[3px] animate-pulse rounded-full bg-[#1ed760] [animation-delay:120ms]" />
                      <span className="h-3 w-[3px] animate-pulse rounded-full bg-[#1ed760] [animation-delay:240ms]" />
                    </div>
                  ) : (
                    <span className="text-[0.72rem] font-medium text-white/36">
                      {track.duration}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
