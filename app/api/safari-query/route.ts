import { NextResponse } from "next/server";
import { getRelevantVoiceKnowledgeBase } from "@/data/voiceContext";
import { generateStructuredJson } from "@/lib/structured-llm.server";
import { fetchPageSnapshot, looksLikeUrl, normalizeWebsiteUrl } from "@/lib/safari-web";
import type { SafariQueryResponse } from "@/types";

interface SafariQueryRequest {
  query?: string;
  currentUrl?: string | null;
}

const safariAnswerSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "content"],
} as const;

function buildFallbackPage(query: string): SafariQueryResponse {
  return {
    title: `Results for ${query}`,
    url: "bowen.ai/safari",
    content:
      "I couldn't generate an answer right now.\n\nTry rephrasing the question or entering a direct website URL.",
    query,
    sources: [],
  };
}

function buildPortfolioSearchContext(query: string) {
  const knowledge = getRelevantVoiceKnowledgeBase({
    transcript: query,
    routedEntity: null,
    activeEntityId: null,
    activeRoute: null,
  });

  return {
    persona: {
      name: knowledge.persona.name,
      role: knowledge.persona.role,
      shortIntro: knowledge.persona.short_intro,
    },
    resume: {
      headline: knowledge.resume.headline,
      shortSummary: knowledge.resume.short_summary,
      strengths: knowledge.resume.strengths.slice(0, 4),
      skills: knowledge.resume.skills.slice(0, 6),
    },
    school: {
      schoolName: knowledge.school.school_name,
      program: knowledge.school.program,
      focusAreas: knowledge.school.focus_areas.slice(0, 4),
    },
    contact: {
      email: knowledge.contact.email,
      linkedin: knowledge.contact.linkedin,
      github: knowledge.contact.github,
      website: knowledge.contact.website,
    },
    relevantProjects: Object.values(knowledge.relevantProjects).map((project) => ({
      title: project.title,
      oneLiner: project.one_liner,
      techStack: project.tech_stack.slice(0, 5),
      highlights: project.highlights.slice(0, 2),
      results: project.results.slice(0, 2),
    })),
    relevantExperience: Object.values(knowledge.relevantExperience).map((experience) => ({
      title: experience.title,
      oneLiner: experience.one_liner,
      wins: experience.wins.slice(0, 2),
      skillsGained: experience.skills_gained.slice(0, 3),
    })),
    projectDirectory: knowledge.projectDirectory.map((project) => ({
      title: project.title,
      oneLiner: project.oneLiner,
    })),
    experienceDirectory: knowledge.experienceDirectory.map((experience) => ({
      title: experience.title,
      oneLiner: experience.oneLiner,
    })),
    matchedFaqs: knowledge.matchedFaqs.slice(0, 4).map((faq) => ({
      source: faq.source,
      answer: faq.answer,
    })),
    personal: {
      hobbies: knowledge.personal.hobbies.slice(0, 4),
      fitness: knowledge.personal.fitness.slice(0, 4),
      nutrition: knowledge.personal.nutrition.slice(0, 4),
    },
  };
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
    content:
      sections.join("\n\n").trim() ||
      "This page loaded, but there was not much readable text to show.",
    sources: [],
  };
}

async function buildSafariAnswerPage(args: {
  query: string;
  currentUrl?: string | null;
}): Promise<SafariQueryResponse | null> {
  const portfolioContext = buildPortfolioSearchContext(args.query);
  const fallbackAnswer =
    portfolioContext.matchedFaqs[0]?.answer ||
    "I couldn't answer that confidently right now. Try rephrasing the question.";

  const result = await generateStructuredJson<{
    title: string;
    content: string;
  }>({
    systemInstruction: `You are Safari inside Bowen's portfolio.
Answer the user's question directly and clearly.
For questions about Bowen, his projects, experience, school, resume, contact details, or interests, use the provided portfolioContext as the factual source of truth.
For general knowledge questions, answer from model knowledge without claiming that you searched the live web.
If the question requires current live information like weather, breaking news, sports scores, market prices, or anything time-sensitive, say clearly that you cannot verify live data here and then give only a brief general answer if it is still helpful.
Do not mention Gemini, Groq, OpenAI, pipelines, hidden context, or internal implementation.
Keep the response compact and useful.
Use 1 to 3 short sections total.
You may use a short heading with # and brief bullet lists when helpful, but avoid long essays.
Do not include markdown links.
Return strict JSON only.`,
    userPrompt: JSON.stringify(
      {
        query: args.query,
        currentUrl: args.currentUrl ?? null,
        portfolioContext,
        formattingRules: [
          "Title should be short and natural, like a Safari result page title.",
          "Content should usually be under 180 words.",
          "For Bowen questions, stay grounded in portfolioContext only.",
          "For general questions, answer directly without pretending to browse the web.",
          "For live/current questions, explicitly say the answer is not live-verified.",
        ],
      },
      null,
      2,
    ),
    schema: safariAnswerSchema,
    schemaName: "safari_answer",
    temperature: 0.45,
  });

  if (!result) {
    return {
      title: `Results for ${args.query}`,
      url: "bowen.ai/safari",
      query: args.query,
      content: fallbackAnswer,
      sources: [],
    };
  }

  const title = result.data.title.replace(/\s+/g, " ").trim().slice(0, 120);
  const content = result.data.content.replace(/\s+\n/g, "\n").trim().slice(0, 1600);

  return {
    title: title || `Results for ${args.query}`,
    url: "bowen.ai/safari",
    query: args.query,
    content: content || fallbackAnswer,
    sources: [],
  };
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

    if (looksLikeUrl(query)) {
      const websitePage = await buildWebsitePage(query);

      if (websitePage) {
        return NextResponse.json(websitePage);
      }
    }

    const answerPage = await buildSafariAnswerPage({
      query,
      currentUrl: body.currentUrl ?? null,
    });

    if (answerPage) {
      return NextResponse.json(answerPage);
    }

    return NextResponse.json(buildFallbackPage(query), { status: 200 });
  } catch {
    return NextResponse.json(buildFallbackPage(query || "Bowen search"), { status: 200 });
  }
}
