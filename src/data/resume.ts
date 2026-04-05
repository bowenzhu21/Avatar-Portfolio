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
      bullets: [],
    },
    {
      company: "Robinhood",
      date: "Jan. 2026 - Apr. 2026",
      role: "Software Engineer Collaborator",
      location: "New York, NY",
      bullets: [
        "Architected a customer support agent training platform using RAG and GPT-4o, deployed across Robinhood's support org to score written responses on tone, clarity, and compliance, achieving 96% agreement with QA reviewers.",
        "Built a voice evaluation pipeline using Deepgram STT and Hume AI to score support responses on tone, empathy, and pacing with 400 ms end-to-end latency.",
      ],
    },
    {
      company: "Hippos Exoskeleton",
      date: "Sep. 2025 - Dec. 2025",
      role: "Software Engineer Intern",
      location: "San Francisco, CA",
      bullets: [
        "Drove $100k order by shipping production C++ firmware and synchronized BLE mobile clients across 50 devices.",
        "Reduced sensor-to-app latency 73% to 120 ms and improved data capture reliability 25% by preprocessing data packets in TypeScript within the mobile app and implementing offline buffering with backpressure.",
        "Built an AWS sensor pipeline with FastAPI, PostgreSQL, and Python fusion algorithms for joint-angle estimation.",
      ],
    },
    {
      company: "Momenta",
      date: "May. 2025 - Aug. 2025",
      role: "Software & ML Engineer Intern",
      location: "Toronto, ON",
      bullets: [
        "Achieved 160 ms E2E latency for AI voice detection by building a Twilio pipeline with sliding-window buffering.",
        "Increased inference throughput 8x and supported 100 concurrent call classifications per node by building an inference service using TensorRT on AWS T4 instances.",
        "Reduced idle GPU capacity 30% and achieved 60 s scale-out via Kubernetes autoscaling on Redis queue depth.",
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
