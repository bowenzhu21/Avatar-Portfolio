import type { PortfolioEntity } from "@/types";

export interface CompactPortfolioEntity {
  id: string;
  title: string;
  type: PortfolioEntity["type"];
  route: string;
  aliases: string[];
  tags: string[];
  shortSummary: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
}

export const portfolioEntities: PortfolioEntity[] = [
  {
    id: "matrix",
    title: "Matrix",
    type: "project",
    route: "/projects/matrix",
    aliases: ["matrix", "matrix project", "ops dashboard", "decision cockpit"],
    shortSummary:
      "A decision-support workspace for turning live operational signals into concise executive recommendations.",
    technicalSummary:
      "Built as a modular web platform with typed data contracts, event ingestion, and configurable analytics surfaces for rapid iteration.",
    recruiterSummary:
      "Shows product thinking, system design, and the ability to package complex data into a crisp operator experience.",
    tags: ["TypeScript", "Dashboards", "Analytics", "Product Strategy"],
    sections: [
      {
        id: "overview",
        title: "Overview",
        summary: "Product scope, user goals, and the operational problem the project solves.",
      },
      {
        id: "architecture",
        title: "Architecture",
        summary: "Data flow, service boundaries, and the typed UI system behind the dashboard.",
      },
      {
        id: "impact",
        title: "Impact",
        summary: "Placeholder metrics around adoption, faster decision cycles, and reduced reporting friction.",
      },
    ],
    relatedItems: ["adapt-ui", "heygen", "momenta"],
  },
  {
    id: "adapt-ui",
    title: "Adapt UI",
    type: "project",
    route: "/projects/adapt-ui",
    aliases: ["adapt ui", "adaptive interface", "design system", "ui toolkit"],
    shortSummary:
      "A flexible component system designed to adapt layout, density, and information hierarchy to different user contexts.",
    technicalSummary:
      "Focused on composable primitives, variant-driven styling, accessibility, and reusable interaction patterns across multiple products.",
    recruiterSummary:
      "Highlights front-end craftsmanship, systems thinking, and an ability to scale design quality with code.",
    tags: ["React", "Design Systems", "Accessibility", "Tailwind"],
    sections: [
      {
        id: "components",
        title: "Components",
        summary: "Reusable primitives, token strategy, and responsive composition patterns.",
      },
      {
        id: "workflow",
        title: "Workflow",
        summary: "How engineers and designers collaborated on versioning, QA, and adoption.",
      },
      {
        id: "outcomes",
        title: "Outcomes",
        summary: "Placeholder efficiency gains, consistency improvements, and faster feature delivery.",
      },
    ],
    relatedItems: ["matrix", "aura-dev", "heygen"],
  },
  {
    id: "aura-dev",
    title: "Aura Dev",
    type: "project",
    route: "/projects/aura-dev",
    aliases: ["aura dev", "developer assistant", "internal tools", "aura"],
    shortSummary:
      "An internal developer experience concept focused on reducing repetitive setup and debugging overhead.",
    technicalSummary:
      "Combined templated workflows, environment checks, and opinionated scaffolding to make engineering onboarding more predictable.",
    recruiterSummary:
      "Represents leverage-oriented thinking and a bias toward tooling that improves team velocity.",
    tags: ["DX", "Automation", "Tooling", "Node.js"],
    sections: [
      {
        id: "problem",
        title: "Problem",
        summary: "Common friction points in setup, environment drift, and repeated debugging tasks.",
      },
      {
        id: "solution",
        title: "Solution",
        summary: "CLI utilities, templates, and validation hooks that standardize local workflows.",
      },
      {
        id: "lessons",
        title: "Lessons",
        summary: "Tradeoffs around flexibility, ownership, and how much process to automate.",
      },
    ],
    relatedItems: ["adapt-ui", "jma-consulting", "gymbro"],
  },
  {
    id: "elbow-exo",
    title: "Elbow Exo",
    type: "project",
    route: "/projects/elbow-exo",
    aliases: ["elbow exo", "exoskeleton prototype", "robotics elbow", "exo"],
    shortSummary:
      "A prototype upper-limb exoskeleton concept exploring assistive motion, ergonomics, and manufacturability.",
    technicalSummary:
      "Combined CAD iteration, actuation tradeoff analysis, and experimental control concepts to evaluate feasible assistive movement.",
    recruiterSummary:
      "Demonstrates mechanical breadth, prototyping discipline, and comfort with multidisciplinary problem solving.",
    tags: ["Robotics", "Mechanical Design", "Controls", "Prototyping"],
    sections: [
      {
        id: "mechanics",
        title: "Mechanics",
        summary: "Joint geometry, load paths, and ergonomic constraints for assistive movement.",
      },
      {
        id: "controls",
        title: "Controls",
        summary: "High-level control approach and placeholder sensing assumptions.",
      },
      {
        id: "validation",
        title: "Validation",
        summary: "Prototype testing ideas, safety considerations, and iteration criteria.",
      },
    ],
    relatedItems: ["hippos-exoskeleton", "school", "gymbro"],
  },
  {
    id: "gymbro",
    title: "GymBro",
    type: "project",
    route: "/projects/gymbro",
    aliases: ["gymbro", "fitness app", "training tracker", "workout app"],
    shortSummary:
      "A training companion concept for tracking workouts, progress trends, and habit consistency with a lighter UX.",
    technicalSummary:
      "Structured around mobile-friendly state flows, progression models, and clean data entry for routine adherence.",
    recruiterSummary:
      "Useful example of consumer product execution and balancing technical scope with everyday usability.",
    tags: ["Mobile UX", "Product Design", "Tracking", "Habits"],
    sections: [
      {
        id: "experience",
        title: "Experience",
        summary: "Core user journey from logging a session to reviewing progress.",
      },
      {
        id: "modeling",
        title: "Modeling",
        summary: "Placeholder data model for exercises, routines, and progression history.",
      },
      {
        id: "retention",
        title: "Retention",
        summary: "Ideas for reminders, streaks, and lightweight accountability loops.",
      },
    ],
    relatedItems: ["aura-dev", "school", "hobbies"],
  },
  {
    id: "heygen",
    title: "HeyGen",
    type: "experience",
    route: "/experience/heygen",
    aliases: ["heygen", "hey gen", "avatar company", "streaming avatar"],
    shortSummary:
      "Experience centered on AI avatar products, real-time interaction design, and translating emerging capabilities into user value.",
    technicalSummary:
      "Worked across product surfaces where conversational systems, media pipelines, and front-end experience quality intersected.",
    recruiterSummary:
      "Signals exposure to fast-moving AI products and a strong sense for execution in ambiguous environments.",
    tags: ["AI", "Avatars", "Realtime", "Product Engineering"],
    sections: [
      {
        id: "scope",
        title: "Scope",
        summary: "Product areas, collaboration patterns, and example responsibilities.",
      },
      {
        id: "execution",
        title: "Execution",
        summary: "Shipping in an ambiguous environment with evolving platform constraints.",
      },
      {
        id: "takeaways",
        title: "Takeaways",
        summary: "What the role sharpened around communication, iteration speed, and product judgment.",
      },
    ],
    relatedItems: ["matrix", "adapt-ui", "contact"],
  },
  {
    id: "hippos-exoskeleton",
    title: "Hippos Exoskeleton",
    type: "experience",
    route: "/experience/hippos-exoskeleton",
    aliases: ["hippos exoskeleton", "hippos", "exoskeleton company", "robotics experience"],
    shortSummary:
      "Hands-on robotics experience involving assistive hardware concepts, prototyping, and practical engineering constraints.",
    technicalSummary:
      "Covered iterative mechanical design, test-oriented thinking, and cross-functional communication across hardware development.",
    recruiterSummary:
      "Shows the ability to work beyond pure software and communicate across engineering disciplines.",
    tags: ["Robotics", "Hardware", "Testing", "Mechanical Engineering"],
    sections: [
      {
        id: "role",
        title: "Role",
        summary: "Placeholder responsibilities, team context, and program focus.",
      },
      {
        id: "engineering",
        title: "Engineering",
        summary: "Prototype iteration, test feedback loops, and system tradeoffs.",
      },
      {
        id: "growth",
        title: "Growth",
        summary: "Skills developed around rigor, documentation, and hands-on execution.",
      },
    ],
    relatedItems: ["elbow-exo", "school", "momenta"],
  },
  {
    id: "momenta",
    title: "Momenta",
    type: "experience",
    route: "/experience/momenta",
    aliases: ["momenta", "consulting program", "venture program", "startup work"],
    shortSummary:
      "A role focused on structured problem solving, research synthesis, and communicating recommendations clearly.",
    technicalSummary:
      "Blended market analysis, stakeholder alignment, and decision frameworks to support early-stage or fast-moving initiatives.",
    recruiterSummary:
      "Useful evidence of strategic thinking and concise communication, especially outside pure implementation work.",
    tags: ["Strategy", "Research", "Analysis", "Communication"],
    sections: [
      {
        id: "context",
        title: "Context",
        summary: "Program environment, stakeholders, and the kinds of problems being solved.",
      },
      {
        id: "delivery",
        title: "Delivery",
        summary: "How research and recommendations were framed for action.",
      },
      {
        id: "value",
        title: "Value",
        summary: "Placeholder impact around decision quality, clarity, and execution speed.",
      },
    ],
    relatedItems: ["matrix", "jma-consulting", "resume"],
  },
  {
    id: "jma-consulting",
    title: "JMA Consulting",
    type: "experience",
    route: "/experience/jma-consulting",
    aliases: ["jma consulting", "jma", "consulting", "client work"],
    shortSummary:
      "Client-facing work focused on translating ambiguous requirements into practical delivery plans and polished outputs.",
    technicalSummary:
      "Involved stakeholder management, iterative scoping, and delivering work that balanced feasibility, timing, and business goals.",
    recruiterSummary:
      "Highlights communication, ownership, and the ability to ship under real external constraints.",
    tags: ["Consulting", "Clients", "Delivery", "Scoping"],
    sections: [
      {
        id: "clients",
        title: "Clients",
        summary: "Who the work served and the types of engagements involved.",
      },
      {
        id: "delivery",
        title: "Delivery",
        summary: "How projects were scoped, revised, and moved toward execution.",
      },
      {
        id: "skills",
        title: "Skills",
        summary: "Communication, prioritization, and expectation management in practice.",
      },
    ],
    relatedItems: ["momenta", "aura-dev", "contact"],
  },
  {
    id: "photos",
    title: "Photos",
    type: "other",
    route: "/photos",
    aliases: ["photos", "photo app", "gallery"],
    shortSummary: "A blank placeholder for a future Photos app experience.",
    technicalSummary: "Placeholder.",
    recruiterSummary: "Placeholder.",
    tags: ["Photos"],
    sections: [
      {
        id: "overview",
        title: "Overview",
        summary: "Placeholder.",
      },
    ],
    relatedItems: [],
  },
  {
    id: "school",
    title: "School",
    type: "other",
    route: "/school",
    aliases: ["school", "education", "university", "coursework"],
    shortSummary:
      "Academic background covering engineering fundamentals, project-based learning, and technical problem solving.",
    technicalSummary:
      "Includes structured exposure to mechanics, programming, systems thinking, and collaborative technical work.",
    recruiterSummary:
      "Provides baseline educational context and shows the foundation behind later projects and roles.",
    tags: ["Education", "Engineering", "Coursework"],
    sections: [
      {
        id: "program",
        title: "Program",
        summary: "Program focus, academic themes, and the disciplines emphasized.",
      },
      {
        id: "projects",
        title: "Projects",
        summary: "Representative academic work and how it informed later portfolio items.",
      },
      {
        id: "skills",
        title: "Skills",
        summary: "Foundational technical and teamwork capabilities developed through school.",
      },
    ],
    relatedItems: ["elbow-exo", "hippos-exoskeleton", "gymbro"],
  },
  {
    id: "resume",
    title: "Resume",
    type: "other",
    route: "/resume",
    aliases: ["resume", "cv", "background", "summary"],
    shortSummary:
      "A condensed view of experience, projects, and skills tailored for quick recruiter review.",
    technicalSummary:
      "Organized to surface relevant experience efficiently while preserving room for technical depth in conversation.",
    recruiterSummary:
      "This is the fastest route for understanding overall fit, trajectory, and strengths.",
    tags: ["Resume", "Summary", "Career"],
    sections: [
      {
        id: "highlights",
        title: "Highlights",
        summary: "Quick scan of the most relevant achievements and strengths.",
      },
      {
        id: "timeline",
        title: "Timeline",
        summary: "A chronological view of roles, projects, and transitions.",
      },
      {
        id: "skills",
        title: "Skills",
        summary: "Grouped strengths across software, hardware, and communication.",
      },
    ],
    relatedItems: ["momenta", "heygen", "contact"],
  },
  {
    id: "contact",
    title: "Contact",
    type: "other",
    route: "/contact",
    aliases: ["contact", "reach out", "email", "linkedin"],
    shortSummary:
      "The place for reaching out, continuing the conversation, or requesting a deeper walkthrough.",
    technicalSummary:
      "Can eventually hold structured contact channels, availability notes, and context-aware call-to-actions.",
    recruiterSummary:
      "A clean exit point that makes next steps obvious and low-friction.",
    tags: ["Contact", "Networking", "Follow Up"],
    sections: [
      {
        id: "channels",
        title: "Channels",
        summary: "Primary contact methods and preferred outreach paths.",
      },
      {
        id: "availability",
        title: "Availability",
        summary: "Placeholder notes on response time, role interest, and collaboration preferences.",
      },
    ],
    relatedItems: ["resume", "heygen", "jma-consulting"],
  },
  {
    id: "hobbies",
    title: "Hobbies",
    type: "other",
    route: "/hobbies",
    aliases: ["hobbies", "interests", "outside work", "personal interests"],
    shortSummary:
      "A lightweight view into personal interests that round out the portfolio beyond work and school.",
    technicalSummary:
      "Can support conversational depth by connecting personal curiosity to product taste, discipline, and energy outside core work.",
    recruiterSummary:
      "Useful for cultural fit, rapport, and making the portfolio feel like a person rather than a resume dump.",
    tags: ["Personal", "Interests", "Culture"],
    sections: [
      {
        id: "activities",
        title: "Activities",
        summary: "Interests, routines, and communities that matter outside formal work.",
      },
      {
        id: "mindset",
        title: "Mindset",
        summary: "How hobbies reflect learning style, discipline, or creative taste.",
      },
    ],
    relatedItems: ["gymbro", "contact", "school"],
  },
];

export const portfolioEntityMap = new Map(
  portfolioEntities.map((entity) => [entity.id, entity]),
);

export const compactPortfolioRegistry: CompactPortfolioEntity[] = portfolioEntities.map(
  (entity) => ({
    id: entity.id,
    title: entity.title,
    type: entity.type,
    route: entity.route,
    aliases: entity.aliases,
    tags: entity.tags,
    shortSummary: entity.shortSummary,
    sections: entity.sections.map((section) => ({
      id: section.id,
      title: section.title,
    })),
  }),
);
