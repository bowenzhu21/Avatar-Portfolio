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
      shellTone="light"
      preview={{
        src: "/elbowexo/2.PNG",
        alt: "Elbow Exo preview",
        fit: "cover",
        label: "Prototype",
      }}
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
