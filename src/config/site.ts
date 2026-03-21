import { clientEnv } from "@/config/env.client";

export const siteConfig = {
  name: "Bowen Voice Portfolio",
  description:
    "A voice-controlled portfolio where the avatar narrates and the card shows structured evidence.",
  owner: "Bowen",
  defaultRoute: "/",
  appUrl: clientEnv.appUrl,
} as const;
