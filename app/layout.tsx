import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { OverlayShell } from "@/components/OverlayShell";
import { StoreSyncProvider } from "@/components/providers/store-sync-provider";
import { VoiceRouterProvider } from "@/components/providers/voice-router-provider";
import { siteConfig } from "@/config/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${spaceGrotesk.variable}`}
      >
        <StoreSyncProvider />
        <VoiceRouterProvider />
        <OverlayShell>{children}</OverlayShell>
      </body>
    </html>
  );
}
