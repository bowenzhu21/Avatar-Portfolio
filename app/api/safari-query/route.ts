import { NextResponse } from "next/server";
import type { SafariQueryResponse } from "@/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (!geminiApiKey) {
      return NextResponse.json(buildFallbackPage(query), { status: 200 });
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
                "You are generating a Safari-style answer page inside Bowen Zhu's portfolio phone UI. Return strict JSON only. Make the answer feel like a polished browser result page, not a chat response. Be concise, well-structured, and readable on a phone. Prefer short headings, short paragraphs, and bullets when useful. Keep the title short. Use a URL-like string such as bowen.ai/search or bowen.ai/result.",
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
                    query,
                    currentUrl: body.currentUrl ?? null,
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
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: safariQuerySchema,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(buildFallbackPage(query), { status: 200 });
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
      return NextResponse.json(buildFallbackPage(query), { status: 200 });
    }

    const parsed = JSON.parse(rawText) as SafariQueryResponse;

    return NextResponse.json({
      title: parsed.title?.trim() || `Results for ${query}`,
      url: parsed.url?.trim() || "bowen.ai/search",
      content: parsed.content?.trim() || buildFallbackPage(query).content,
      query,
    } satisfies SafariQueryResponse);
  } catch {
    return NextResponse.json(buildFallbackPage(query || "Bowen search"), { status: 200 });
  }
}
