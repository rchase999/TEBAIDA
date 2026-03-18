// ---------------------------------------------------------------------------
// ELO Rating Engine
// ---------------------------------------------------------------------------
// Standard ELO algorithm with K-factor 32, tailored for AI debate matchups.
// ---------------------------------------------------------------------------

/** Result of an ELO calculation */
export interface EloResult {
  newWinner: number;
  newLoser: number;
}

/** Comprehensive stats for a single model */
export interface ModelStats {
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  totalDebates: number;
  winRate: number;
}

/** A single head-to-head record between two models */
export interface HeadToHeadRecord {
  modelA: string;
  modelB: string;
  aWins: number;
  bWins: number;
  draws: number;
  totalMatches: number;
  lastPlayed: string;
}

/** Persistent model rating stored in localStorage */
export interface ModelRating {
  modelId: string;
  modelName: string;
  displayName: string;
  provider: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  lastPlayed: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const K_FACTOR = 32;
const DEFAULT_RATING = 1500;

// ---------------------------------------------------------------------------
// Core ELO functions
// ---------------------------------------------------------------------------

/**
 * Returns the default starting ELO rating.
 */
export function getDefaultRating(): number {
  return DEFAULT_RATING;
}

/**
 * Compute the expected score for player A given both ratings.
 * Uses the standard logistic formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match.
 *
 * @param winnerElo - Current ELO of the winner (or player A in a draw)
 * @param loserElo  - Current ELO of the loser  (or player B in a draw)
 * @param isDraw    - Whether the match ended in a draw
 * @returns Object with newWinner and newLoser ratings (rounded to nearest integer)
 */
export function calculateNewRatings(
  winnerElo: number,
  loserElo: number,
  isDraw: boolean = false,
): EloResult {
  const expectedWinner = expectedScore(winnerElo, loserElo);
  const expectedLoser = expectedScore(loserElo, winnerElo);

  if (isDraw) {
    // Draw: both players score 0.5
    const newWinner = Math.round(winnerElo + K_FACTOR * (0.5 - expectedWinner));
    const newLoser = Math.round(loserElo + K_FACTOR * (0.5 - expectedLoser));
    return { newWinner, newLoser };
  }

  // Decisive result: winner scores 1, loser scores 0
  const newWinner = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const newLoser = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));
  return { newWinner, newLoser };
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
const ELO_STORAGE_KEY = 'debateforge-elo';
const H2H_STORAGE_KEY = 'debateforge-h2h';

/**
 * Load all model ratings from localStorage.
 */
export function loadModelRatings(): Record<string, ModelRating> {
  try {
    const raw = localStorage.getItem(ELO_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, ModelRating>;
  } catch {
    // corrupted data — start fresh
  }
  return {};
}

/**
 * Persist model ratings to localStorage.
 */
export function persistModelRatings(ratings: Record<string, ModelRating>): void {
  try {
    localStorage.setItem(ELO_STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    // storage full or unavailable
  }
}

/**
 * Load all head-to-head records from localStorage.
 * Keys are sorted pairs: "modelA::modelB" where modelA < modelB lexically.
 */
export function loadHeadToHead(): Record<string, HeadToHeadRecord> {
  try {
    const raw = localStorage.getItem(H2H_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, HeadToHeadRecord>;
  } catch {
    // corrupted data
  }
  return {};
}

/**
 * Persist head-to-head records to localStorage.
 */
export function persistHeadToHead(records: Record<string, HeadToHeadRecord>): void {
  try {
    localStorage.setItem(H2H_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // storage full or unavailable
  }
}

/**
 * Build a canonical key for a pair of models (order-independent).
 */
export function h2hKey(modelA: string, modelB: string): string {
  return [modelA, modelB].sort().join('::');
}

/**
 * Compute stats for a single model from its rating record.
 */
export function getModelStats(modelId: string): ModelStats {
  const ratings = loadModelRatings();
  const rating = ratings[modelId];

  if (!rating) {
    return {
      elo: DEFAULT_RATING,
      wins: 0,
      losses: 0,
      draws: 0,
      totalDebates: 0,
      winRate: 0,
    };
  }

  const totalDebates = rating.wins + rating.losses + rating.draws;
  const winRate = totalDebates > 0 ? (rating.wins / totalDebates) * 100 : 0;

  return {
    elo: rating.elo,
    wins: rating.wins,
    losses: rating.losses,
    draws: rating.draws,
    totalDebates,
    winRate,
  };
}

/**
 * Get the head-to-head record between two models.
 */
export function getHeadToHead(modelA: string, modelB: string): HeadToHeadRecord | null {
  const records = loadHeadToHead();
  const key = h2hKey(modelA, modelB);
  return records[key] ?? null;
}
