export interface ExperienceScreenRecord {
  id: string;
  title: string;
  role: string;
  date: string;
  location?: string;
  iconSrc: string;
  background: string;
  accent: string;
  description?: string;
  bullets: string[];
}

export const experienceScreens: Record<string, ExperienceScreenRecord> = {
  heygen: {
    id: "heygen",
    title: "HeyGen",
    role: "Software Engineer Intern",
    date: "May. 2026 - Aug. 2026",
    location: "Palo Alto, CA",
    iconSrc: "/icons/heygen.jpeg",
    background:
      "radial-gradient(circle at 18% 14%, rgba(255,255,255,0.42), transparent 28%), radial-gradient(circle at 82% 22%, rgba(122,192,255,0.34), transparent 30%), linear-gradient(180deg, rgba(228,241,255,0.98) 0%, rgba(193,222,255,0.97) 48%, rgba(152,198,252,0.96) 100%)",
    accent: "#69b6ff",
    bullets: [],
  },
  "hippos-exoskeleton": {
    id: "hippos-exoskeleton",
    title: "Hippos Exoskeleton",
    role: "Software Engineer Intern",
    date: "Sep. 2025 - Dec. 2025",
    location: "San Francisco, CA",
    iconSrc: "/icons/hippos.jpeg",
    background:
      "radial-gradient(circle at 16% 12%, rgba(255,255,255,0.44), transparent 28%), radial-gradient(circle at 84% 20%, rgba(171,191,228,0.34), transparent 30%), linear-gradient(180deg, rgba(235,241,250,0.98) 0%, rgba(206,219,239,0.97) 44%, rgba(178,194,223,0.96) 100%)",
    accent: "#8fa8d8",
    bullets: [
      "Reduced sensor-to-app latency 73% (120 ms) and improved data capture reliability 25% by integrating processing into the mobile app and implementing offline buffering with backpressure.",
      "Drove $100k order by shipping production C++ firmware and synchronized BLE mobile clients across 50 devices.",
      "Built sensor pipeline with FastAPI + PostgreSQL on AWS, and Python fusion algorithms for joint-angle estimation.",
    ],
  },
  momenta: {
    id: "momenta",
    title: "Momenta",
    role: "Software & ML Engineer Intern",
    date: "May. 2025 - Aug. 2025",
    location: "Toronto, ON",
    iconSrc: "/icons/momenta.jpeg",
    background:
      "radial-gradient(circle at 16% 12%, rgba(255,255,255,0.46), transparent 28%), radial-gradient(circle at 84% 20%, rgba(149,117,255,0.34), transparent 30%), linear-gradient(180deg, rgba(241,235,255,0.98) 0%, rgba(220,208,255,0.97) 44%, rgba(193,176,255,0.96) 100%)",
    accent: "#7b63ff",
    bullets: [
      "Achieved 160 ms E2E latency for AI voice detection by building a Twilio pipeline with sliding-window buffering.",
      "Increased inference throughput 8x and supported 100 concurrent call classifications per GPU node by building a TensorRT-optimized GPU inference service on AWS T4 instances.",
      "Reduced GPU over-provisioning and enabled 60 s scale-out with Kubernetes autoscaling on Redis queue depth.",
    ],
  },
  "jma-consulting": {
    id: "jma-consulting",
    title: "JMA Consulting",
    role: "Software Engineer Intern",
    date: "Jan. 2025 - Apr. 2025",
    location: "Toronto, ON",
    iconSrc: "/icons/jma.jpeg",
    background:
      "radial-gradient(circle at 16% 12%, rgba(255,255,255,0.44), transparent 28%), radial-gradient(circle at 84% 20%, rgba(86,176,132,0.34), transparent 30%), linear-gradient(180deg, rgba(236,247,239,0.98) 0%, rgba(209,233,216,0.97) 44%, rgba(181,214,192,0.96) 100%)",
    accent: "#4b9f78",
    bullets: [
      "Automated admin workflows for the Python Software Foundation, 8.2M+ users, by shipping 3 MySQL + JavaScript backend extensions (merge, delete, user creation).",
      "Scaled classification and taxonomy structuring for 10K+ product SKUs by building an LLM + embeddings pipeline for taxonomy classification, entity resolution, and semantic search indexing.",
    ],
  },
  school: {
    id: "school",
    title: "University of Waterloo",
    role: "BASc in Systems Design Engineering (Co-op)",
    date: "Sep. 2024 - Apr. 2029",
    iconSrc: "/icons/school.jpeg",
    background:
      "radial-gradient(circle at 16% 12%, rgba(255,255,255,0.42), transparent 28%), radial-gradient(circle at 84% 20%, rgba(191,146,62,0.3), transparent 30%), linear-gradient(180deg, rgba(247,239,216,0.98) 0%, rgba(236,217,165,0.97) 44%, rgba(216,187,113,0.95) 100%)",
    accent: "#916d2c",
    bullets: [
      "Bill Harvey Scholar (1 of 1) | Lloyd Auckland Invitational | AIME Qualifier | 5x CEMC National Honour (Top 3%)",
      "3.9 GPA | Competitions: Optiver Trading Comp | HackIllinois | NexHacks | 1st Place - Toronto Model UN",
    ],
  },
};
