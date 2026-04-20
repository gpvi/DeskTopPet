/**
 * Migration 005: Create memories table.
 *
 * Stores explicitly-saved pieces of information about the user.
 * Uses TEXT for ISO timestamps and UUID identifiers.
 */
export const MIGRATION_005_MEMORIES = `
  CREATE TABLE IF NOT EXISTS memories (
    memory_id    TEXT PRIMARY KEY,
    user_id      TEXT    NOT NULL,
    category     TEXT    NOT NULL DEFAULT '',
    content      TEXT    NOT NULL,
    source       TEXT    NOT NULL DEFAULT '',
    confidence   REAL    NOT NULL DEFAULT 1.0,
    created_at   TEXT    NOT NULL,
    is_deleted   INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_memories_user_id
    ON memories(user_id);

  CREATE INDEX IF NOT EXISTS idx_memories_category
    ON memories(category);
`;
