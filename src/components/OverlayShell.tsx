import { AvatarStage } from "@/components/AvatarStage";
import { MicToggleButton } from "@/components/MicToggleButton";
import { RightSideCard } from "@/components/RightSideCard";
import { SubtitleBar } from "@/components/SubtitleBar";

interface OverlayShellProps {
  children: React.ReactNode;
}

export function OverlayShell({ children }: OverlayShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ede5]">
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/background.jpg")' }}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.62),transparent_18%),radial-gradient(circle_at_78%_22%,rgba(221,209,196,0.18),transparent_24%),linear-gradient(180deg,rgba(255,248,241,0.5),rgba(255,248,241,0.28)_38%,rgba(244,237,229,0.42)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-start px-4 pb-8 pt-5 md:px-8 md:pt-6">
          <div className="grid w-full grid-cols-[376px_minmax(0,1fr)] items-start gap-8">
            <div className="flex justify-start">
              <RightSideCard>{children}</RightSideCard>
            </div>

            <div className="flex min-h-[750px] flex-col justify-between">
              <div className="max-w-[calc(100vw-376px-6rem)]">
                <AvatarStage />
              </div>

              <div className="mt-4 flex flex-col items-center gap-7">
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
