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
