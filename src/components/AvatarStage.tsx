import { avatarConfig } from "@/config/avatar";

export function AvatarStage() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid bg-[size:100%_100%,48px_48px,48px_48px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,17,28,0.1),rgba(4,7,13,0.72)_72%)]" />
      <div className="absolute left-[12%] top-[12%] h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[20%] left-[22%] h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <div className="relative flex h-[78vh] w-[52vh] max-w-full items-center justify-center rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 rounded-[2.5rem] border border-cyan-300/15" />
          <div className="absolute inset-x-[10%] top-[8%] h-10 rounded-full bg-white/8 blur-2xl" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300">
              Live Avatar Stage
            </p>
            <p className="mt-3 font-display text-2xl text-sand-100">
              {avatarConfig.canvasLabel}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-sand-200/65">
              HeyGen Streaming Avatar will render here once session lifecycle wiring is enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
