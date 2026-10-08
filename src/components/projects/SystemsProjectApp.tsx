"use client";

import { ProjectAppShell } from "@/components/projects/ProjectAppShell";

type SystemsProjectId = "modelgate" | "flightdeck" | "clearinghouse";

interface SystemsProjectConfig {
  title: string;
  category: string;
  summary: string;
  bullets: string[];
  demoCaption: string;
  demoAlt: string;
  action: string;
}

const projects: Record<SystemsProjectId, SystemsProjectConfig> = {
  modelgate: {
    title: "ModelGate",
    category: "Model release engineering",
    summary:
      "A good score can hide a bad model. The evidence decides what ships.",
    bullets: [
      "Train on synthetic geometry. Keep each shape and its transforms together.",
      "Block a flawed model at 92% overall accuracy. The weak slice tells another story.",
      "Recompute the evidence. Reject altered reports, mismatched models, and stale baselines.",
      "Promote atomically. Preserve the artifacts. Roll back with a trace.",
    ],
    demoCaption:
      "Explore the 3D point clouds, confusion matrices, and release decisions. This saved report comes from executed training and failure drills on synthetic geometry.",
    demoAlt: "ModelGate release explorer showing model evaluation and release evidence",
    action: "Explore the release decisions",
  },
  flightdeck: {
    title: "FlightDeck",
    category: "Telemetry & mission replay",
    summary:
      "Replay the mission. Follow the signal. Find what slipped between the packets.",
    bullets: [
      "Reorder late telemetry in C++17, within explicit memory limits.",
      "Record the stream and its rules. Replay the same findings.",
      "Surface clock faults, dropouts, duplicates, and impossible moves.",
      "Six simulated vehicles. 46 findings. Every fault has a trail.",
    ],
    demoCaption:
      "Six simulated vehicles. A scrubbable mission map, fault filters, and a timeline back to each packet.",
    demoAlt: "FlightDeck mission replay map with vehicle tracks and fault timeline",
    action: "Replay the mission",
  },
  clearinghouse: {
    title: "Clearinghouse",
    category: "Payment systems & recovery",
    summary:
      "Payments repeat. Processes stop. The books still have to balance.",
    bullets: [
      "Commit the event, balanced journal, retry response, and outgoing message together.",
      "Post duplicate events once. Hold early refunds until their capture arrives.",
      "Recover delivery after crashes. Fence stale workers. Keep retries bounded.",
      "Eight failure drills. Nine balanced journals. Ten unique receipts.",
    ],
    demoCaption:
      "Synthetic payments, real database transactions. Inspect the ledger, recovery drills, and settlement mismatches in this saved run.",
    demoAlt: "Clearinghouse operations console with payment journals and reconciliation results",
    action: "Inspect the operations report",
  },
};

export function SystemsProjectApp({ projectId }: { projectId: SystemsProjectId }) {
  const project = projects[projectId];
  const demoUrl = `https://bowenzhu21.github.io/${projectId}/`;
  const coverSrc = `/projects/${projectId}/cover.webp`;

  return (
    <ProjectAppShell
      title={project.title}
      backgroundImageSrc={coverSrc}
      backgroundOverlayClassName="bg-black/75"
      summary={project.summary}
      bullets={project.bullets}
      preview={{
        src: coverSrc,
        alt: `${project.title} conceptual cover artwork`,
        fit: "cover",
        label: project.category,
        aspectRatio: 1.3,
      }}
      primaryAction={{ title: project.action, href: demoUrl }}
      galleryImages={[
        {
          id: 1,
          src: `/projects/${projectId}/demo.jpg`,
          alt: project.demoAlt,
          fit: "contain",
          aspectRatio: 1.6,
          label: "From the working demo",
          caption: project.demoCaption,
          href: demoUrl,
        },
      ]}
      links={[
        { title: "Interactive demo", href: demoUrl, iconSrc: "/appicons/links.png" },
        {
          title: "Source on GitHub",
          href: `https://github.com/bowenzhu21/${projectId}`,
          iconSrc: "/appicons/github.svg",
        },
      ]}
    />
  );
}
