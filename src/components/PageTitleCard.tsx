import type { PortfolioEntity } from "@/types";

interface PageTitleCardProps {
  entity: PortfolioEntity | null;
  route: string;
}

export function PageTitleCard({ entity, route }: PageTitleCardProps) {
  const typeLabel = entity?.type ?? "landing";
  const title = entity?.title ?? "Bowen Portfolio";
  const summary =
    entity?.shortSummary ??
    "A voice-guided portfolio where the avatar leads the story and the evidence stays visible.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-cyan-300">
          {typeLabel}
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-white/45">{route}</span>
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-sand-100 md:text-4xl">{title}</h1>
        <p className="max-w-xl text-sm leading-7 text-sand-200/80 md:text-base">{summary}</p>
      </div>
    </div>
  );
}
