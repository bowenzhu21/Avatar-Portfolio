"use client";

import { ProjectAppShell } from "@/components/projects/ProjectAppShell";

const gymBroBullets = [
  "Built GymBro, a React Native app that matches users with compatible gym partners using biometric and preference-based matching algorithms.",
  "Developed a Firebase-backed system for real-time messaging, user profiles, and matchmaking, enabling seamless partner discovery and coordination.",
];

export function GymBroApp() {
  return (
    <ProjectAppShell
      title="GymBro"
      backgroundImageSrc="/gymbro/gymbro_bg.jpg"
      summary="GymBro is a social fitness app that matches users with compatible gym partners using biometric and preference-based algorithms, with built-in messaging for coordination and accountability."
      bullets={gymBroBullets}
      preview={{
        src: "/gymbro/1.png",
        alt: "GymBro preview",
        fit: "contain",
        paddingClassName: "p-4",
        label: "App Preview",
      }}
      links={[
        {
          title: "GitHub",
          href: "https://github.com/bowenzhu21/GymBro-Mobile",
          iconSrc: "/appicons/github.svg",
        },
        {
          title: "Demo",
          href: "https://bowenzhu21.github.io/gymbro/",
          iconSrc: "/appicons/links.png",
        },
      ]}
    />
  );
}
