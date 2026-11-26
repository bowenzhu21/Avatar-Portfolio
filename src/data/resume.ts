import { heygenExperience } from "@/data/heygen";
import { stripeExperience } from "@/data/stripe";

export const resumeRecord = {
  name: "Bowen Zhu",
  website: "bowenzhu.ca",
  location: "Sunnyvale, CA",
  phone: "(647) 801-2866",
  email: "bowenzhu66@gmail.com",
  github: "github.com/bowenzhu21",
  linkedin: "linkedin.com/in/bowenzhu21",
  role: "Software Engineer | AI Systems",
  education: [
    {
      school: "University of Waterloo",
      degree: "BASc, Systems Design Engineering (Co-op)",
      date: "Sep. 2024 - Apr. 2029",
      honours: "President’s Scholarship of Distinction · Bill Harvey Scholar",
    },
  ],
  experience: [
    {
      company: "Stripe",
      date: stripeExperience.date,
      role: stripeExperience.role,
      location: stripeExperience.location,
    },
    {
      company: "HeyGen",
      date: heygenExperience.date,
      role: heygenExperience.role,
      location: heygenExperience.location,
    },
    {
      company: "Momenta",
      date: "May. 2025 - Aug. 2025",
      role: "Software Engineering Volunteer",
      location: "Toronto, ON",
    },
    {
      company: "JMA Consulting",
      date: "Jan. 2025 - Apr. 2025",
      role: "Junior Software Developer Intern",
      location: "Toronto, ON",
    },
  ],
  projects: [
    { title: "NemoClaw", context: "NVIDIA Open Source" },
    { title: "Genesis", context: "HeyGen · Persistent Agent Harnesses" },
  ],
  skills: [
    {
      title: "Languages & Tools",
      items: ["Python", "Go", "C++", "Java", "TypeScript", "SQL", "Git", "Docker", "ArgoCD", "AWS", "Helm", "Langfuse"],
    },
    {
      title: "AI & Systems",
      items: ["Kubernetes", "Temporal", "MCP", "llama.cpp", "TensorRT", "Redis", "MySQL", "LLM Evals", "Knowledge Graphs"],
    },
  ],
  awards: "AIME Qualifier · Optiver Trading Challenge (Top 50) · 5x CEMC Honours (Top 3%) · Toronto Model UN (1st Place)",
};
