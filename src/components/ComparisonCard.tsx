import type { PortfolioEntity } from "@/types";

interface ComparisonCardProps {
  entities: PortfolioEntity[];
}

export function ComparisonCard({ entities }: ComparisonCardProps) {
  if (entities.length < 2) {
    return null;
  }

  return (
    <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
      {entities.slice(0, 2).map((entity) => (
        <div key={entity.id} className="rounded-2xl border border-white/8 bg-black/10 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">{entity.type}</p>
          <h3 className="mt-2 font-display text-xl text-sand-100">{entity.title}</h3>
          <p className="mt-3 text-sm leading-6 text-sand-200/75">{entity.recruiterSummary}</p>
        </div>
      ))}
    </div>
  );
}
