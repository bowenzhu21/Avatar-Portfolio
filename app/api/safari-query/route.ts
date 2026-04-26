import { NextResponse } from "next/server";
import {
  getEntityVoiceContext,
  getReferencedEntityIds,
  getRelevantVoiceKnowledgeBase,
} from "@/data/voiceContext";
import type { SafariQueryResponse } from "@/types";
import {
  extractWeatherLocation,
  fetchWeatherSnapshot,
  fetchInstantAnswer,
  fetchPageSnapshot,
  looksLikeUrl,
  normalizeWebsiteUrl,
  searchWikipedia,
  searchWeb,
} from "@/lib/safari-web";

interface SafariQueryRequest {
  query?: string;
  currentUrl?: string | null;
}

function normalizeQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackPage(query: string): SafariQueryResponse {
  return {
    title: `Results for ${query}`,
    url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    content:
      "I could not load results for that search right now.\n\nTry reloading the page, searching with fewer words, or entering a direct website URL.",
    query,
  };
}

function isProjectVoiceContext(
  context: unknown,
): context is {
  title: string;
  full_summary: string;
  tech_stack: string[];
  highlights: string[];
  architecture: string[];
} {
  return Boolean(
    context &&
      typeof context === "object" &&
      "full_summary" in context &&
      "tech_stack" in context &&
      "highlights" in context &&
      "architecture" in context,
  );
}

function isExperienceVoiceContext(
  context: unknown,
): context is {
  title: string;
  full_summary: string;
  scope: string[];
  wins: string[];
  skills_gained: string[];
} {
  return Boolean(
    context &&
      typeof context === "object" &&
      "full_summary" in context &&
      "scope" in context &&
      "wins" in context &&
      "skills_gained" in context,
  );
}

function buildPortfolioPage(query: string): SafariQueryResponse | null {
  const normalized = normalizeQuery(query);
  const knowledge = getRelevantVoiceKnowledgeBase({
    transcript: query,
    routedEntity: null,
    activeEntityId: null,
    activeRoute: null,
  });
  const referencedEntityId = getReferencedEntityIds(query)[0] ?? null;
  const referencedContext = getEntityVoiceContext(referencedEntityId);

  if (referencedEntityId && isProjectVoiceContext(referencedContext)) {
    const techStack = referencedContext.tech_stack.length
      ? `\n\nTech Stack\n- ${referencedContext.tech_stack.slice(0, 6).join("\n- ")}`
      : "";
    const highlights = referencedContext.highlights.length
      ? `\n\nHighlights\n- ${referencedContext.highlights.slice(0, 4).join("\n- ")}`
      : "";
    const architecture = referencedContext.architecture.length
      ? `\n\nArchitecture\n- ${referencedContext.architecture.slice(0, 3).join("\n- ")}`
      : "";

    return {
      title: referencedContext.title,
      url: `bowen.ai/projects/${referencedEntityId}`,
      query,
      content: `${referencedContext.full_summary}${techStack}${highlights}${architecture}`.trim(),
    };
  }

  if (referencedEntityId && isExperienceVoiceContext(referencedContext)) {
    const scope = referencedContext.scope.length
      ? `\n\nScope\n- ${referencedContext.scope.slice(0, 3).join("\n- ")}`
      : "";
    const wins = referencedContext.wins.length
      ? `\n\nKey Work\n- ${referencedContext.wins.slice(0, 3).join("\n- ")}`
      : "";
    const skills = referencedContext.skills_gained.length
      ? `\n\nTech Focus\n- ${referencedContext.skills_gained.slice(0, 5).join("\n- ")}`
      : "";

    return {
      title: referencedContext.title,
      url: `bowen.ai/experience/${referencedEntityId}`,
      query,
      content: `${referencedContext.full_summary}${scope}${wins}${skills}`.trim(),
    };
  }

  if (/\bprojects?\b/.test(normalized)) {
    return {
      title: "Bowen's Projects",
      url: "bowen.ai/projects",
      query,
      content: `Project Directory\n- ${knowledge.projectDirectory
        .map((project) => `${project.title}: ${project.oneLiner}`)
        .join("\n- ")}`,
    };
  }

  if (/\b(experience|internship|internships|roles?)\b/.test(normalized)) {
    return {
      title: "Bowen's Experience",
      url: "bowen.ai/experience",
      query,
      content: `Experience\n- ${knowledge.experienceDirectory
        .map((experience) => `${experience.title}: ${experience.oneLiner}`)
        .join("\n- ")}`,
    };
  }

  if (/\b(fitness|nutrition|gym|training)\b/.test(normalized)) {
    return {
      title: "Bowen's Interests",
      url: "bowen.ai/about/interests",
      query,
      content: `Personal Interests\n- ${knowledge.personal.fitness
        .slice(0, 2)
        .concat(knowledge.personal.nutrition.slice(0, 2))
        .join("\n- ")}`,
    };
  }

  if (/\b(contact|email|linkedin|github|website)\b/.test(normalized)) {
    return {
      title: "Contact Bowen",
      url: "bowen.ai/contact",
      query,
      content: `Contact\n- Email: ${knowledge.contact.email}\n- LinkedIn: ${knowledge.contact.linkedin}\n- GitHub: ${knowledge.contact.github}\n- Website: ${knowledge.contact.website}`,
    };
  }

  const faqMatch = knowledge.matchedFaqs[0];
  if (faqMatch?.answer) {
    return {
      title: "Portfolio Answer",
      url: "bowen.ai/answer",
      query,
      content: faqMatch.answer,
    };
  }

  return null;
}

function buildWebSearchContent(args: {
  query: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    displayUrl?: string;
    snippet?: string;
  }>;
}) {
  const sections: string[] = [];

  if (args.summary) {
    sections.push(`# Web Overview\n${args.summary}`);
  }

  if (args.sources.length) {
    sections.push(
      `# Top Results\n- ${args.sources
        .slice(0, 5)
        .map((source) =>
          [source.title, source.displayUrl ? `(${source.displayUrl})` : null, source.snippet]
            .filter(Boolean)
            .join(": "),
        )
        .join("\n- ")}`,
    );
  }

  return sections.join("\n\n").trim();
}

async function buildWebsitePage(query: string): Promise<SafariQueryResponse | null> {
  const url = normalizeWebsiteUrl(query);
  const snapshot = await fetchPageSnapshot(url);

  if (!snapshot) {
    return null;
  }

  const sections = [
    snapshot.description,
    snapshot.highlights.length
      ? `# Highlights\n- ${snapshot.highlights.join("\n- ")}`
      : "",
    snapshot.paragraphs.length ? `# Page Snapshot\n${snapshot.paragraphs.join("\n\n")}` : "",
  ].filter(Boolean);

  return {
    title: snapshot.title,
    url: snapshot.url,
    query,
    content: sections.join("\n\n").trim() || "This page loaded, but there was not much readable text to show.",
  };
}

async function buildWebSearchPage(query: string): Promise<SafariQueryResponse | null> {
  const [instantAnswer, sources, wikipediaResult] = await Promise.all([
    fetchInstantAnswer(query),
    searchWeb(query),
    searchWikipedia(query),
  ]);

  const resolvedSources = sources.length ? sources : (wikipediaResult?.sources ?? []);
  const topSource = resolvedSources[0];
  const topPageSnapshot =
    !instantAnswer?.summary && topSource ? await fetchPageSnapshot(topSource.url) : null;
  const summary =
    instantAnswer?.summary ||
    wikipediaResult?.summary ||
    topPageSnapshot?.description ||
    topPageSnapshot?.paragraphs[0] ||
    topSource?.snippet ||
    "";

  if (!summary && !resolvedSources.length) {
    return null;
  }

  return {
    title:
      instantAnswer?.title ||
      wikipediaResult?.title ||
      topPageSnapshot?.title ||
      `Results for ${query}`,
    url:
      instantAnswer?.url ||
      topPageSnapshot?.url ||
      wikipediaResult?.sources[0]?.url ||
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
    query,
    content: buildWebSearchContent({
      query,
      summary,
      sources: resolvedSources,
    }),
    sources: resolvedSources,
  };
}

function buildPresetPage(query: string): SafariQueryResponse | null {
  const normalized = normalizeQuery(query);

  if (normalized === "how old is bowen") {
    return {
      title: "Bowen's Age",
      url: "bowen.ai/about/age",
      query,
      content: "Bowen is 19 years old.\n\nHe was born on November 21, 2006.",
    };
  }

  if (normalized === "what is bowens zodiac sign") {
    return {
      title: "Bowen's Zodiac Sign",
      url: "bowen.ai/about/zodiac",
      query,
      content: "Bowen's zodiac sign is Scorpio.",
    };
  }

  if (normalized === "where is bowen from") {
    return {
      title: "Where Bowen Is From",
      url: "bowen.ai/about/home",
      query,
      content:
        "Bowen was born in Montreal and grew up in Toronto.\n\nHe is currently between Waterloo and the Bay Area for school and work.",
    };
  }

  if (normalized === "what is bowens gym split") {
    return {
      title: "Bowen's Gym Split",
      url: "bowen.ai/about/fitness",
      query,
      content: "Bowen's gym split is:\n\n- Chest\n- Back\n- Arms\n- Legs",
    };
  }

  return null;
}

export async function POST(request: Request) {
  let query = "";

  try {
    const body = (await request.json()) as SafariQueryRequest;
    query = body.query?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    if (query.length > 400) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }

    const presetPage = buildPresetPage(query);

    if (presetPage) {
      return NextResponse.json(presetPage);
    }

    if (looksLikeUrl(query)) {
      const websitePage = await buildWebsitePage(query);
      if (websitePage) {
        return NextResponse.json(websitePage);
      }
    }

    const portfolioPage = buildPortfolioPage(query);

    if (portfolioPage) {
      return NextResponse.json(portfolioPage);
    }

    const weatherLocation = extractWeatherLocation(query);

    if (weatherLocation) {
      const weatherPage = await fetchWeatherSnapshot(weatherLocation);

      if (weatherPage) {
        return NextResponse.json({
          title: weatherPage.title,
          url: weatherPage.url,
          query,
          content: buildWebSearchContent({
            query,
            summary: weatherPage.summary,
            sources: weatherPage.sources,
          }),
          sources: weatherPage.sources,
        } satisfies SafariQueryResponse);
      }
    }

    const webSearchPage = await buildWebSearchPage(query);

    if (webSearchPage) {
      return NextResponse.json(webSearchPage);
    }

    return NextResponse.json(buildFallbackPage(query), { status: 200 });
  } catch {
    return NextResponse.json(buildFallbackPage(query || "Bowen search"), { status: 200 });
  }
}
