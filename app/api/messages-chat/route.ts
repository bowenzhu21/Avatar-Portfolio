import { NextResponse } from "next/server";
import { getChatContactById } from "@/data/chatContacts";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MessagesChatRequest;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const contact = getChatContactById(body.contactId ?? "bowen");
    const trimmedMessages = messages.slice(-10);
    const latestUserMessage =
      [...trimmedMessages].reverse().find((message) => message.sender === "user")?.text?.trim() ?? "";

    if (!latestUserMessage) {
      return NextResponse.json({ error: "A user message is required." }, { status: 400 });
    }

    const result = await generateStructuredJson<MessagesChatResponse>({
      systemInstruction:
        `You are ${contact?.name ?? "Bowen"} replying inside an iPhone Messages thread. Respond in first person as ${contact?.name ?? "Bowen"}. Keep replies extremely concise, natural, and text-like. Do not mention being an AI. Avoid essay formatting unless the user explicitly asks for detail. If the reply may be spoken aloud, keep it short enough to say in one quick breath.`,
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
              : "Do not invent long biographies unless asked.",
            contact?.id === "bowen" ? "If asked about zodiac sign, say Scorpio." : "Keep replies extremely short.",
            contact?.id === "bowen" ? "If asked about gym split, say Chest, Back, Arms, Legs." : "Sound like a real person texting back.",
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
