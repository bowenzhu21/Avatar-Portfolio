export type EntityType = "project" | "experience" | "other";

export type CardType =
  | "overview"
  | "technical"
  | "recruiter"
  | "comparison"
  | "contact"
  | "timeline"
  | "highlights";

export type ConversationMode = "idle" | "listening" | "thinking" | "speaking";

export type OrchestrationIntent =
  | "navigate"
  | "answer"
  | "navigate_and_answer"
  | "compare"
  | "clarify"
  | "fallback";

export interface PortfolioSection {
  id: string;
  title: string;
  summary: string;
}

export interface PortfolioEntity {
  id: string;
  title: string;
  type: EntityType;
  route: string;
  aliases: string[];
  shortSummary: string;
  technicalSummary: string;
  recruiterSummary: string;
  tags: string[];
  sections: PortfolioSection[];
  relatedItems: string[];
}

export interface VoiceRouterInput {
  transcript: string;
  activeRoute?: string;
  activeEntityId?: string | null;
  activeSection?: string | null;
  recentEntities?: string[];
  conversationMode?: ConversationMode;
}

export interface VoiceRouterOutput {
  intent: OrchestrationIntent;
  entity: PortfolioEntity | null;
  route: string | null;
  card: CardType;
  section: string | null;
  spokenResponse: string;
  confidence: number;
  followUpSuggestions: string[];
}
