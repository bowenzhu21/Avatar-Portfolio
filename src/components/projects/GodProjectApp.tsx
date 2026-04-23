"use client";

import { ProjectAppShell } from "@/components/projects/ProjectAppShell";

type GodProjectId = "apollo" | "aphrodite" | "hermes" | "kronos";

const godProjectConfigs: Record<
  GodProjectId,
  {
    title: string;
    backgroundImageSrc: string;
    summary: string;
    bullets: string[];
    preview: {
      src: string;
      alt: string;
      label: string;
    };
    galleryImages: Array<{
      id: number;
      src: string;
      alt: string;
    }>;
    links: Array<{
      title: string;
      href: string;
      iconSrc: string;
    }>;
  }
> = {
  apollo: {
    title: "Apollo",
    backgroundImageSrc: "/apollo/apollo_bg.jpg",
    summary:
      "Apollo is part of the Gods project section, presented in the same mobile app format as the rest of the portfolio.",
    bullets: [
      "Built a gesture-controlled LLM interface using MediaPipe, mapping hand poses to structured prompt primitives and actions for fully hands-free AI interaction.",
      "Designed a secure inference gateway with Vercel API routes and provider abstraction, adding validation, rate limiting, and timeout handling to prevent API key exposure.",
      "Implemented action gating and debouncing with 2s hold logic to ensure reliable input in a continuous vision-based control system.",
    ],
    preview: {
      src: "/apollo/apollo_1.png",
      alt: "Apollo preview",
      label: "Project View",
    },
    galleryImages: [
      {
        id: 1,
        src: "/apollo/apollo_1.png",
        alt: "Apollo gallery image 1",
      },
      {
        id: 2,
        src: "/apollo/apollo_2.png",
        alt: "Apollo gallery image 2",
      },
    ],
    links: [
      {
        title: "GitHub",
        href: "https://github.com/bowenzhu21/Apollo",
        iconSrc: "/appicons/github.svg",
      },
      {
        title: "Demo",
        href: "https://apollos-hands.vercel.app/",
        iconSrc: "/appicons/links.png",
      },
    ],
  },
  aphrodite: {
    title: "Aphrodite",
    backgroundImageSrc: "/aphrodite/aphrodite_bg.jpg",
    summary:
      "Aphrodite is part of the Gods project section, presented in the same mobile app format as the rest of the portfolio.",
    bullets: [
      "Built a real-time gesture-controlled audio engine using MediaPipe and the Web Audio API, mapping hand motion to pitch, gain, and effects.",
      "Implemented a custom audio signal chain with oscillators, reverb, delay, envelopes, and frequency quantization to musical scales for coherent synthesis.",
      "Designed a low-latency feedback loop combining continuous CV input, audio processing, and waveform/particle visualizations.",
    ],
    preview: {
      src: "/aphrodite/aphrodite_1.png",
      alt: "Aphrodite preview",
      label: "Project View",
    },
    galleryImages: [
      {
        id: 1,
        src: "/aphrodite/aphrodite_1.png",
        alt: "Aphrodite gallery image 1",
      },
      {
        id: 2,
        src: "/aphrodite/aphrodite_2.png",
        alt: "Aphrodite gallery image 2",
      },
    ],
    links: [
      {
        title: "GitHub",
        href: "https://github.com/bowenzhu21/Aphrodite",
        iconSrc: "/appicons/github.svg",
      },
      {
        title: "Demo",
        href: "https://aphrodites-hands.vercel.app/",
        iconSrc: "/appicons/links.png",
      },
    ],
  },
  hermes: {
    title: "Hermes",
    backgroundImageSrc: "/hermes/hermes_bg.jpg",
    summary:
      "Hermes is part of the Gods project section, presented in the same mobile app format as the rest of the portfolio.",
    bullets: [
      "Built a real-time hand-tracked game engine with physics-based ball simulation, including arc, spin, bounce, and trajectory modeling.",
      "Translated gesture dynamics into gameplay mechanics, using hand velocity to control shot power, spin, and direction.",
      "Implemented an adaptive AI opponent with reaction delay, prediction, and controlled error to simulate human-like play.",
    ],
    preview: {
      src: "/hermes/hermes_1.png",
      alt: "Hermes preview",
      label: "Project View",
    },
    galleryImages: [
      {
        id: 1,
        src: "/hermes/hermes_1.png",
        alt: "Hermes gallery image 1",
      },
      {
        id: 2,
        src: "/hermes/hermes_2.png",
        alt: "Hermes gallery image 2",
      },
    ],
    links: [
      {
        title: "GitHub",
        href: "https://github.com/bowenzhu21/Hermes",
        iconSrc: "/appicons/github.svg",
      },
      {
        title: "Demo",
        href: "https://hermes-hands.vercel.app/",
        iconSrc: "/appicons/links.png",
      },
    ],
  },
  kronos: {
    title: "Kronos",
    backgroundImageSrc: "/kronos/kronos_bg.jpg",
    summary:
      "Kronos is part of the Gods project section, presented in the same mobile app format as the rest of the portfolio.",
    bullets: [
      "Built a vision-driven particle simulation where hand gestures and body segmentation act as dynamic force fields over thousands of particles.",
      "Combined hand tracking and full-body segmentation to create spatial interaction, enabling attraction, repulsion, and wave-based effects.",
      "Engineered a real-time multi-pipeline system with CV inference, particle physics, and rendering running entirely in the browser.",
    ],
    preview: {
      src: "/kronos/kronos.png",
      alt: "Kronos preview",
      label: "Project View",
    },
    galleryImages: [
      {
        id: 1,
        src: "/kronos/kronos.png",
        alt: "Kronos gallery image",
      },
    ],
    links: [
      {
        title: "GitHub",
        href: "https://github.com/bowenzhu21/Kronos",
        iconSrc: "/appicons/github.svg",
      },
      {
        title: "Demo",
        href: "https://kronos-hands.vercel.app/",
        iconSrc: "/appicons/links.png",
      },
    ],
  },
};

export function GodProjectApp({ projectId }: { projectId: GodProjectId }) {
  const config = godProjectConfigs[projectId];

  return (
    <ProjectAppShell
      title={config.title}
      backgroundImageSrc={config.backgroundImageSrc}
      summary={config.summary}
      bullets={config.bullets}
      preview={{
        ...config.preview,
        fit: "contain",
        paddingClassName: "p-3",
      }}
      galleryImages={config.galleryImages.map((image) => ({
        ...image,
        fit: "contain",
        paddingClassName: "p-3",
      }))}
      links={config.links}
    />
  );
}
