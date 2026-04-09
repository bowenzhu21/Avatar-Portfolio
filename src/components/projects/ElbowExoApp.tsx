"use client";

import { ProjectAppShell } from "@/components/projects/ProjectAppShell";

const elbowBullets = [
  "Designed and built a wearable elbow sensing system using embedded IMU sensors and microcontrollers to capture real-time arm motion data.",
  "Developed a data processing pipeline to stream, synchronize, and analyze sensor inputs, enabling accurate flexion tracking and movement insights.",
];

export function ElbowExoApp() {
  return (
    <ProjectAppShell
      title="Elbow Exo"
      backgroundImageSrc="/elbowexo/elbow_bg.jpg"
      summary="Elbow Exo is a wearable sensing system that tracks arm motion in real time using embedded sensors, enabling analysis and feedback for biomechanics and human movement."
      bullets={elbowBullets}
      preview={{
        src: "/elbowexo/img1.PNG",
        alt: "Elbow Exo preview 1",
        fit: "contain",
        label: "Prototype",
      }}
      galleryImages={[
        {
          id: 1,
          src: "/elbowexo/img1.PNG",
          alt: "Elbow Exo preview 1",
          fit: "contain",
        },
        {
          id: 2,
          src: "/elbowexo/img2.PNG",
          alt: "Elbow Exo preview 2",
          fit: "contain",
        },
      ]}
      links={[
        {
          title: "GitHub",
          href: "https://github.com/bowenzhu21/ElbowExo",
          iconSrc: "/appicons/github.svg",
        },
      ]}
    />
  );
}
