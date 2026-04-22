export interface ResumeBulletGroup {
  title?: string;
  bullets: string[];
}

export interface ResumeExperienceItem {
  company: string;
  date: string;
  role: string;
  location: string;
  bullets: string[];
}

export interface ResumeProjectItem {
  title: string;
  linkLabel: string;
  linkHref: string;
  bullets: string[];
}

export interface ResumeEducationItem {
  school: string;
  degree: string;
  date: string;
  bullets: string[];
}

export interface ResumeRecord {
  name: string;
  location: string;
  phone: string;
  email: string;
  github: string;
  linkedin: string;
  role: string;
  skills: ResumeBulletGroup[];
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
}

export const resumeRecord: ResumeRecord = {
  name: "Bowen Zhu",
  location: "Sunnyvale, CA",
  phone: "(647) 801-2866",
  email: "bowenzhu66@gmail.com",
  github: "github.com/bowenzhu21",
  linkedin: "linkedin.com/in/bowenzhu21",
  role: "Software Engineer | AI Systems",
  skills: [
    {
      title: "Languages",
      bullets: ["Python", "C++", "TypeScript", "JavaScript", "Java", "SQL"],
    },
    {
      title: "AI / Inference",
      bullets: [
        "OpenAI",
        "Anthropic",
        "Gemini",
        "RAG",
        "LangChain",
        "vLLM",
        "TensorRT",
        "Modal",
      ],
    },
    {
      title: "Systems / Infra",
      bullets: [
        "FastAPI",
        "Flask",
        "WebSockets",
        "Kafka",
        "Redis",
        "PostgreSQL",
        "MySQL",
        "AWS (EC2, S3, Lambda)",
        "GCP",
        "Kubernetes",
        "Docker",
        "Linux",
        "Git",
        "CI/CD",
      ],
    },
  ],
  experience: [
    {
      company: "HeyGen",
      date: "May. 2026 - Aug. 2026",
      role: "Software Engineer Intern",
      location: "Palo Alto, CA",
      bullets: [
        "AI Data Infra",
      ],
    },
    {
      company: "Hippos Exoskeleton",
      date: "Sep. 2025 - Dec. 2025",
      role: "Software Engineer Intern",
      location: "San Francisco, CA",
      bullets: [
        "ML Motion Sensor",
      ],
    },
    {
      company: "Momenta",
      date: "May. 2025 - Aug. 2025",
      role: "Software & ML Engineer Intern",
      location: "Toronto, ON",
      bullets: [
        "AI Voice Detection",
      ],
    },
    {
      company: "JMA Consulting",
      date: "Jan. 2025 - Apr. 2025",
      role: "Software Engineer Intern",
      location: "Toronto, ON",
      bullets: [
        "Building & Automation",
      ],
    },
  ],
  projects: [
    {
      title: "Matrix | Artificial Societies (Node-Based Agentic Simulation)",
      linkLabel: "github.com/bowenzhu21/matrix",
      linkHref: "https://github.com/bowenzhu21/matrix",
      bullets: [
        "Designed an artificial society of graph-node LLM agents modeled on human demographic & behavior patterns, propagating via weighted BFS scored by social proximity & influence, with Supermemory for context.",
        "Architected a distributed Modal pipeline supporting 100 concurrent DeepSeek-1.5B node agents across 25 GPUs, with 3 instances of DeepSeek-32B for orchestration layers across 15 GPUs.",
        "Built live avatars for node agents, processing expressions, tone & speech with 200 ms audio & visual response.",
      ],
    },
    {
      title: "Adapt | AI Code Generation & Validation Pipeline",
      linkLabel: "adapt-ui.vercel.app",
      linkHref: "https://adapt-ui.vercel.app/",
      bullets: [
        "Built a 3-stage OpenAI pipeline to generate, validate & repair TypeScript components by parsing compiler errors into structured context for targeted re-prompting, isolating failure modes across imports, props & type violations.",
        "Achieved 82% prompt-to-render success across 200 prompts via max-iteration budgeting and failure mode logging.",
      ],
    },
  ],
  education: [
    {
      school: "University of Waterloo",
      degree: "BASc in Systems Design Engineering (Co-op)",
      date: "Sep. 2024 - Apr. 2028",
      bullets: [
        "Bill Harvey Scholar (1 of 1) | Lloyd Auckland Invitational | AIME Qualifier | 5x CEMC National Honour (Top 3%)",
        "3.9 GPA | Competitions: Optiver Trading Comp | HackIllinois | NexHacks | 1st Place - Toronto Model UN",
      ],
    },
  ],
};
