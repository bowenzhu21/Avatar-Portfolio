import { NextResponse } from "next/server";
import { getChatContactById } from "@/data/chatContacts";
import { getRelevantVoiceKnowledgeBase } from "@/data/voiceContext";
import type { ChatContactId, MessagesChatMessage, MessagesChatResponse } from "@/types";
import { generateStructuredJson } from "@/lib/structured-llm.server";

interface MessagesChatRequest {
  messages?: MessagesChatMessage[];
  contactId?: ChatContactId;
}

function clampReply(text: string, maxWords: number, maxChars: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const wordLimited = normalized.split(" ").slice(0, maxWords).join(" ");

  return wordLimited.slice(0, maxChars).trim();
}

function buildFallbackReply(contactName: string, latestUserMessage: string) {
  if (!latestUserMessage) {
    return `Hey, it's ${contactName}.`;
  }

  return `It's ${contactName}. Send that again.`;
}

function buildPortfolioChatContext(transcript: string) {
  const knowledge = getRelevantVoiceKnowledgeBase({
    transcript,
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
      skillsGained: experience.skills_gained.slice(0, 2),
    })),
    projectDirectory: knowledge.projectDirectory.map((project) => ({
      title: project.title,
      oneLiner: project.oneLiner,
      techStack: project.techStack,
    })),
    experienceDirectory: knowledge.experienceDirectory.map((experience) => ({
      title: experience.title,
      oneLiner: experience.oneLiner,
      focusAreas: experience.focusAreas,
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessagesChatRequest;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const contact = getChatContactById(body.contactId ?? "bowen");
    const trimmedMessages = messages.slice(-10);
    const latestUserMessage =
      [...trimmedMessages].reverse().find((message) => message.sender === "user")?.text?.trim() ?? "";
    const portfolioContext = buildPortfolioChatContext(latestUserMessage);

    if (!latestUserMessage) {
      return NextResponse.json({ error: "A user message is required." }, { status: 400 });
    }

    const result = await generateStructuredJson<MessagesChatResponse>({
      systemInstruction:
        `You are ${contact?.name ?? "Bowen"} replying inside an iPhone Messages thread. Respond in first person as ${contact?.name ?? "Bowen"}. Keep replies extremely concise, natural, and text-like. Do not mention being an AI. Avoid essay formatting unless the user explicitly asks for detail. If the reply may be spoken aloud, keep it short enough to say in one quick breath. ${
          contact?.id === "bowen"
            ? "Use the provided portfolioContext as the factual source for Bowen's projects, experience, school, contact details, and personal interests. Answer in first person when talking about Bowen's own background."
            : "If the user asks about Bowen, use the provided portfolioContext as your factual source. Refer to Bowen in third person and do not invent anything beyond that context. If something is missing, say you are not totally sure."
        }`,
      userPrompt: JSON.stringify(
        {
          latestUserMessage,
          contact: {
            id: contact?.id ?? "bowen",
            name: contact?.name ?? "Bowen",
          },
          recentThread: trimmedMessages.map((message) => ({
            sender: message.sender,
            text: message.text,
          })),
          portfolioContext,
          instructions: [
            "Reply like a real iMessage conversation.",
            "Prefer a single short sentence.",
            "Keep most replies under 18 words.",
            "Never exceed 22 words unless the user explicitly asks for detail.",
            contact?.id === "bowen"
              ? "If asked about age, say you are 19 and were born November 21, 2006."
              : "Keep the tone personal and direct.",
            contact?.id === "bowen"
              ? "If asked where you are from, say you were born in Montreal, grew up in Toronto, and are currently between Waterloo and the Bay Area for school and work."
              : "If asked about Bowen, answer from portfolioContext only.",
            contact?.id === "bowen" ? "If asked about zodiac sign, say Scorpio." : "Keep replies extremely short.",
            contact?.id === "bowen" ? "If asked about gym split, say Chest, Back, Arms, Legs." : "Sound like a real person texting back.",
            contact?.id === "bowen"
              ? "Use portfolioContext for factual claims about work, experience, school, interests, and contact details."
              : "If you do not know something about Bowen from the provided context, say you are not sure.",
            "No filler, no sign-off, no extra context unless asked.",
          ],
        },
        null,
        2,
      ),
      schemaName: "messages_reply",
      temperature: 0.8,
      schema: {
        type: "object",
        properties: {
          reply: { type: "string" },
        },
        required: ["reply"],
      },
    });

    if (!result) {
      return NextResponse.json(
        { reply: buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage) } satisfies MessagesChatResponse,
        { status: 200 },
      );
    }

    const parsed = result.data;

    return NextResponse.json({
      reply:
        (typeof parsed.reply === "string" ? clampReply(parsed.reply, 22, 120) : "") ||
        buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage),
    } satisfies MessagesChatResponse);
  } catch {
    return NextResponse.json(
      { reply: buildFallbackReply("Bowen", "") } satisfies MessagesChatResponse,
      { status: 200 },
    );
  }
}
