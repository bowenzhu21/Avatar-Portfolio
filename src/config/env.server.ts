import "server-only";

type RequiredServerEnvKey =
  | "GEMINI_API_KEY"
  | "HEYGEN_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "NEXT_PUBLIC_APP_URL";

type ServerEnv = {
  GEMINI_API_KEY: string;
  HEYGEN_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
};

const REQUIRED_SERVER_ENV: RequiredServerEnvKey[] = [
  "GEMINI_API_KEY",
  "HEYGEN_API_KEY",
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

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = REQUIRED_SERVER_ENV.reduce((env, key) => {
    env[key] = readRequiredEnv(key);
    return env;
  }, {} as ServerEnv);

  return cachedEnv;
}
