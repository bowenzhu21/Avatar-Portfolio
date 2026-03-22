import "server-only";

type RequiredServerEnvKey =
  | "GEMINI_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "NEXT_PUBLIC_APP_URL";

type ServerEnv = {
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  HEYGEN_API_KEY: string | null;
  LIVEAVATAR_API_KEY: string | null;
  LIVEAVATAR_VOICE_ID: string | null;
};

const REQUIRED_SERVER_ENV: RequiredServerEnvKey[] = [
  "GEMINI_API_KEY",
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

function readOptionalEnv(name: "HEYGEN_API_KEY" | "LIVEAVATAR_API_KEY" | "LIVEAVATAR_VOICE_ID") {
  return process.env[name]?.trim() || null;
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
    {} as Pick<
      ServerEnv,
      "GEMINI_API_KEY" | "ELEVENLABS_API_KEY" | "NEXT_PUBLIC_APP_URL"
    >,
  );

  const HEYGEN_API_KEY = readOptionalEnv("HEYGEN_API_KEY");
  const LIVEAVATAR_API_KEY = readOptionalEnv("LIVEAVATAR_API_KEY");

  if (!HEYGEN_API_KEY && !LIVEAVATAR_API_KEY) {
    throw new Error(
      "Missing LiveAvatar credentials. Add LIVEAVATAR_API_KEY or HEYGEN_API_KEY to .env.local before using avatar integrations.",
    );
  }

  cachedEnv = {
    ...requiredEnv,
    HEYGEN_API_KEY,
    LIVEAVATAR_API_KEY,
    LIVEAVATAR_VOICE_ID: readOptionalEnv("LIVEAVATAR_VOICE_ID"),
  };

  return cachedEnv;
}

export function getLiveAvatarApiKey() {
  const env = getServerEnv();
  return env.LIVEAVATAR_API_KEY ?? env.HEYGEN_API_KEY!;
}
