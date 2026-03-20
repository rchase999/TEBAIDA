// Debate formats
export type DebateFormat = 'oxford-union' | 'lincoln-douglas' | 'parliamentary';

// Debate status
export type DebateStatus = 'setup' | 'in-progress' | 'paused' | 'completed' | 'cancelled';

// Model providers
export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'groq' | 'ollama' | 'lmstudio';

// Model definition
export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  name: string;
  displayName: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

// Persona definition (as shown in README)
export interface Persona {
  id: string;
  name: string;
  tagline: string;
  background: string;
  expertise: string[];
  rhetorical_style: string;
  ideological_leanings: string;
  argumentation_preferences: {
    evidence_weight: 'heavy' | 'moderate' | 'light';
    emotional_appeals: 'heavy' | 'moderate' | 'minimal';
    concession_willingness: 'high' | 'moderate' | 'low';
    humor: string;
  };
  debate_behavior: {
    opening_strategy: string;
    rebuttal_strategy: string;
    closing_strategy: string;
  };
  avatar_color?: string;
}

// Universal Persona Prompt
export interface UniversalPersonaPrompt {
  upp_version: string;
  generated_at: string;
  user_profile: {
    preferred_topics: string[];
    expertise_level: string;
    debate_preferences: string;
    interaction_style: string;
  };
  persona_state: {
    name: string;
    accumulated_positions: string[];
    user_relationship_notes: string;
  };
  instructions_for_any_model: string;
}

// Debater configuration
export interface DebaterConfig {
  id: string;
  name: string;
  model: ModelConfig;
  persona: Persona;
  position: 'proposition' | 'opposition' | 'housemaster';
  isLocal: boolean;
}

// Citation
export interface Citation {
  id: string;
  url: string;
  title: string;
  passage: string;
  credibilityScore?: number;
  sourceType?: 'peer-reviewed' | 'government' | 'news' | 'blog' | 'social-media' | 'unknown';
  verified: boolean;
  screenshotPath?: string;
}

// Debate turn
export interface DebateTurn {
  id: string;
  debateId: string;
  debaterName: string;
  debaterId: string;
  model: string;
  persona: string;
  content: string;
  thinking?: string;
  citations: Citation[];
  round: number;
  phase: DebatePhase;
  timestamp: string;
  isStreaming?: boolean;
  fallacies?: DetectedFallacy[];
}

// Debate phase
export type DebatePhase = 'introduction' | 'opening' | 'transition' | 'rebuttal' | 'cross-examination' | 'closing' | 'verdict';

// Debate format configuration
export interface DebateFormatConfig {
  id: DebateFormat;
  name: string;
  description: string;
  totalTurns: number;
  turnSequence: { phase: DebatePhase; role: 'proposition' | 'opposition' | 'housemaster' }[];
  rules: string[];
}

// Opinion poll value
export type OpinionValue = 'for' | 'against' | 'undecided';

// Momentum data point for a single turn
export interface MomentumPoint {
  turnIndex: number;
  score: number; // -100 to +100 (positive = proposition winning, negative = opposition winning)
  role: 'proposition' | 'opposition' | 'housemaster';
  phase: DebatePhase;
}

// User commentary entry
export interface UserComment {
  content: string;
  afterTurn: number;
  timestamp: string;
}

// Full debate state
export interface Debate {
  id: string;
  topic: string;
  format: DebateFormatConfig;
  status: DebateStatus;
  debaters: DebaterConfig[];
  turns: DebateTurn[];
  currentRound: number;
  currentDebaterIndex: number;
  currentPhase: DebatePhase;
  housemasterId?: string;
  scores?: DebateScore[];
  userPreOpinion?: OpinionValue;
  userPostOpinion?: OpinionValue;
  momentum?: MomentumPoint[];
  comments?: UserComment[];
  language?: string;
  audienceVotes?: { for: number; against: number; undecided: number };
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp when the first turn generation started */
  startedAt?: string;
  /** ISO timestamp when the debate was completed */
  completedAt?: string;
}

// Scoring
export interface DebateScore {
  debaterId: string;
  debaterName: string;
  categories: {
    argumentation: number; // 1-10
    evidence: number;
    rebuttal: number;
    rhetoric: number;
    overall: number;
  };
  notes: string;
}

// Fallacy detection
export interface DetectedFallacy {
  type: string;
  name: string;
  description: string;
  passage: string;
  severity: 'low' | 'medium' | 'high';
}

// API key storage
export interface ApiKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
  mistral?: string;
  groq?: string;
}

// App settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  localModelEndpoint: string;
  lmStudioEndpoint: string;
  evidencePanelEnabled: boolean;
  fallacyDetectionEnabled: boolean;
  autoSaveDebates: boolean;
  streamingEnabled: boolean;
  language?: string;
}

// Streaming chunk from model
export interface StreamChunk {
  content: string;
  done: boolean;
  /** 'thinking' for internal reasoning, 'text' for final response */
  type?: 'thinking' | 'text';
}

// Message for model API calls
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
