/**
 * Migration 003: Create todos table.
 *
 * Uses TEXT for ISO timestamps and UUID identifiers.
 * Status is constrained to valid TodoItem states.
 */
export const MIGRATION_003_TODOS = `
  CREATE TABLE IF NOT EXISTS todos (
    todo_id       TEXT PRIMARY KEY,
    user_id       TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    description   TEXT    NOT NULL DEFAULT '',
    status        TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    priority      TEXT    NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high')),
    due_at        TEXT,
    created_at    TEXT    NOT NULL,
    completed_at  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_todos_user_id
    ON todos(user_id);
`;
