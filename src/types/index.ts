export type EntityType = "project" | "experience" | "other";

export type CardType =
  | "overview"
  | "architecture"
  | "stack"
  | "comparison"
  | "contact"
  | "resume"
  | "hobbies";

export type ConversationMode = "default" | "recruiter" | "technical" | "concise";

export type InteractionPhase = "idle" | "listening" | "thinking" | "speaking";

export type PhoneApp =
  | "home"
  | "projects"
  | "experience"
  | "photos"
  | "school"
  | "resume"
  | "contact"
  | "hobbies";

export type PhoneScreenView = "home" | "list" | "detail";

export interface PhoneScreenState {
  app: PhoneApp;
  view: PhoneScreenView;
  title: string;
  entityId: string | null;
  route: string | null;
  card: CardType;
}

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
  activeCard?: CardType | null;
  activeSection?: string | null;
  recentEntities?: string[];
  conversationMode?: ConversationMode;
  lastIntent?: OrchestrationIntent | null;
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

export interface SubmittedUtterance {
  id: string;
  text: string;
  source: "voice" | "chip";
}

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}
