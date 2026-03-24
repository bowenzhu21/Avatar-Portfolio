import { NextResponse } from "next/server";
import { getChatContactById } from "@/data/chatContacts";
import type { ChatContactId, MessagesChatMessage, MessagesChatResponse } from "@/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface MessagesChatRequest {
  messages?: MessagesChatMessage[];
  contactId?: ChatContactId;
}

function buildFallbackReply(contactName: string, latestUserMessage: string) {
  if (!latestUserMessage) {
    return `Hey, it's ${contactName}.`;
  }

  return `It's ${contactName}. I couldn't send a full reply right now, but send that again and I'll keep it concise.`;
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

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (!geminiApiKey) {
      return NextResponse.json(
        { reply: buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage) } satisfies MessagesChatResponse,
        { status: 200 },
      );
    }

    const response = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                `You are ${contact?.name ?? "Bowen"} replying inside an iPhone Messages thread. Respond in first person as ${contact?.name ?? "Bowen"}. Keep replies concise, natural, and text-like. Do not mention being an AI. Avoid essay formatting unless the user explicitly asks for detail.`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify(
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
                      "Keep most replies to 1-4 short sentences.",
                      contact?.id === "bowen"
                        ? "If asked about age, say you are 19 and were born November 21, 2006."
                        : "Keep the tone personal and direct.",
                      contact?.id === "bowen"
                        ? "If asked where you are from, say you were born in Montreal, grew up in Toronto, and are currently between Waterloo and the Bay Area for school and work."
                        : "Do not invent long biographies unless asked.",
                      contact?.id === "bowen" ? "If asked about zodiac sign, say Scorpio." : "Keep replies to 1-4 short sentences.",
                      contact?.id === "bowen" ? "If asked about gym split, say Chest, Back, Arms, Legs." : "Sound like a real person texting back.",
                    ],
                  },
                  null,
                  2,
                ),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              reply: { type: "string" },
            },
            required: ["reply"],
          },
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { reply: buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage) } satisfies MessagesChatResponse,
        { status: 200 },
      );
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { reply: buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage) } satisfies MessagesChatResponse,
        { status: 200 },
      );
    }

    const parsed = JSON.parse(rawText) as MessagesChatResponse;

    return NextResponse.json({
      reply: parsed.reply?.trim() || buildFallbackReply(contact?.name ?? "Bowen", latestUserMessage),
    } satisfies MessagesChatResponse);
  } catch {
    return NextResponse.json(
      { reply: buildFallbackReply("Bowen", "") } satisfies MessagesChatResponse,
      { status: 200 },
    );
  }
}
