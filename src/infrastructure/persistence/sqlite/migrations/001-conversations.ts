/**
 * Migration 001: Create conversation_sessions and conversation_messages tables.
 *
 * Uses TEXT for ISO timestamps and UUID identifiers.
 */
export const MIGRATION_001_CONVERSATIONS = `
  CREATE TABLE IF NOT EXISTS conversation_sessions (
    session_id        TEXT PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    current_intent    TEXT,
    context_summary   TEXT,
    started_at        TEXT    NOT NULL,
    last_active_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversation_messages (
    message_id    TEXT PRIMARY KEY,
    session_id    TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content       TEXT    NOT NULL,
    created_at    TEXT    NOT NULL,
    FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session_id
    ON conversation_messages(session_id);
`;
