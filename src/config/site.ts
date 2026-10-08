import { clientEnv } from "@/config/env.client";

export const siteConfig = {
  name: "Bowen Voice Portfolio",
  description:
    "Projects and experience by Bowen Zhu. Explore AI products, model releases, telemetry systems, and the details behind the work.",
  owner: "Bowen",
  defaultRoute: "/",
  appUrl: clientEnv.appUrl,
} as const;
