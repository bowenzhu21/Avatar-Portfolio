import "server-only";

type RequiredServerEnvKey =
  | "ELEVENLABS_API_KEY"
  | "NEXT_PUBLIC_APP_URL";

type OptionalServerEnvKey =
  | "GEMINI_API_KEY"
  | "GROQ_API_KEY"
  | "OPENAI_API_KEY";

type ServerEnv = {
  ELEVENLABS_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  GEMINI_API_KEY: string | null;
  GROQ_API_KEY: string | null;
  OPENAI_API_KEY: string | null;
};

const REQUIRED_SERVER_ENV: RequiredServerEnvKey[] = [
  "ELEVENLABS_API_KEY",
  "NEXT_PUBLIC_APP_URL",
];

let cachedEnv: ServerEnv | null = null;

function readRequiredEnv(name: RequiredServerEnvKey): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local before using server-side integrations.`,
    );
  }

  return value;
}

function readOptionalEnv(name: OptionalServerEnvKey): string | null {
  const value = process.env[name]?.trim();

  return value || null;
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const requiredEnv = REQUIRED_SERVER_ENV.reduce(
    (env, key) => {
      env[key] = readRequiredEnv(key);
      return env;
    },
    {} as Pick<ServerEnv, "ELEVENLABS_API_KEY" | "NEXT_PUBLIC_APP_URL">,
  );

  cachedEnv = {
    ...requiredEnv,
    GEMINI_API_KEY: readOptionalEnv("GEMINI_API_KEY"),
    GROQ_API_KEY: readOptionalEnv("GROQ_API_KEY"),
    OPENAI_API_KEY: readOptionalEnv("OPENAI_API_KEY"),
  };

  return cachedEnv;
}
