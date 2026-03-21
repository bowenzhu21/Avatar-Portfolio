const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const clientEnv = {
  appUrl: publicAppUrl || "http://localhost:3000",
} as const;
