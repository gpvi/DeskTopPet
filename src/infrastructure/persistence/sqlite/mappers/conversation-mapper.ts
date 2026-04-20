import type { ConversationSession } from '../../../../domain/entities/conversation-session';
import type { ConversationMessage } from '../../../../domain/entities/conversation-message';

/** Row shape returned from the conversation_sessions table. */
export interface SessionRow {
  session_id: string;
  user_id: string;
  current_intent: string | null;
  context_summary: string | null;
  started_at: string;
  last_active_at: string;
}

/** Row shape returned from the conversation_messages table. */
export interface MessageRow {
  message_id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

/** Parameter shape for persisting a session. */
export interface SessionRowParams {
  $sessionId: string;
  $userId: string;
  $currentIntent: string | null;
  $contextSummary: string | null;
  $startedAt: string;
  $lastActiveAt: string;
}

/**
 * Map a database row to a ConversationSession entity.
 * Messages are not loaded here — they are fetched separately.
 */
export function mapRowToSession(
  row: SessionRow,
  messages: ConversationMessage[] = [],
): ConversationSession {
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    currentIntent: row.current_intent,
    messages,
    startedAt: new Date(row.started_at),
    lastActiveAt: new Date(row.last_active_at),
  };
}

/** Map a database row to a ConversationMessage entity. */
export function mapRowToMessage(row: MessageRow): ConversationMessage {
  return {
    messageId: row.message_id,
    sessionId: row.session_id,
    role: row.role as ConversationMessage['role'],
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

/** Map a ConversationSession entity to database row parameters. */
export function mapSessionToRow(session: ConversationSession): SessionRowParams {
  return {
    $sessionId: session.sessionId,
    $userId: session.userId,
    $currentIntent: session.currentIntent,
    $contextSummary: null,
    $startedAt: session.startedAt.toISOString(),
    $lastActiveAt: session.lastActiveAt.toISOString(),
  };
}
