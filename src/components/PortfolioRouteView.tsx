"use client";

import { usePortfolioStore } from "@/store/usePortfolioStore";
import Link from "next/link";
import type { Route } from "next";
import { ComparisonCard } from "@/components/ComparisonCard";
import { PageTitleCard } from "@/components/PageTitleCard";
import { SuggestedPromptChips } from "@/components/SuggestedPromptChips";
import { getEntityById, getEntityByRoute } from "@/utils/portfolio";

interface PortfolioRouteViewProps {
  route: string;
}

export function PortfolioRouteView({ route }: PortfolioRouteViewProps) {
  const entity = getEntityByRoute(route);
  const activeCard = usePortfolioStore((state) => state.activeCard);
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const relatedEntities = (entity?.relatedItems ?? [])
    .map((id) => getEntityById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const selectedSection =
    entity?.sections.find((section) => section.id === activeSection) ?? entity?.sections[0] ?? null;

  const cardContent = (() => {
    if (!entity) {
      return null;
    }

    switch (activeCard) {
      case "architecture":
        return {
          title: "Architecture",
          body: entity.technicalSummary,
        };
      case "stack":
        return {
          title: "Stack",
          body: `Core themes: ${entity.tags.join(", ")}.`,
        };
      case "comparison":
        return {
          title: "Comparison",
          body: "This view frames the current item against a relevant reference point.",
        };
      case "contact":
        return {
          title: "Contact",
          body: "Placeholder contact content. This can later surface email, LinkedIn, and a clear next step.",
        };
      case "resume":
        return {
          title: "Resume",
          body: "Placeholder resume summary. This view should condense Bowen's trajectory into a recruiter-friendly snapshot.",
        };
      case "hobbies":
        return {
          title: "Hobbies",
          body: "Placeholder hobbies content. This view adds personal texture and cultural-fit context.",
        };
      default:
        return {
          title: selectedSection?.title ?? "Overview",
          body: selectedSection?.summary ?? entity.shortSummary,
        };
    }
  })();

  return (
    <div className="space-y-6">
      <PageTitleCard entity={entity} route={route} />

      {entity ? (
        <>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">{cardContent?.title ?? "Summary"}</p>
              <p className="mt-2 text-sm leading-7 text-sand-200/75">
                {cardContent?.body ?? entity.technicalSummary}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sand-100/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-white/8 bg-black/10 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Sections</p>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/85">Placeholder Page</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {entity.sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-xs text-cyan-100/90"
                >
                  {section.title}
                </button>
              ))}
            </div>
            <div className="space-y-3 pt-1">
              {entity.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-sand-100">{section.title}</p>
                  <p className="mt-2 text-sm leading-6 text-sand-200/70">{section.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {relatedEntities.length >= 2 ? <ComparisonCard entities={relatedEntities.slice(0, 2)} /> : null}

          <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.32em] text-white/40">Related Routes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedEntities.map((related) => (
                <Link
                  key={related.id}
                  href={related.route as Route}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-sand-100/80 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  {related.title}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-5 text-sm leading-7 text-sand-200/75">
          Start with a voice command like &quot;show me Matrix&quot; or &quot;compare HeyGen and Momenta.&quot;
        </div>
      )}

      <SuggestedPromptChips />
    </div>
  );
}
