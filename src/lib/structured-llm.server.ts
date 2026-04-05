import "server-only";

import { getServerEnv } from "@/config/env.server";

type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaObject
  | JsonSchemaValue[];

type JsonSchemaObject = {
  [key: string]: JsonSchemaValue;
};

type StructuredLlmProvider = "gemini" | "groq" | "openai";

interface StructuredGenerationArgs {
  systemInstruction: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  schemaName?: string;
  temperature?: number;
}

interface StructuredGenerationResult<T> {
  data: T;
  provider: StructuredLlmProvider;
  model: string;
}

interface StructuredProviderAttempt {
  provider: StructuredLlmProvider;
  model: string;
  enabled: boolean;
  run: () => Promise<string | null>;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_MODEL = "gpt-5.4-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function normalizeJsonSchemaValue(value: JsonSchemaValue): JsonSchemaValue {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonSchemaValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized: JsonSchemaObject = {};

  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalizeJsonSchemaValue(child as JsonSchemaValue);
  }

  if (normalized.type === "object" && !("additionalProperties" in normalized)) {
    normalized.additionalProperties = false;
  }

  return normalized;
}

function buildStructuredInstruction(systemInstruction: string, schema: Record<string, unknown>) {
  return `${systemInstruction.trim()}

Return strict JSON only.
The JSON must match this schema exactly:
${JSON.stringify(schema, null, 2)}`;
}

function buildSchemaName(schemaName?: string) {
  const normalized = (schemaName ?? "structured_response")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "structured_response";
}

function parseStructuredJson<T>(rawText: string): T | null {
  const trimmed = rawText.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

function extractChatCompletionText(payload: {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
          }>;
    };
  }>;
}) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();

  return text || null;
}

async function buildErrorMessage(response: Response) {
  const body = await response.text();
  const preview = body.replace(/\s+/g, " ").trim().slice(0, 280);

  return preview
    ? `HTTP ${response.status} ${response.statusText}: ${preview}`
    : `HTTP ${response.status} ${response.statusText}`;
}

async function runGeminiStructuredRequest(args: StructuredGenerationArgs, apiKey: string) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: args.systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: args.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: args.temperature ?? 0.4,
        responseMimeType: "application/json",
        responseSchema: args.schema,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
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

  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function runOpenAiCompatibleStructuredRequest(args: {
  apiKey: string;
  model: string;
  url: string;
} & StructuredGenerationArgs) {
  const normalizedSchema = normalizeJsonSchemaValue(
    args.schema as JsonSchemaObject,
  ) as JsonSchemaObject;
  const response = await fetch(args.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        {
          role: "system",
          content: buildStructuredInstruction(args.systemInstruction, args.schema),
        },
        {
          role: "user",
          content: args.userPrompt,
        },
      ],
      temperature: args.temperature ?? 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: buildSchemaName(args.schemaName),
          strict: true,
          schema: normalizedSchema,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              text?: string;
            }>;
      };
    }>;
  };

  return extractChatCompletionText(payload);
}

function formatProviderError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown provider error.";
}

export async function generateStructuredJson<T>(
  args: StructuredGenerationArgs,
): Promise<StructuredGenerationResult<T> | null> {
  const env = getServerEnv();
  const attempts = [
    {
      provider: "gemini",
      model: GEMINI_MODEL,
      enabled: Boolean(env.GEMINI_API_KEY),
      run: () => runGeminiStructuredRequest(args, env.GEMINI_API_KEY as string),
    },
    {
      provider: "groq",
      model: GROQ_MODEL,
      enabled: Boolean(env.GROQ_API_KEY),
      run: () =>
        runOpenAiCompatibleStructuredRequest({
          ...args,
          apiKey: env.GROQ_API_KEY as string,
          model: GROQ_MODEL,
          url: GROQ_URL,
        }),
    },
    {
      provider: "openai",
      model: OPENAI_MODEL,
      enabled: Boolean(env.OPENAI_API_KEY),
      run: () =>
        runOpenAiCompatibleStructuredRequest({
          ...args,
          apiKey: env.OPENAI_API_KEY as string,
          model: OPENAI_MODEL,
          url: OPENAI_URL,
        }),
    },
  ] satisfies StructuredProviderAttempt[];

  const enabledAttempts = attempts.filter(
    (attempt): attempt is StructuredProviderAttempt => attempt.enabled,
  );

  for (const attempt of enabledAttempts) {
    try {
      const rawText = await attempt.run();
      const parsed = rawText ? parseStructuredJson<T>(rawText) : null;

      if (parsed) {
        if (attempt.provider !== "gemini") {
          console.info(`[structured-llm] Using ${attempt.provider} fallback (${attempt.model}).`);
        }

        return {
          data: parsed,
          provider: attempt.provider,
          model: attempt.model,
        };
      }

      console.warn(`[structured-llm] ${attempt.provider} returned empty or invalid JSON.`);
    } catch (error) {
      console.warn(
        `[structured-llm] ${attempt.provider} failed: ${formatProviderError(error)}`,
      );
    }
  }

  return null;
}
