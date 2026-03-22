import { AvatarStage } from "@/components/AvatarStage";
import { MicToggleButton } from "@/components/MicToggleButton";
import { RightSideCard } from "@/components/RightSideCard";
import { SubtitleBar } from "@/components/SubtitleBar";

interface OverlayShellProps {
  children: React.ReactNode;
}

export function OverlayShell({ children }: OverlayShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AvatarStage />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(90deg,rgba(4,7,13,0.48)_0%,rgba(4,7,13,0.18)_26%,transparent_54%,rgba(4,7,13,0.34)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-start justify-start px-4 pb-44 pt-5 md:px-8 md:pt-6">
          <div className="flex w-full justify-start">
            <RightSideCard>{children}</RightSideCard>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 px-4 md:px-6">
          <SubtitleBar />
        </div>

        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div className="pointer-events-auto">
            <MicToggleButton />
          </div>
        </div>
      </div>
    </div>
  );
}
