import type { Metadata } from "next";
import { portfolioEntities } from "@/data/portfolio";

export function projectMetadata(id: "modelgate" | "flightdeck" | "clearinghouse" | "matrix"): Metadata {
  const project = portfolioEntities.find((entity) => entity.id === id)!;
  const image = id === "matrix" ? "/matrix/demo-preview.png" : `/projects/${id}/cover.webp`;
  return {
    title: project.title,
    description: project.shortSummary,
    alternates: { canonical: project.route },
    openGraph: {
      title: `${project.title} — Bowen Zhu`,
      description: project.shortSummary,
      url: project.route,
      type: "website",
      images: [{ url: image, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — Bowen Zhu`,
      description: project.shortSummary,
      images: [image],
    },
  };
}
