import { NextResponse } from "next/server";
import {
  getEntityVoiceContext,
  getReferencedEntityIds,
  getRelevantVoiceKnowledgeBase,
} from "@/data/voiceContext";
import type { SafariQueryResponse } from "@/types";
import { generateStructuredJson } from "@/lib/structured-llm.server";

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

const safariQuerySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    url: { type: "string" },
    content: { type: "string" },
    query: { type: "string" },
  },
  required: ["title", "url", "content", "query"],
} as const;

function buildFallbackPage(query: string): SafariQueryResponse {
  return {
    title: `Results for ${query}`,
    url: "bowen.ai/search",
    content:
      "I could not load a polished answer page for that search right now.\n\nTry reloading the page or rephrasing your search in a shorter way.",
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

function buildSafariPortfolioContext(query: string) {
  const knowledge = getRelevantVoiceKnowledgeBase({
    transcript: query,
    routedEntity: null,
    activeEntityId: null,
    activeRoute: null,
  });

  return {
    persona: {
      name: knowledge.persona.name,
      shortIntro: knowledge.persona.short_intro,
    },
    resume: {
      headline: knowledge.resume.headline,
      shortSummary: knowledge.resume.short_summary,
      strengths: knowledge.resume.strengths.slice(0, 5),
      skills: knowledge.resume.skills.slice(0, 8),
    },
    school: {
      schoolName: knowledge.school.school_name,
      program: knowledge.school.program,
      focusAreas: knowledge.school.focus_areas.slice(0, 5),
    },
    contact: {
      email: knowledge.contact.email,
      linkedin: knowledge.contact.linkedin,
      github: knowledge.contact.github,
      website: knowledge.contact.website,
    },
    projectDirectory: knowledge.projectDirectory,
    experienceDirectory: knowledge.experienceDirectory,
    relevantProjects: Object.values(knowledge.relevantProjects).map((project) => ({
      title: project.title,
      summary: project.full_summary,
      techStack: project.tech_stack.slice(0, 6),
      highlights: project.highlights.slice(0, 3),
    })),
    relevantExperience: Object.values(knowledge.relevantExperience).map((experience) => ({
      title: experience.title,
      summary: experience.full_summary,
      wins: experience.wins.slice(0, 3),
      skillsGained: experience.skills_gained.slice(0, 4),
    })),
    matchedFaqs: knowledge.matchedFaqs.slice(0, 4).map((faq) => ({
      source: faq.source,
      answer: faq.answer,
    })),
    personal: {
      hobbies: knowledge.personal.hobbies.slice(0, 4),
      fitness: knowledge.personal.fitness.slice(0, 3),
      nutrition: knowledge.personal.nutrition.slice(0, 3),
    },
  };
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

    const portfolioPage = buildPortfolioPage(query);

    if (portfolioPage) {
      return NextResponse.json(portfolioPage);
    }

    const portfolioContext = buildSafariPortfolioContext(query);

    const result = await generateStructuredJson<SafariQueryResponse>({
      systemInstruction:
        "You are generating a Safari-style answer page inside Bowen Zhu's portfolio phone UI. Use only the provided portfolioContext for factual claims about Bowen, his projects, experience, school, contact details, and personal interests. If the answer is not in portfolioContext, say that briefly instead of inventing it. Return strict JSON only. Make the answer feel like a polished browser result page, not a chat response. Be concise, well-structured, and readable on a phone. Prefer short headings, short paragraphs, and bullets when useful. Keep the title short. Use a URL-like string such as bowen.ai/search or bowen.ai/result.",
      userPrompt: JSON.stringify(
        {
          query,
          currentUrl: body.currentUrl ?? null,
          portfolioContext,
          outputRequirements: {
            title: "short page title",
            url: "compact browser-like URL",
            content:
              "formatted answer body with short headings, bullets, and short paragraphs when helpful",
            query,
          },
        },
        null,
        2,
      ),
      schema: safariQuerySchema,
      schemaName: "safari_query_page",
      temperature: 0.5,
    });

    if (!result) {
      return NextResponse.json(buildFallbackPage(query), { status: 200 });
    }

    const parsed = result.data;

    return NextResponse.json({
      title: (typeof parsed.title === "string" ? parsed.title.trim() : "") || `Results for ${query}`,
      url: (typeof parsed.url === "string" ? parsed.url.trim() : "") || "bowen.ai/search",
      content:
        (typeof parsed.content === "string" ? parsed.content.trim() : "") ||
        buildFallbackPage(query).content,
      query,
    } satisfies SafariQueryResponse);
  } catch {
    return NextResponse.json(buildFallbackPage(query || "Bowen search"), { status: 200 });
  }
}
