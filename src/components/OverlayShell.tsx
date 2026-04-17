import { AvatarStage } from "@/components/AvatarStage";
import { BackgroundAudioPlayer } from "@/components/BackgroundAudioPlayer";
import { MicToggleButton } from "@/components/MicToggleButton";
import { RightSideCard } from "@/components/RightSideCard";
import { SubtitleBar } from "@/components/SubtitleBar";

interface OverlayShellProps {
  children: React.ReactNode;
}

export function OverlayShell({ children }: OverlayShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ede5]">
      <BackgroundAudioPlayer />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/background.jpg")' }}
      />
      <video
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/background.jpg"
        aria-hidden="true"
      >
        <source src="/background/portfolio-bg.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_16%_14%,rgba(255,241,225,0.26),transparent_18%),radial-gradient(circle_at_82%_20%,rgba(255,184,132,0.12),transparent_24%),radial-gradient(circle_at_52%_82%,rgba(255,146,92,0.08),transparent_30%),linear-gradient(180deg,rgba(52,28,18,0.14),rgba(78,48,34,0.06)_38%,rgba(28,14,10,0.16)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-start px-4 pb-8 pt-5 md:px-8 md:pt-6">
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[376px_minmax(0,1fr)]">
            <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
              <RightSideCard>{children}</RightSideCard>
            </div>

            <div className="order-1 flex min-h-0 flex-col justify-between lg:order-2 lg:min-h-[750px]">
              <div className="w-full max-w-full lg:max-w-[calc(100vw-376px-6rem)]">
                <AvatarStage />
              </div>

              <div className="mt-4 flex flex-col items-center gap-7 lg:mt-4">
                <div className="pointer-events-auto w-full max-w-[760px]">
                  <SubtitleBar />
                </div>

                <div className="pointer-events-auto">
                  <MicToggleButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
