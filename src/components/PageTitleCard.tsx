import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-cyan-300">
          {typeLabel}
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-white/45">{route}</span>
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-3xl leading-none text-sand-100 md:text-[2.75rem]">
          {title}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-sand-200/80 md:text-base">{summary}</p>
        {!entity ? (
          <p className="max-w-lg text-sm leading-7 text-sand-200/62">
            Voice-first navigation is live. Ask for a project, compare two experiences, or switch
            into recruiter or technical mode and let the avatar guide the walkthrough.
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
