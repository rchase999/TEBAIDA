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
    -- ──────────────────────────────────────────────
    -- Core debate tables
    -- ──────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS debates (
      id            TEXT PRIMARY KEY,
      topic         TEXT NOT NULL,
      format        TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      tags          TEXT NOT NULL DEFAULT '[]',
      is_favorite   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at    TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS debate_turns (
      id            TEXT PRIMARY KEY,
      debate_id     TEXT NOT NULL,
      debater_name  TEXT NOT NULL,
      model         TEXT NOT NULL,
      persona       TEXT NOT NULL DEFAULT '',
      content       TEXT NOT NULL DEFAULT '',
      citations     TEXT NOT NULL DEFAULT '[]',
      fallacies     TEXT NOT NULL DEFAULT '[]',
      word_count    INTEGER NOT NULL DEFAULT 0,
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

    -- ──────────────────────────────────────────────
    -- Tags / categories
    -- ──────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS tags (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL UNIQUE,
      color         TEXT NOT NULL DEFAULT '#5c7cfa',
      usage_count   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ──────────────────────────────────────────────
    -- User notes on debates
    -- ──────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS debate_notes (
      id            TEXT PRIMARY KEY,
      debate_id     TEXT NOT NULL,
      content       TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
    );

    -- ──────────────────────────────────────────────
    -- Activity / audit log
    -- ──────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS activity_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      action        TEXT NOT NULL,
      entity_type   TEXT NOT NULL,
      entity_id     TEXT,
      details       TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ──────────────────────────────────────────────
    -- Indexes for performance
    -- ──────────────────────────────────────────────

    CREATE INDEX IF NOT EXISTS idx_debate_turns_debate_id
      ON debate_turns(debate_id);

    CREATE INDEX IF NOT EXISTS idx_debate_scores_debate_id
      ON debate_scores(debate_id);

    CREATE INDEX IF NOT EXISTS idx_debates_status
      ON debates(status);

    CREATE INDEX IF NOT EXISTS idx_debates_created_at
      ON debates(created_at);

    CREATE INDEX IF NOT EXISTS idx_debates_deleted_at
      ON debates(deleted_at);

    CREATE INDEX IF NOT EXISTS idx_debate_notes_debate_id
      ON debate_notes(debate_id);

    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
      ON activity_log(created_at);

    CREATE INDEX IF NOT EXISTS idx_activity_log_entity
      ON activity_log(entity_type, entity_id);

    CREATE INDEX IF NOT EXISTS idx_tags_name
      ON tags(name);
  `);
}

/**
 * Log an activity event to the audit trail.
 */
export function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  details?: string,
): void {
  const database = getDb();
  database
    .prepare(
      'INSERT INTO activity_log (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
    )
    .run(action, entityType, entityId ?? null, details ?? '');
}

/**
 * Health check — returns basic database stats.
 */
export function getDbHealth(): {
  status: string;
  debates: number;
  turns: number;
  size: string;
} {
  const database = getDb();
  const debates = (database.prepare('SELECT COUNT(*) as c FROM debates WHERE deleted_at IS NULL').get() as { c: number }).c;
  const turns = (database.prepare('SELECT COUNT(*) as c FROM debate_turns').get() as { c: number }).c;
  const pageCount = (database.pragma('page_count') as { page_count: number }[])[0]?.page_count ?? 0;
  const pageSize = (database.pragma('page_size') as { page_size: number }[])[0]?.page_size ?? 4096;
  const sizeBytes = pageCount * pageSize;
  const size = sizeBytes < 1024 * 1024
    ? `${(sizeBytes / 1024).toFixed(1)} KB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  return { status: 'healthy', debates, turns, size };
}
