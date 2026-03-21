import { portfolioEntities, portfolioEntityMap } from "@/data/portfolio";
import type { PortfolioEntity, PortfolioSection } from "@/types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9/\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function getEntityById(id?: string | null): PortfolioEntity | null {
  if (!id) {
    return null;
  }

  return portfolioEntityMap.get(id) ?? null;
}

export function getEntityByRoute(route: string): PortfolioEntity | null {
  return portfolioEntities.find((entity) => entity.route === route) ?? null;
}

export function lookupRouteForEntity(query: string): string | null {
  const normalizedQuery = normalize(query);
  const directMatch = portfolioEntities.find(
    (entity) =>
      entity.route === normalizedQuery ||
      normalize(entity.title) === normalizedQuery ||
      entity.aliases.some((alias) => normalize(alias) === normalizedQuery),
  );

  return directMatch?.route ?? null;
}

export function matchPortfolioAlias(transcript: string): {
  entity: PortfolioEntity | null;
  alias: string | null;
} {
  const normalizedTranscript = normalize(transcript);

  let bestMatch: { entity: PortfolioEntity; alias: string } | null = null;

  for (const entity of portfolioEntities) {
    const candidates = [entity.title, entity.route, ...entity.aliases];
    for (const candidate of candidates) {
      const normalizedCandidate = normalize(candidate);
      if (!normalizedCandidate) {
        continue;
      }

      const isMatch =
        normalizedTranscript === normalizedCandidate ||
        normalizedTranscript.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedTranscript);

      if (!isMatch) {
        continue;
      }

      if (!bestMatch || normalizedCandidate.length > bestMatch.alias.length) {
        bestMatch = { entity, alias: candidate };
      }
    }
  }

  return {
    entity: bestMatch?.entity ?? null,
    alias: bestMatch?.alias ?? null,
  };
}

export function inferSection(
  transcript: string,
  entity: PortfolioEntity | null,
): PortfolioSection | null {
  if (!entity) {
    return null;
  }

  const normalizedTranscript = normalize(transcript);

  return (
    entity.sections.find((section) => {
      const normalizedTitle = normalize(section.title);
      const normalizedId = normalize(section.id);
      return (
        normalizedTranscript.includes(normalizedTitle) ||
        normalizedTranscript.includes(normalizedId)
      );
    }) ?? null
  );
}

export function detectComparison(
  transcript: string,
): { entities: PortfolioEntity[]; detected: boolean } {
  const normalizedTranscript = normalize(transcript);
  const comparisonTerms = ["compare", "difference", "versus", "vs", "between"];
  const detected = comparisonTerms.some((term) =>
    normalizedTranscript.includes(term),
  );

  const entities = portfolioEntities.filter((entity) => {
    const candidates = [entity.title, ...entity.aliases];
    return candidates.some((candidate) =>
      normalizedTranscript.includes(normalize(candidate)),
    );
  });

  return {
    detected,
    entities,
  };
}

export function scoreConfidence(args: {
  transcript: string;
  entity: PortfolioEntity | null;
  alias: string | null;
  section?: PortfolioSection | null;
  comparisonDetected?: boolean;
}): number {
  const normalizedTranscript = normalize(args.transcript);

  if (!normalizedTranscript) {
    return 0.1;
  }

  let score = 0.2;

  if (args.entity) {
    score += 0.35;
  }

  if (args.alias) {
    const exact = normalize(args.alias) === normalizedTranscript;
    score += exact ? 0.25 : 0.15;
  }

  if (args.section) {
    score += 0.12;
  }

  if (args.comparisonDetected) {
    score += 0.08;
  }

  return Math.min(Number(score.toFixed(2)), 0.98);
}

export function buildRecentEntities(
  current: string[],
  nextEntityId?: string | null,
): string[] {
  if (!nextEntityId) {
    return current;
  }

  return [nextEntityId, ...current.filter((item) => item !== nextEntityId)].slice(
    0,
    5,
  );
}
