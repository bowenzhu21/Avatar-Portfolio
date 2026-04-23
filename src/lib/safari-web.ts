import type { SafariSource } from "@/types";

type InstantAnswerTopic = {
  Text?: string;
  FirstURL?: string;
};

type InstantAnswerTopicGroup = {
  Name?: string;
  Topics?: InstantAnswerTopic[];
};

interface InstantAnswerPayload {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  Definition?: string;
  DefinitionURL?: string;
  Answer?: string;
  AnswerType?: string;
  RelatedTopics?: Array<InstantAnswerTopic | InstantAnswerTopicGroup>;
}

function flattenRelatedTopics(
  topics: InstantAnswerPayload["RelatedTopics"],
): InstantAnswerTopic[] {
  if (!topics?.length) {
    return [];
  }

  return topics.flatMap((topic) => {
    if ("Text" in topic || "FirstURL" in topic) {
      return [
        {
          Text: topic.Text,
          FirstURL: topic.FirstURL,
        },
      ];
    }

    if ("Topics" in topic) {
      return (topic.Topics ?? []).map((entry) => ({
        Text: entry.Text,
        FirstURL: entry.FirstURL,
      }));
    }

    return [];
  });
}

export interface SafariInstantAnswer {
  title: string;
  url: string;
  summary: string;
}

export interface SafariPageSnapshot {
  title: string;
  url: string;
  description: string;
  highlights: string[];
  paragraphs: string[];
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/json;q=0.7,*/*;q=0.6",
  "Accept-Language": "en-US,en;q=0.9",
} as const;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function trimText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function parseDuckDuckGoRedirect(rawUrl: string) {
  try {
    const nextUrl = new URL(
      rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl,
      "https://duckduckgo.com",
    );
    const redirected = nextUrl.searchParams.get("uddg");
    return redirected ? decodeURIComponent(redirected) : nextUrl.toString();
  } catch {
    return rawUrl;
  }
}

function cleanupPageHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return stripTags(match[1]);
    }
  }

  return "";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.text();
}

export function looksLikeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }

  return /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?$/i.test(trimmed);
}

export function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function fetchInstantAnswer(query: string): Promise<SafariInstantAnswer | null> {
  try {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("no_redirect", "1");
    url.searchParams.set("skip_disambig", "1");

    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as InstantAnswerPayload;
    const relatedTopics = flattenRelatedTopics(payload.RelatedTopics);

    const directSummary =
      payload.AbstractText?.trim() ||
      payload.Definition?.trim() ||
      payload.Answer?.trim() ||
      relatedTopics.map((topic) => topic.Text?.trim() ?? "").find(Boolean) ||
      "";
    const directUrl =
      payload.AbstractURL?.trim() ||
      payload.DefinitionURL?.trim() ||
      relatedTopics.map((topic) => topic.FirstURL?.trim() ?? "").find(Boolean) ||
      "";

    if (!directSummary) {
      return null;
    }

    return {
      title: payload.Heading?.trim() || query,
      url: directUrl || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      summary: trimText(directSummary, 420),
    };
  } catch {
    return null;
  }
}

export async function searchWeb(query: string): Promise<SafariSource[]> {
  try {
    const url = new URL("https://html.duckduckgo.com/html/");
    url.searchParams.set("q", query);

    const html = await fetchText(url.toString());
    const blocks = html.split(/<div class="result results_links[^"]*web-result[^"]*">/i).slice(1);
    const results: SafariSource[] = [];
    const seenUrls = new Set<string>();

    for (const block of blocks) {
      const titleMatch = block.match(
        /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!titleMatch) {
        continue;
      }

      const nextUrl = parseDuckDuckGoRedirect(titleMatch[1]);
      const title = stripTags(titleMatch[2]);

      if (!title || !nextUrl || seenUrls.has(nextUrl)) {
        continue;
      }

      const displayUrl = stripTags(
        block.match(/<a[^>]*class="result__url"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "",
      );
      const snippet = trimText(
        stripTags(
          block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "",
        ),
        240,
      );

      seenUrls.add(nextUrl);
      results.push({
        title: trimText(title, 120),
        url: nextUrl,
        displayUrl,
        snippet,
      });

      if (results.length >= 6) {
        break;
      }
    }

    return results;
  } catch {
    return [];
  }
}

export async function fetchPageSnapshot(
  rawUrl: string,
): Promise<SafariPageSnapshot | null> {
  try {
    const response = await fetch(normalizeWebsiteUrl(rawUrl), {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });

    if (!response.ok) {
      return null;
    }

    const finalUrl = response.url;
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const body = await response.text();

    if (!body.trim()) {
      return null;
    }

    if (!contentType.includes("html")) {
      const plainText = trimText(body.replace(/\s+/g, " ").trim(), 900);
      return {
        title: finalUrl,
        url: finalUrl,
        description: plainText,
        highlights: [],
        paragraphs: [],
      };
    }

    const html = cleanupPageHtml(body);
    const title =
      stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ||
      new URL(finalUrl).hostname;
    const description =
      extractMetaContent(html, "description") ||
      extractMetaContent(html, "og:description");

    const highlights = Array.from(html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi))
      .map((match) => stripTags(match[1]))
      .filter((entry) => entry.length >= 18)
      .slice(0, 3)
      .map((entry) => trimText(entry, 110));

    const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
      .map((match) => stripTags(match[1]))
      .filter((entry) => entry.length >= 70)
      .filter((entry) => !/cookie|privacy|javascript|sign in|subscribe/i.test(entry))
      .slice(0, 3)
      .map((entry) => trimText(entry, 280));

    return {
      title: trimText(title, 140),
      url: finalUrl,
      description: trimText(description, 320),
      highlights,
      paragraphs,
    };
  } catch {
    return null;
  }
}
