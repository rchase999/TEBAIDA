import { create } from 'zustand';
import type {
  Debate,
  DebateTurn,
  DebaterConfig,
  DebatePhase,
  Persona,
  ModelProvider,
  ApiKeys,
  AppSettings,
} from '../types';
import type { ModelRating, HeadToHeadRecord } from '../core/elo/index';
import {
  getDefaultRating,
  calculateNewRatings,
  loadModelRatings,
  persistModelRatings,
  loadHeadToHead,
  persistHeadToHead,
  h2hKey,
} from '../core/elo/index';

// ---------------------------------------------------------------------------
// ElectronAPI type (exposed from preload)
// ---------------------------------------------------------------------------
interface ElectronAPI {
  getApiKeys(): Promise<Record<string, string>>;
  saveApiKeys(keys: Record<string, string>): Promise<void>;
  openExternalUrl(url: string): Promise<void>;
  getAppPath(): Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// ---------------------------------------------------------------------------
// View type
// ---------------------------------------------------------------------------
export type AppView = 'home' | 'debate' | 'setup' | 'personas' | 'settings' | 'tournament' | 'leaderboard' | 'statistics' | 'profile' | 'about' | 'help' | 'changelog' | 'landing' | 'history' | 'debateDetail' | 'error' | 'signin' | 'signup' | 'forgot-password' | 'verify-email' | '2fa-setup' | '2fa-verify' | 'account-security' | 'admin';

// ---------------------------------------------------------------------------
// Theme type
// ---------------------------------------------------------------------------
export type ThemeMode = 'light' | 'dark' | 'system';

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  localModelEndpoint: 'http://localhost:11434',
  lmStudioEndpoint: 'http://localhost:1234/v1',
  evidencePanelEnabled: true,
  fallacyDetectionEnabled: true,
  autoSaveDebates: true,
  streamingEnabled: true,
};

// ---------------------------------------------------------------------------
// Default debater configs used in the setup wizard
// ---------------------------------------------------------------------------
function makeDefaultDebater(position: 'proposition' | 'opposition', index: number): DebaterConfig {
  // Default proposition to Claude, opposition to GPT for model diversity
  const isProposition = position === 'proposition';
  return {
    id: `debater-${index}`,
    name: isProposition ? 'Proposition' : 'Opposition',
    model: isProposition ? {
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      name: 'claude-sonnet-4-20250514',
      displayName: 'Claude Sonnet 4',
      maxTokens: 8192,
      supportsStreaming: true,
    } : {
      id: 'gpt-4o',
      provider: 'openai',
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      maxTokens: 4096,
      supportsStreaming: true,
    },
    persona: {
      id: `default-${position}`,
      name: position === 'proposition' ? 'Advocate' : 'Critic',
      tagline: position === 'proposition' ? 'Passionate defender of the proposition' : 'Rigorous challenger of claims',
      background: 'General knowledge across multiple fields',
      expertise: ['logic', 'rhetoric', 'critical thinking'],
      rhetorical_style: position === 'proposition' ? 'persuasive and constructive' : 'analytical and challenging',
      ideological_leanings: 'balanced',
      argumentation_preferences: {
        evidence_weight: 'moderate',
        emotional_appeals: 'moderate',
        concession_willingness: 'moderate',
        humor: 'occasional',
      },
      debate_behavior: {
        opening_strategy: position === 'proposition'
          ? 'Present a strong, clear thesis with supporting evidence'
          : 'Identify weaknesses in the proposition and present counter-evidence',
        rebuttal_strategy: position === 'proposition'
          ? 'Address criticisms directly while reinforcing core arguments'
          : 'Deconstruct arguments systematically, highlighting logical gaps',
        closing_strategy: position === 'proposition'
          ? 'Summarize strongest points and paint a compelling vision'
          : 'Synthesize rebuttals into a cohesive counter-narrative',
      },
    },
    position,
    isLocal: false,
  };
}

function makeDefaultHousemaster(): DebaterConfig {
  return {
    id: 'debater-housemaster',
    name: 'Housemaster',
    model: {
      id: 'gpt-4o',
      provider: 'openai',
      name: 'gpt-4o',
      displayName: 'GPT-4o',
      maxTokens: 4096,
      supportsStreaming: true,
    },
    persona: {
      id: 'default-housemaster',
      name: 'The Housemaster',
      tagline: 'Order in the house!',
      background: 'An experienced parliamentary moderator and debate adjudicator with decades of experience presiding over formal debates.',
      expertise: ['moderation', 'parliamentary procedure', 'rhetoric', 'critical analysis'],
      rhetorical_style: 'Authoritative yet fair. Maintains decorum while probing both sides equally.',
      ideological_leanings: 'Strictly neutral — focused on fairness and quality of argument.',
      argumentation_preferences: {
        evidence_weight: 'heavy',
        emotional_appeals: 'minimal',
        concession_willingness: 'moderate',
        humor: 'Wry parliamentary wit.',
      },
      debate_behavior: {
        opening_strategy: 'Set the stage clearly, explain the motion, and establish ground rules.',
        rebuttal_strategy: 'Ask pointed questions to both sides, challenging weak points impartially.',
        closing_strategy: 'Weigh all arguments presented and deliver a reasoned verdict.',
      },
      avatar_color: '#D97706',
    },
    position: 'housemaster',
    isLocal: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers: load theme preference
// ---------------------------------------------------------------------------
function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('debateforge-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage may be unavailable
  }
  return 'system';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeClass(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.style.colorScheme = resolved;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
export interface DebateForgeState {
  // ── App state ──
  theme: ThemeMode;
  sidebarOpen: boolean;
  currentView: AppView;

  // ── API keys ──
  apiKeys: ApiKeys;
  setApiKey: (provider: ModelProvider, key: string) => void;
  loadApiKeys: () => Promise<void>;
  saveApiKeys: () => Promise<void>;

  // ── Settings ──
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // ── Debate state ──
  currentDebate: Debate | null;
  debates: Debate[];
  isDebating: boolean;
  streamingContent: string;
  streamingThinking: string;
  setCurrentDebate: (debate: Debate | null) => void;
  addTurn: (turn: DebateTurn) => void;
  updateTurn: (turnId: string, updates: Partial<DebateTurn>) => void;
  deleteDebate: (id: string) => void;
  setStreamingContent: (content: string) => void;
  setStreamingThinking: (content: string) => void;
  clearStreamingContent: () => void;

  // ── Setup state ──
  setupTopic: string;
  setupDebaters: DebaterConfig[];
  setSetupTopic: (topic: string) => void;
  addSetupDebater: (debater: DebaterConfig) => void;
  removeSetupDebater: (id: string) => void;
  updateSetupDebater: (id: string, updates: Partial<DebaterConfig>) => void;
  resetSetup: () => void;

  // ── Persona state ──
  personas: Persona[];
  selectedPersona: Persona | null;
  loadPersonas: () => void;
  addPersona: (persona: Persona) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  selectPersona: (persona: Persona | null) => void;

  // ── Evidence state ──
  evidenceUrl: string | null;
  evidenceHighlight: string | null;
  showEvidencePanel: boolean;
  setEvidence: (url: string, highlight: string) => void;
  clearEvidence: () => void;
  toggleEvidencePanel: () => void;

  // ── ELO / Leaderboard state ──
  modelRatings: Record<string, ModelRating>;
  headToHeadRecords: Record<string, HeadToHeadRecord>;
  recordDebateResult: (
    winnerId: string,
    loserId: string,
    isDraw: boolean,
    winnerModel: { id: string; name: string; displayName: string; provider: string },
    loserModel: { id: string; name: string; displayName: string; provider: string },
  ) => void;
  getLeaderboard: () => (ModelRating & { rank: number; winRate: number; totalDebates: number })[];
  getHeadToHead: (modelA: string, modelB: string) => HeadToHeadRecord | null;
  resetLeaderboard: () => void;

  // ── User profile ──
  userProfile: UserProfile;
  updateUserProfile: (partial: Partial<UserProfile>) => void;

  // ── UI actions ──
  setTheme: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  setCurrentView: (view: AppView) => void;
  navigateTo: (view: AppView) => void;
}

// ---------------------------------------------------------------------------
// User profile type
// ---------------------------------------------------------------------------
export interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  avatarColor: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Personas persistence helpers (localStorage)
// ---------------------------------------------------------------------------
const PERSONAS_KEY = 'debateforge-personas';

// Built-in personas shipped with DebateForge
const BUILT_IN_PERSONAS: Persona[] = [
  {
    id: 'rational-analyst',
    name: 'The Rational Analyst',
    tagline: 'Evidence first, conclusions second.',
    background: 'Trained in formal logic and statistical analysis. Approaches every debate as an exercise in finding the most defensible position through rigorous evidence evaluation.',
    expertise: ['statistics', 'formal logic', 'policy analysis', 'economics'],
    rhetorical_style: 'Methodical and precise. Builds arguments like proofs, step by step.',
    ideological_leanings: 'Pragmatic centrist — follows the evidence wherever it leads.',
    argumentation_preferences: { evidence_weight: 'heavy', emotional_appeals: 'minimal', concession_willingness: 'high', humor: 'Dry, data-driven wit.' },
    debate_behavior: { opening_strategy: 'Lead with the strongest empirical evidence. Frame the debate around measurable outcomes.', rebuttal_strategy: 'Identify logical gaps and unsupported claims. Demand evidence for every assertion.', closing_strategy: 'Summarize the weight of evidence on each side. Show how the data supports the position.' },
    avatar_color: '#3B82F6',
  },
  {
    id: 'passionate-advocate',
    name: 'The Passionate Advocate',
    tagline: 'Every issue has a human face.',
    background: 'A former community organizer and civil rights lawyer. Believes that the most compelling arguments connect policy to real human stories and lived experiences.',
    expertise: ['civil rights', 'social justice', 'community organizing', 'narrative persuasion'],
    rhetorical_style: 'Emotionally compelling and vivid. Uses anecdotes, metaphors, and moral framing.',
    ideological_leanings: 'Progressive — champions equity and systemic reform.',
    argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'heavy', concession_willingness: 'moderate', humor: 'Self-deprecating and warm.' },
    debate_behavior: { opening_strategy: 'Open with a powerful story that puts a human face on the issue. Establish moral stakes.', rebuttal_strategy: 'Reframe opponent\'s abstractions in human terms. Ask "who does this policy hurt?"', closing_strategy: 'Return to the opening story. Paint a vivid picture of the better future your position enables.' },
    avatar_color: '#EF4444',
  },
  {
    id: 'devils-advocate',
    name: 'The Devil\'s Advocate',
    tagline: 'Nothing is sacred, everything is questionable.',
    background: 'A philosophy professor specializing in epistemology and critical thinking. Takes contrarian positions not out of belief but to stress-test ideas and expose weak reasoning.',
    expertise: ['philosophy', 'epistemology', 'critical thinking', 'rhetoric'],
    rhetorical_style: 'Provocative and Socratic. Asks uncomfortable questions and challenges assumptions.',
    ideological_leanings: 'Deliberately contrarian — opposes the consensus to test it.',
    argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'minimal', concession_willingness: 'low', humor: 'Sardonic and incisive.' },
    debate_behavior: { opening_strategy: 'Identify the most widely held assumption and immediately challenge it. Create productive discomfort.', rebuttal_strategy: 'Find the hidden assumptions in every argument. Use reductio ad absurdum liberally.', closing_strategy: 'Show how the debate has revealed weaknesses in conventional thinking, regardless of which side "won."' },
    avatar_color: '#8B5CF6',
  },
  {
    id: 'diplomatic-moderate',
    name: 'The Diplomatic Moderate',
    tagline: 'The best solutions borrow from both sides.',
    background: 'A career diplomat and mediator. Believes most debates present false dichotomies and that workable solutions usually incorporate insights from multiple perspectives.',
    expertise: ['diplomacy', 'negotiation', 'conflict resolution', 'comparative policy'],
    rhetorical_style: 'Measured and inclusive. Acknowledges valid points on all sides before building a synthesis.',
    ideological_leanings: 'Centrist — seeks common ground and pragmatic compromise.',
    argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'moderate', concession_willingness: 'high', humor: 'Gentle and disarming.' },
    debate_behavior: { opening_strategy: 'Acknowledge the legitimate concerns on both sides. Position your argument as the reasonable middle path.', rebuttal_strategy: 'Agree with the valid parts of your opponent\'s argument, then show where it goes too far or not far enough.', closing_strategy: 'Present a synthesis that incorporates the strongest elements from both sides.' },
    avatar_color: '#10B981',
  },
  {
    id: 'historical-scholar',
    name: 'The Historical Scholar',
    tagline: 'Those who forget history are doomed to lose debates about it.',
    background: 'A historian with deep knowledge across eras and civilizations. Grounds every argument in historical precedent, drawing parallels between current issues and past events.',
    expertise: ['world history', 'political history', 'comparative civilizations', 'historiography'],
    rhetorical_style: 'Erudite and narrative-driven. Weaves historical examples into every argument.',
    ideological_leanings: 'Traditionalist-leaning but data-driven — respects what has worked historically.',
    argumentation_preferences: { evidence_weight: 'heavy', emotional_appeals: 'moderate', concession_willingness: 'moderate', humor: 'Wry references to historical irony.' },
    debate_behavior: { opening_strategy: 'Draw a compelling historical parallel to frame the current debate. Show that this is not a new question.', rebuttal_strategy: 'Present historical counter-examples. Show where similar arguments led to unexpected outcomes in the past.', closing_strategy: 'Synthesize the historical lessons into a clear takeaway for the present debate.' },
    avatar_color: '#F59E0B',
  },
  {
    id: 'tech-futurist',
    name: 'The Tech Futurist',
    tagline: 'The future is already here, it\'s just not evenly distributed.',
    background: 'A technologist and futurist who has worked in AI research, biotech, and venture capital. Analyzes every issue through the lens of technological change and innovation.',
    expertise: ['artificial intelligence', 'biotechnology', 'economics of innovation', 'futurism'],
    rhetorical_style: 'Forward-looking and optimistic. Uses trend analysis, thought experiments, and scenario planning.',
    ideological_leanings: 'Techno-optimist — believes innovation can solve most problems with the right incentives.',
    argumentation_preferences: { evidence_weight: 'moderate', emotional_appeals: 'minimal', concession_willingness: 'moderate', humor: 'Nerdy references and thought experiments.' },
    debate_behavior: { opening_strategy: 'Project current trends forward and show how the landscape is shifting. Frame the debate in terms of where we\'re heading, not where we\'ve been.', rebuttal_strategy: 'Show how opponent\'s arguments are based on outdated assumptions. Present emerging data and technology that changes the calculus.', closing_strategy: 'Paint a concrete picture of the near-future scenario your position enables versus the alternative.' },
    avatar_color: '#06B6D4',
  },
  {
    id: 'legal-scholar',
    name: 'The Legal Scholar',
    tagline: 'The law is reason, free from passion.',
    background: 'A constitutional law professor and former appellate judge with expertise in comparative legal systems. Analyzes every issue through legal frameworks, precedent, and rights-based reasoning.',
    expertise: ['constitutional law', 'international law', 'human rights', 'legal philosophy'],
    rhetorical_style: 'Precise and authoritative. Builds arguments through case analysis, statutory interpretation, and constitutional principles.',
    ideological_leanings: 'Rule-of-law centrist — believes in institutional frameworks and due process.',
    argumentation_preferences: { evidence_weight: 'heavy', emotional_appeals: 'minimal', concession_willingness: 'moderate', humor: 'Dry legal wit and Latin maxims.' },
    debate_behavior: { opening_strategy: 'Establish the legal framework for analyzing the issue. Cite relevant precedent and constitutional principles.', rebuttal_strategy: 'Distinguish opponent\'s cited cases on the facts. Show where their legal reasoning breaks down or leads to unintended consequences.', closing_strategy: 'Synthesize the legal arguments into a clear holding. Show how the weight of precedent and principle supports your position.' },
    avatar_color: '#7C3AED',
  },
  {
    id: 'economic-realist',
    name: 'The Economic Realist',
    tagline: 'Follow the incentives, find the truth.',
    background: 'A behavioral economist who has advised central banks and international development organizations. Approaches every debate through the lens of incentives, trade-offs, and empirical economic data.',
    expertise: ['behavioral economics', 'public policy', 'game theory', 'development economics'],
    rhetorical_style: 'Data-heavy and pragmatic. Uses cost-benefit analyses, natural experiments, and cross-country comparisons.',
    ideological_leanings: 'Evidence-based pragmatist — skeptical of both market fundamentalism and central planning.',
    argumentation_preferences: { evidence_weight: 'heavy', emotional_appeals: 'minimal', concession_willingness: 'high', humor: 'Wry observations about perverse incentives.' },
    debate_behavior: { opening_strategy: 'Frame the debate in terms of costs, benefits, and trade-offs. Present the strongest empirical evidence for your position.', rebuttal_strategy: 'Challenge the economic assumptions behind opponent\'s arguments. Show unintended consequences and perverse incentives.', closing_strategy: 'Synthesize the empirical evidence and show which position has the better cost-benefit ratio.' },
    avatar_color: '#059669',
  },
];

function loadStoredPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Persona[];
      // Merge built-ins that aren't already stored
      const storedIds = new Set(stored.map((p) => p.id));
      const missing = BUILT_IN_PERSONAS.filter((p) => !storedIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...missing, ...stored];
        persistPersonas(merged);
        return merged;
      }
      return stored;
    }
  } catch {
    // corrupted data – start fresh
  }
  // First run: seed with built-in personas
  persistPersonas(BUILT_IN_PERSONAS);
  return [...BUILT_IN_PERSONAS];
}

function persistPersonas(personas: Persona[]): void {
  try {
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
  } catch {
    // storage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Settings persistence helpers (localStorage)
// ---------------------------------------------------------------------------
const SETTINGS_KEY = 'debateforge-settings';

function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // corrupted data
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// User profile persistence helpers (localStorage)
// ---------------------------------------------------------------------------
const PROFILE_KEY = 'debateforge-profile';

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Debater',
  username: 'debater',
  bio: '',
  avatarColor: '#4c6ef5',
  createdAt: new Date().toISOString(),
};

function loadStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    // corrupted data
  }
  return { ...DEFAULT_PROFILE, createdAt: new Date().toISOString() };
}

function persistProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Debates persistence helpers (localStorage)
// ---------------------------------------------------------------------------
const DEBATES_KEY = 'debateforge-debates';

function loadStoredDebates(): Debate[] {
  try {
    const raw = localStorage.getItem(DEBATES_KEY);
    if (raw) return JSON.parse(raw) as Debate[];
  } catch {
    // corrupted data
  }
  return [];
}

function persistDebates(debates: Debate[]): void {
  try {
    localStorage.setItem(DEBATES_KEY, JSON.stringify(debates));
  } catch {
    // storage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Create the store
// ---------------------------------------------------------------------------
const initialTheme = getStoredTheme();
const initialSettings = loadStoredSettings();

export const useStore = create<DebateForgeState>((set, get) => {
  // Apply the initial theme immediately so there is no flash
  if (typeof document !== 'undefined') {
    applyThemeClass(initialTheme);
  }

  return {
    // ── App state ──────────────────────────────────────────────────────────
    theme: initialTheme,
    sidebarOpen: true,
    currentView: (() => {
      try {
        return localStorage.getItem('debateforge-has-visited') ? 'home' : 'landing';
      } catch { return 'home'; }
    })() as AppView,

    // ── API keys ───────────────────────────────────────────────────────────
    apiKeys: {},

    setApiKey: (provider, key) => {
      set((state) => ({
        apiKeys: { ...state.apiKeys, [provider]: key },
      }));
    },

    loadApiKeys: async () => {
      try {
        if (window.electronAPI) {
          const keys = await window.electronAPI.getApiKeys();
          set({ apiKeys: keys as unknown as ApiKeys });
        } else {
          // Fallback: load from localStorage when running outside Electron
          const raw = localStorage.getItem('debateforge-api-keys');
          if (raw) set({ apiKeys: JSON.parse(raw) as ApiKeys });
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
      }
    },

    saveApiKeys: async () => {
      const { apiKeys } = get();
      try {
        if (window.electronAPI) {
          await window.electronAPI.saveApiKeys(apiKeys as unknown as Record<string, string>);
        } else {
          localStorage.setItem('debateforge-api-keys', JSON.stringify(apiKeys));
        }
      } catch (err) {
        console.error('Failed to save API keys:', err);
      }
    },

    // ── Settings ───────────────────────────────────────────────────────────
    settings: initialSettings,

    updateSettings: (partial) => {
      set((state) => {
        const updated = { ...state.settings, ...partial };
        persistSettings(updated);
        // If theme changed through settings, sync it
        if (partial.theme && partial.theme !== state.theme) {
          applyThemeClass(partial.theme);
          try {
            localStorage.setItem('debateforge-theme', partial.theme);
          } catch { /* ignore */ }
        }
        return { settings: updated, ...(partial.theme ? { theme: partial.theme } : {}) };
      });
    },

    // ── Debate state ───────────────────────────────────────────────────────
    currentDebate: null,
    debates: loadStoredDebates(),
    isDebating: false,
    streamingContent: '',
    streamingThinking: '',

    setCurrentDebate: (debate) => {
      set((state) => {
        // If storing a completed/new debate, also persist in history
        if (debate) {
          const exists = state.debates.some((d) => d.id === debate.id);
          const updatedDebates = exists
            ? state.debates.map((d) => (d.id === debate.id ? debate : d))
            : [debate, ...state.debates];
          if (state.settings.autoSaveDebates) persistDebates(updatedDebates);
          return { currentDebate: debate, debates: updatedDebates, isDebating: debate.status === 'in-progress' };
        }
        return { currentDebate: null, isDebating: false };
      });
    },

    addTurn: (turn) => {
      set((state) => {
        if (!state.currentDebate) return state;
        const updatedDebate: Debate = {
          ...state.currentDebate,
          turns: [...state.currentDebate.turns, turn],
          updatedAt: new Date().toISOString(),
        };
        const updatedDebates = state.debates.map((d) =>
          d.id === updatedDebate.id ? updatedDebate : d,
        );
        if (state.settings.autoSaveDebates) persistDebates(updatedDebates);
        return { currentDebate: updatedDebate, debates: updatedDebates };
      });
    },

    updateTurn: (turnId, updates) => {
      set((state) => {
        if (!state.currentDebate) return state;
        const updatedTurns = state.currentDebate.turns.map((t) =>
          t.id === turnId ? { ...t, ...updates } : t,
        );
        const updatedDebate: Debate = {
          ...state.currentDebate,
          turns: updatedTurns,
          updatedAt: new Date().toISOString(),
        };
        const updatedDebates = state.debates.map((d) =>
          d.id === updatedDebate.id ? updatedDebate : d,
        );
        if (state.settings.autoSaveDebates) persistDebates(updatedDebates);
        return { currentDebate: updatedDebate, debates: updatedDebates };
      });
    },

    deleteDebate: (id) => {
      set((state) => {
        const updatedDebates = state.debates.filter((d) => d.id !== id);
        persistDebates(updatedDebates);
        return {
          debates: updatedDebates,
          currentDebate: state.currentDebate?.id === id ? null : state.currentDebate,
          isDebating: state.currentDebate?.id === id ? false : state.isDebating,
        };
      });
    },

    setStreamingContent: (content) => set({ streamingContent: content }),
    setStreamingThinking: (content) => set({ streamingThinking: content }),
    clearStreamingContent: () => set({ streamingContent: '', streamingThinking: '' }),

    // ── Setup state ────────────────────────────────────────────────────────
    setupTopic: '',
    setupDebaters: [makeDefaultDebater('proposition', 0), makeDefaultDebater('opposition', 1), makeDefaultHousemaster()],

    setSetupTopic: (topic) => set({ setupTopic: topic }),

    addSetupDebater: (debater) => {
      set((state) => ({ setupDebaters: [...state.setupDebaters, debater] }));
    },

    removeSetupDebater: (id) => {
      set((state) => ({
        setupDebaters: state.setupDebaters.filter((d) => d.id !== id),
      }));
    },

    updateSetupDebater: (id, updates) => {
      set((state) => ({
        setupDebaters: state.setupDebaters.map((d) =>
          d.id === id ? { ...d, ...updates } : d,
        ),
      }));
    },

    resetSetup: () => {
      set({
        setupTopic: '',
        setupDebaters: [makeDefaultDebater('proposition', 0), makeDefaultDebater('opposition', 1), makeDefaultHousemaster()],
      });
    },

    // ── Persona state ──────────────────────────────────────────────────────
    personas: loadStoredPersonas(),
    selectedPersona: null,

    loadPersonas: () => {
      set({ personas: loadStoredPersonas() });
    },

    addPersona: (persona) => {
      set((state) => {
        const updated = [...state.personas, persona];
        persistPersonas(updated);
        return { personas: updated };
      });
    },

    updatePersona: (id, updates) => {
      set((state) => {
        const updated = state.personas.map((p) =>
          p.id === id ? { ...p, ...updates } : p,
        );
        persistPersonas(updated);
        return { personas: updated };
      });
    },

    deletePersona: (id) => {
      set((state) => {
        const updated = state.personas.filter((p) => p.id !== id);
        persistPersonas(updated);
        return {
          personas: updated,
          selectedPersona: state.selectedPersona?.id === id ? null : state.selectedPersona,
        };
      });
    },

    selectPersona: (persona) => set({ selectedPersona: persona }),

    // ── Evidence state ─────────────────────────────────────────────────────
    evidenceUrl: null,
    evidenceHighlight: null,
    showEvidencePanel: false,

    setEvidence: (url, highlight) => {
      set({ evidenceUrl: url, evidenceHighlight: highlight, showEvidencePanel: true });
    },

    clearEvidence: () => {
      set({ evidenceUrl: null, evidenceHighlight: null });
    },

    toggleEvidencePanel: () => {
      set((state) => ({ showEvidencePanel: !state.showEvidencePanel }));
    },

    // ── ELO / Leaderboard state ──────────────────────────────────────────
    modelRatings: loadModelRatings(),
    headToHeadRecords: loadHeadToHead(),

    recordDebateResult: (winnerId, loserId, isDraw, winnerModel, loserModel) => {
      set((state) => {
        const ratings = { ...state.modelRatings };
        const h2h = { ...state.headToHeadRecords };
        const now = new Date().toISOString();

        // Ensure both models have a rating record
        if (!ratings[winnerId]) {
          ratings[winnerId] = {
            modelId: winnerId,
            modelName: winnerModel.name,
            displayName: winnerModel.displayName,
            provider: winnerModel.provider,
            elo: getDefaultRating(),
            wins: 0,
            losses: 0,
            draws: 0,
            lastPlayed: now,
          };
        }
        if (!ratings[loserId]) {
          ratings[loserId] = {
            modelId: loserId,
            modelName: loserModel.name,
            displayName: loserModel.displayName,
            provider: loserModel.provider,
            elo: getDefaultRating(),
            wins: 0,
            losses: 0,
            draws: 0,
            lastPlayed: now,
          };
        }

        // Calculate new ELO ratings
        const { newWinner, newLoser } = calculateNewRatings(
          ratings[winnerId].elo,
          ratings[loserId].elo,
          isDraw,
        );

        // Update ratings
        ratings[winnerId] = {
          ...ratings[winnerId],
          elo: newWinner,
          wins: isDraw ? ratings[winnerId].wins : ratings[winnerId].wins + 1,
          draws: isDraw ? ratings[winnerId].draws + 1 : ratings[winnerId].draws,
          lastPlayed: now,
          displayName: winnerModel.displayName,
          provider: winnerModel.provider,
        };

        ratings[loserId] = {
          ...ratings[loserId],
          elo: newLoser,
          losses: isDraw ? ratings[loserId].losses : ratings[loserId].losses + 1,
          draws: isDraw ? ratings[loserId].draws + 1 : ratings[loserId].draws,
          lastPlayed: now,
          displayName: loserModel.displayName,
          provider: loserModel.provider,
        };

        // Update head-to-head record
        const key = h2hKey(winnerId, loserId);
        const existing = h2h[key];
        const sorted = [winnerId, loserId].sort();
        const isAWinner = sorted[0] === winnerId;

        if (existing) {
          h2h[key] = {
            ...existing,
            aWins: isDraw ? existing.aWins : isAWinner ? existing.aWins + 1 : existing.aWins,
            bWins: isDraw ? existing.bWins : !isAWinner ? existing.bWins + 1 : existing.bWins,
            draws: isDraw ? existing.draws + 1 : existing.draws,
            totalMatches: existing.totalMatches + 1,
            lastPlayed: now,
          };
        } else {
          h2h[key] = {
            modelA: sorted[0],
            modelB: sorted[1],
            aWins: isDraw ? 0 : isAWinner ? 1 : 0,
            bWins: isDraw ? 0 : !isAWinner ? 1 : 0,
            draws: isDraw ? 1 : 0,
            totalMatches: 1,
            lastPlayed: now,
          };
        }

        // Persist
        persistModelRatings(ratings);
        persistHeadToHead(h2h);

        return { modelRatings: ratings, headToHeadRecords: h2h };
      });
    },

    getLeaderboard: () => {
      const { modelRatings } = get();
      const entries = Object.values(modelRatings)
        .map((r) => {
          const totalDebates = r.wins + r.losses + r.draws;
          const winRate = totalDebates > 0 ? (r.wins / totalDebates) * 100 : 0;
          return { ...r, totalDebates, winRate, rank: 0 };
        })
        .sort((a, b) => b.elo - a.elo);

      // Assign ranks (1-indexed)
      entries.forEach((entry, i) => {
        entry.rank = i + 1;
      });

      return entries;
    },

    getHeadToHead: (modelA, modelB) => {
      const { headToHeadRecords } = get();
      const key = h2hKey(modelA, modelB);
      return headToHeadRecords[key] ?? null;
    },

    resetLeaderboard: () => {
      persistModelRatings({});
      persistHeadToHead({});
      set({ modelRatings: {}, headToHeadRecords: {} });
    },

    // ── User profile ──────────────────────────────────────────────────────
    userProfile: loadStoredProfile(),

    updateUserProfile: (partial) => {
      set((state) => {
        const updated = { ...state.userProfile, ...partial };
        persistProfile(updated);
        return { userProfile: updated };
      });
    },

    // ── UI actions ─────────────────────────────────────────────────────────
    setTheme: (mode) => {
      applyThemeClass(mode);
      try {
        localStorage.setItem('debateforge-theme', mode);
      } catch { /* ignore */ }
      set((state) => ({
        theme: mode,
        settings: { ...state.settings, theme: mode },
      }));
      persistSettings({ ...get().settings, theme: mode });
    },

    toggleSidebar: () => {
      set((state) => ({ sidebarOpen: !state.sidebarOpen }));
    },

    setCurrentView: (view) => set({ currentView: view }),

    navigateTo: (view) => {
      set({ currentView: view });
    },
  };
});

// ---------------------------------------------------------------------------
// Theme initializer: listen for system preference changes when mode is "system"
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    const { theme } = useStore.getState();
    if (theme === 'system') {
      applyThemeClass('system');
    }
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  }
}
