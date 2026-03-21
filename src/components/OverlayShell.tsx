import { AvatarStage } from "@/components/AvatarStage";
import { MicToggleButton } from "@/components/MicToggleButton";
import { RightSideCard } from "@/components/RightSideCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { SubtitleBar } from "@/components/SubtitleBar";

interface OverlayShellProps {
  children: React.ReactNode;
}

export function OverlayShell({ children }: OverlayShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AvatarStage />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex flex-1 items-start justify-end px-4 pb-44 pt-6 md:px-8 md:pt-8">
          <div className="flex w-full justify-end">
            <RightSideCard>{children}</RightSideCard>
          </div>
        </div>

        <div className="pointer-events-none absolute left-6 top-6 z-20 md:left-8 md:top-8">
          <StatusIndicator />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 px-4 md:px-6">
          <SubtitleBar />
        </div>

        <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center">
          <div className="pointer-events-auto">
            <MicToggleButton />
          </div>
        </div>
      </div>
    </div>
  );
}
