import rawVoiceContext from "@/data/voice-context.template.json";
import { portfolioEntities } from "@/data/portfolio";
import type { CardType, ConversationMode, PortfolioEntity } from "@/types";

interface VoiceFaq {
  question_patterns: string[];
  answer: string;
}

interface VoiceLink {
  label: string;
  url: string;
}

interface ProjectVoiceContext {
  title: string;
  one_liner: string;
  full_summary: string;
  why_it_matters: string;
  problem: string;
  solution: string;
  your_role: string;
  tech_stack: string[];
  highlights: string[];
  architecture: string[];
  challenges: string[];
  tradeoffs: string[];
  results: string[];
  demo_links: VoiceLink[];
  faq: VoiceFaq[];
}

interface ExperienceVoiceContext {
  title: string;
  one_liner: string;
  full_summary: string;
  company_or_program: string;
  your_role: string;
  scope: string[];
  wins: string[];
  skills_gained: string[];
  faq: VoiceFaq[];
}

interface ResumeVoiceContext {
  headline: string;
  short_summary: string;
  education: string[];
  skills: string[];
  strengths: string[];
  job_targets: string[];
  faq: VoiceFaq[];
}

interface SchoolVoiceContext {
  program: string;
  school_name: string;
  focus_areas: string[];
  notable_courses: string[];
  clubs_or_activities: string[];
  faq: VoiceFaq[];
}

interface ContactVoiceContext {
  email: string;
  linkedin: string;
  github: string;
  website: string;
  call_to_action: string;
}

interface PersonalVoiceContext {
  hobbies: string[];
  nutrition: string[];
  fitness: string[];
  faq: VoiceFaq[];
}

interface ComparisonContext {
  between: string[];
  answer: string;
}

interface CrossEntityVoiceContext {
  comparisons: ComparisonContext[];
  top_level_faq: VoiceFaq[];
}

interface VoiceContextData {
  persona: {
    name: string;
    role: string;
    speaking_style: string[];
    short_intro: string;
  };
  global_rules: {
    allowed_sources_only: boolean;
    if_unknown: string;
    avoid: string[];
  };
  projects: Record<string, ProjectVoiceContext>;
  experience: Record<string, ExperienceVoiceContext>;
  resume: ResumeVoiceContext;
  school: SchoolVoiceContext;
  contact: ContactVoiceContext;
  personal: PersonalVoiceContext;
  cross_entity_questions: CrossEntityVoiceContext;
}

export interface MatchedVoiceFaq {
  source: string;
  answer: string;
  questionPatterns: string[];
}

export const voiceContext = rawVoiceContext as VoiceContextData;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMeaningful(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "unknown." &&
    normalized !== "unknown" &&
    !normalized.startsWith("i do not have enough") &&
    !normalized.startsWith("i do not have a confirmed")
  );
}

function pickMeaningful(values: Array<string | null | undefined>, limit = 2) {
  const picked: string[] = [];

  for (const value of values) {
    if (!isMeaningful(value)) {
      continue;
    }

    const normalized = value!.trim();
    if (!picked.includes(normalized)) {
      picked.push(normalized);
    }

    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

function joinSentences(values: Array<string | null | undefined>, limit = 2) {
  return pickMeaningful(values, limit).join(" ");
}

function getEntityIdFromRoute(route: string | null | undefined) {
  if (!route) {
    return null;
  }

  return portfolioEntities.find((entity) => entity.route === route)?.id ?? null;
}

function getCurrentEntityId(args: {
  routedEntity: PortfolioEntity | null;
  activeEntityId?: string | null;
  activeRoute?: string | null;
}) {
  return (
    args.routedEntity?.id ??
    args.activeEntityId ??
    getEntityIdFromRoute(args.activeRoute ?? null)
  );
}

function matchPattern(normalizedTranscript: string, pattern: string) {
  const normalizedPattern = normalize(pattern);

  if (!normalizedPattern) {
    return false;
  }

  return (
    normalizedTranscript === normalizedPattern ||
    normalizedTranscript.includes(normalizedPattern) ||
    normalizedPattern.includes(normalizedTranscript)
  );
}

function buildMatchedFaqs(source: string, faqs: VoiceFaq[], normalizedTranscript: string) {
  return faqs
    .filter((entry) =>
      entry.question_patterns.some((pattern) => matchPattern(normalizedTranscript, pattern)),
    )
    .map<MatchedVoiceFaq>((entry) => ({
      source,
      answer: entry.answer,
      questionPatterns: entry.question_patterns,
    }));
}

function isProjectContext(
  context: unknown,
): context is ProjectVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "one_liner" in context &&
      "full_summary" in context &&
      "solution" in context &&
      "architecture" in context,
  );
}

function isExperienceContext(
  context: unknown,
): context is ExperienceVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "one_liner" in context &&
      "full_summary" in context &&
      "scope" in context &&
      "wins" in context,
  );
}

function isResumeContext(context: unknown): context is ResumeVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "headline" in context &&
      "short_summary" in context &&
      "strengths" in context,
  );
}

function isSchoolContext(context: unknown): context is SchoolVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "program" in context &&
      "school_name" in context &&
      "focus_areas" in context,
  );
}

function isContactContext(context: unknown): context is ContactVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "email" in context &&
      "call_to_action" in context,
  );
}

function isPersonalContext(context: unknown): context is PersonalVoiceContext {
  return Boolean(
    context &&
      typeof context === "object" &&
      "hobbies" in context &&
      "fitness" in context &&
      "faq" in context,
  );
}

export function getEntityVoiceContext(entityId: string | null | undefined) {
  if (!entityId) {
    return null;
  }

  if (voiceContext.projects[entityId]) {
    return voiceContext.projects[entityId];
  }

  if (voiceContext.experience[entityId]) {
    return voiceContext.experience[entityId];
  }

  if (entityId === "resume") {
    return voiceContext.resume;
  }

  if (entityId === "school") {
    return voiceContext.school;
  }

  if (entityId === "contact") {
    return voiceContext.contact;
  }

  if (entityId === "hobbies") {
    return voiceContext.personal;
  }

  return null;
}

export function getReferencedEntityIds(transcript: string) {
  const normalizedTranscript = normalize(transcript);

  if (!normalizedTranscript) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      portfolioEntities
        .filter((entity) =>
          [entity.id, entity.title, entity.route, ...entity.aliases].some((candidate) =>
            matchPattern(normalizedTranscript, candidate),
          ),
        )
        .map((entity) => entity.id),
    ),
  ).slice(0, 6);
}

export function getMatchedVoiceFaqs(
  transcript: string,
  seedEntityIds: Array<string | null | undefined> = [],
) {
  const normalizedTranscript = normalize(transcript);

  if (!normalizedTranscript) {
    return [] as MatchedVoiceFaq[];
  }

  const relevantEntityIds = Array.from(
    new Set([...seedEntityIds.filter(Boolean), ...getReferencedEntityIds(transcript)]),
  ) as string[];

  const matches: MatchedVoiceFaq[] = [];

  for (const entityId of relevantEntityIds) {
    const context = getEntityVoiceContext(entityId);

    if (
      (isProjectContext(context) || isExperienceContext(context) || isResumeContext(context) || isSchoolContext(context) || isPersonalContext(context)) &&
      context.faq.length > 0
    ) {
      matches.push(...buildMatchedFaqs(`entity:${entityId}`, context.faq, normalizedTranscript));
    }
  }

  matches.push(...buildMatchedFaqs("resume", voiceContext.resume.faq, normalizedTranscript));
  matches.push(...buildMatchedFaqs("school", voiceContext.school.faq, normalizedTranscript));
  matches.push(...buildMatchedFaqs("personal", voiceContext.personal.faq, normalizedTranscript));
  matches.push(
    ...buildMatchedFaqs(
      "cross_entity_questions",
      voiceContext.cross_entity_questions.top_level_faq,
      normalizedTranscript,
    ),
  );

  for (const comparison of voiceContext.cross_entity_questions.comparisons) {
    const allMentioned = comparison.between.every((entityId) =>
      relevantEntityIds.includes(entityId),
    );

    if (allMentioned) {
      matches.push({
        source: `comparison:${comparison.between.join("_vs_")}`,
        answer: comparison.answer,
        questionPatterns: comparison.between,
      });
    }
  }

  return Array.from(
    new Map(matches.map((entry) => [`${entry.source}:${entry.answer}`, entry])).values(),
  ).slice(0, 6);
}

export function getRelevantVoiceKnowledgeBase(args: {
  transcript: string;
  routedEntity: PortfolioEntity | null;
  activeEntityId?: string | null;
  activeRoute?: string | null;
}) {
  const currentEntityId = getCurrentEntityId(args);
  const relevantEntityIds = Array.from(
    new Set([
      currentEntityId,
      ...getReferencedEntityIds(args.transcript),
    ].filter(Boolean)),
  ) as string[];

  return {
    persona: voiceContext.persona,
    globalRules: voiceContext.global_rules,
    activeEntityContext: getEntityVoiceContext(currentEntityId),
    relevantProjects: Object.fromEntries(
      relevantEntityIds
        .filter((entityId) => voiceContext.projects[entityId])
        .map((entityId) => [entityId, voiceContext.projects[entityId]]),
    ),
    relevantExperience: Object.fromEntries(
      relevantEntityIds
        .filter((entityId) => voiceContext.experience[entityId])
        .map((entityId) => [entityId, voiceContext.experience[entityId]]),
    ),
    resume: voiceContext.resume,
    school: voiceContext.school,
    contact: voiceContext.contact,
    personal: voiceContext.personal,
    crossEntityQuestions: voiceContext.cross_entity_questions,
    matchedFaqs: getMatchedVoiceFaqs(args.transcript, [currentEntityId]),
  };
}

export function buildGroundedVoiceFallback(args: {
  transcript: string;
  deterministicFallback: string;
  conversationMode?: ConversationMode;
  activeCard?: CardType | null;
  activeSection?: string | null;
  routedEntity: PortfolioEntity | null;
  activeEntityId?: string | null;
  activeRoute?: string | null;
}) {
  const currentEntityId = getCurrentEntityId(args);
  const faqMatch = getMatchedVoiceFaqs(args.transcript, [currentEntityId])[0];

  if (faqMatch?.answer) {
    return faqMatch.answer;
  }

  const context = getEntityVoiceContext(currentEntityId);
  const mode = args.conversationMode ?? "default";
  const activeCard = args.activeCard ?? "overview";
  const activeSection = args.activeSection ?? null;

  if (isProjectContext(context)) {
    if (mode === "concise") {
      return joinSentences([context.one_liner], 1) || args.deterministicFallback;
    }

    if (activeCard === "stack") {
      return joinSentences([
        context.solution,
        context.tech_stack.length
          ? `I built it with ${context.tech_stack.slice(0, 5).join(", ")}.`
          : null,
      ]) || args.deterministicFallback;
    }

    if (
      activeCard === "architecture" ||
      ["architecture", "mechanics", "controls", "engineering", "components", "workflow", "modeling"].includes(
        activeSection ?? "",
      )
    ) {
      return joinSentences([
        context.solution,
        context.architecture[0],
      ]) || args.deterministicFallback;
    }

    if (["problem"].includes(activeSection ?? "")) {
      return joinSentences([context.problem], 1) || args.deterministicFallback;
    }

    if (["solution"].includes(activeSection ?? "")) {
      return joinSentences([context.solution], 1) || args.deterministicFallback;
    }

    if (
      ["impact", "outcomes", "retention", "validation", "lessons", "takeaways", "growth", "value"].includes(
        activeSection ?? "",
      )
    ) {
      return (
        joinSentences([
          context.results[0],
          context.tradeoffs[0],
          context.challenges[0],
        ]) || args.deterministicFallback
      );
    }

    if (mode === "technical") {
      return (
        joinSentences([
          context.solution,
          context.architecture[0],
        ]) || args.deterministicFallback
      );
    }

    return joinSentences([context.full_summary, context.why_it_matters]) || args.deterministicFallback;
  }

  if (isExperienceContext(context)) {
    if (mode === "concise") {
      return joinSentences([context.one_liner], 1) || args.deterministicFallback;
    }

    if (["role", "scope", "context", "clients"].includes(activeSection ?? "")) {
      return (
        joinSentences([
          context.full_summary,
          ...context.scope,
        ]) || args.deterministicFallback
      );
    }

    if (["delivery", "execution", "engineering", "value"].includes(activeSection ?? "")) {
      return (
        joinSentences([
          context.full_summary,
          ...context.wins,
        ]) || args.deterministicFallback
      );
    }

    if (["skills", "growth", "takeaways"].includes(activeSection ?? "")) {
      return (
        joinSentences([
          context.full_summary,
          context.skills_gained.length
            ? `It sharpened my skills in ${context.skills_gained.slice(0, 4).join(", ")}.`
            : null,
        ]) || args.deterministicFallback
      );
    }

    if (mode === "technical") {
      return (
        joinSentences([
          context.full_summary,
          ...context.wins,
        ]) || args.deterministicFallback
      );
    }

    return joinSentences([context.full_summary], 1) || args.deterministicFallback;
  }

  if (isResumeContext(context)) {
    if (activeCard === "stack") {
      return (
        joinSentences([
          context.short_summary,
          context.skills.length
            ? `My core tools are ${context.skills.slice(0, 6).join(", ")}.`
            : null,
        ]) || args.deterministicFallback
      );
    }

    return joinSentences([context.short_summary, context.headline]) || args.deterministicFallback;
  }

  if (isSchoolContext(context)) {
    return (
      joinSentences([
        `${context.school_name} ${context.program}.`,
        context.focus_areas.length
          ? `I focus most on ${context.focus_areas.slice(0, 4).join(", ")}.`
          : null,
      ]) || args.deterministicFallback
    );
  }

  if (isContactContext(context)) {
    return (
      joinSentences([
        context.call_to_action,
        context.email ? `You can reach me at ${context.email}.` : null,
      ]) || args.deterministicFallback
    );
  }

  if (isPersonalContext(context)) {
    return (
      joinSentences([
        context.faq[0]?.answer ?? null,
        context.fitness[0] ?? null,
      ]) || args.deterministicFallback
    );
  }

  return args.deterministicFallback;
}
