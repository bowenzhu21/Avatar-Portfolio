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
  location: "Toronto, ON",
  phone: "(647) 801-2866",
  email: "bowenzhu66@gmail.com",
  github: "github.com/bowenzhu21",
  linkedin: "linkedin.com/in/bowenzhu21",
  role: "Software Engineer | AI Systems",
  skills: [
    {
      title: "Languages",
      bullets: ["Python", "C++", "TypeScript", "JavaScript", "Java", "SQL", "React"],
    },
    {
      title: "Systems & Backend",
      bullets: [
        "FastAPI",
        "Flask",
        "REST APIs",
        "WebSockets",
        "Kafka",
        "Redis",
        "PostgreSQL",
        "MySQL",
        "gRPC",
      ],
    },
    {
      title: "AI",
      bullets: ["vLLM", "CUDA", "TensorRT", "LangChain", "Modal", "LLM APIs (OpenAI, Claude, Gemini)"],
    },
    {
      title: "Cloud",
      bullets: ["AWS (EC2, S3, Lambda)", "GCP", "Kubernetes", "Docker", "Terraform", "Linux", "Git", "CI/CD"],
    },
  ],
  experience: [
    {
      company: "HeyGen",
      date: "May. 2026 - Aug. 2026",
      role: "Software Engineer Intern",
      location: "Palo Alto, CA",
      bullets: [],
    },
    {
      company: "Hippos Exoskeleton",
      date: "Sep. 2025 - Dec. 2025",
      role: "Software Engineer Intern",
      location: "San Francisco, CA",
      bullets: [
        "Reduced sensor-to-app latency 73% (120 ms) and improved data capture reliability 25% by integrating processing into the mobile app and implementing offline buffering with backpressure.",
        "Drove $100k order by shipping production C++ firmware and synchronized BLE mobile clients across 50 devices.",
        "Built sensor pipeline with FastAPI + PostgreSQL on AWS, and Python fusion algorithms for joint-angle estimation.",
      ],
    },
    {
      company: "Momenta",
      date: "May. 2025 - Aug. 2025",
      role: "Software & ML Engineer Intern",
      location: "Toronto, ON",
      bullets: [
        "Achieved 160 ms E2E latency for AI voice detection by building a Twilio pipeline with sliding-window buffering.",
        "Increased inference throughput 8x and supported 100 concurrent call classifications per GPU node by building a TensorRT-optimized GPU inference service on AWS T4 instances.",
        "Reduced GPU over-provisioning and enabled 60 s scale-out with Kubernetes autoscaling on Redis queue depth.",
      ],
    },
    {
      company: "JMA Consulting",
      date: "Jan. 2025 - Apr. 2025",
      role: "Software Engineer Intern",
      location: "Toronto, ON",
      bullets: [
        "Automated admin workflows for the Python Software Foundation, 8.2M+ users, by shipping 3 MySQL + JavaScript backend extensions (merge, delete, user creation).",
        "Scaled classification and taxonomy structuring for 10K+ product SKUs by building an LLM + embeddings pipeline for taxonomy classification, entity resolution, and semantic search indexing.",
      ],
    },
  ],
  projects: [
    {
      title: "Matrix | Artificial Societies (Node-Based Agentic Simulation)",
      linkLabel: "github.com/bowenzhu21/matrix",
      linkHref: "https://github.com/bowenzhu21/matrix",
      bullets: [
        "Designed an artificial society of graph-node LLM agents modeled on human demographic & behavior patterns using Exa, propagating via weighted BFS scored by social proximity & societal influence, with Supermemory for context.",
        "Architected a distributed Modal pipeline supporting 100 concurrent DeepSeek-1.5B node agents across 25 GPUs, with 3 instances of DeepSeek-32B for orchestration on 15 GPUs.",
        "Built live avatars for node agents, processing expressions, tone & speech with <200 ms audio & visual response.",
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
      date: "Sep. 2024 - Apr. 2029",
      bullets: [
        "Bill Harvey Scholar (1 of 1) | Lloyd Auckland Invitational | AIME Qualifier | 5x CEMC National Honour (Top 3%)",
        "3.9 GPA | Competitions: Optiver Trading Comp | HackIllinois | NexHacks | 1st Place - Toronto Model UN",
      ],
    },
  ],
};
