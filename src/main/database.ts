import Database, { Database as DatabaseType } from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

let db: DatabaseType | null = null;

/**
 * Initialise the SQLite database.
 * Creates the file inside the app's userData directory and ensures
 * all required tables exist (idempotent — safe to call on every launch).
 */
export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'debateforge.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);
}

/**
 * Return the active database instance.
 * Throws if called before `initDatabase`.
 */
export function getDb(): DatabaseType {
  if (!db) {
    throw new Error(
      'Database has not been initialised. Call initDatabase() before accessing the database.',
    );
  }
  return db;
}

// ──────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────

function createTables(database: DatabaseType): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS debates (
      id            TEXT PRIMARY KEY,
      topic         TEXT NOT NULL,
      format        TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debate_turns (
      id            TEXT PRIMARY KEY,
      debate_id     TEXT NOT NULL,
      debater_name  TEXT NOT NULL,
      model         TEXT NOT NULL,
      persona       TEXT NOT NULL DEFAULT '',
      content       TEXT NOT NULL DEFAULT '',
      citations     TEXT NOT NULL DEFAULT '[]',
      round         INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debate_scores (
      id            TEXT PRIMARY KEY,
      debate_id     TEXT NOT NULL,
      debater_name  TEXT NOT NULL,
      category      TEXT NOT NULL,
      score         REAL NOT NULL DEFAULT 0,
      notes         TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
    );

    -- Speed up lookups by debate
    CREATE INDEX IF NOT EXISTS idx_debate_turns_debate_id
      ON debate_turns(debate_id);

    CREATE INDEX IF NOT EXISTS idx_debate_scores_debate_id
      ON debate_scores(debate_id);
  `);
}
