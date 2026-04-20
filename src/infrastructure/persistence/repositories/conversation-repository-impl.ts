import type { Database as SqlJsDatabase } from 'sql.js';
import type { ConversationRepository } from '../../../domain/ports/conversation-repository.port';
import type { ConversationSession } from '../../../domain/entities/conversation-session';
import type { ConversationMessage } from '../../../domain/entities/conversation-message';
import { RepositoryError } from '../../../shared/errors/repository-error';
import {
  mapRowToSession,
  mapRowToMessage,
  mapSessionToRow,
  type SessionRow,
  type MessageRow,
} from '../sqlite/mappers/conversation-mapper';

/**
 * SQLite-backed implementation of ConversationRepository.
 *
 * Uses sql.js (WASM) for zero-native-build compatibility.
 * All operations are synchronous internally but exposed as async
 * to satisfy the port interface and allow future backend swaps.
 */
export class ConversationRepositoryImpl implements ConversationRepository {
  constructor(private readonly database: SqlJsDatabase) {}

  async saveSession(session: ConversationSession): Promise<void> {
    try {
      this.executeSaveSession(session);
    } catch (error) {
      throw wrapRepositoryError(error, 'saveSession');
    }
  }

  async findSessionById(sessionId: string): Promise<ConversationSession | null> {
    try {
      return this.executeFindSessionById(sessionId);
    } catch (error) {
      throw wrapRepositoryError(error, 'findSessionById');
    }
  }

  async saveMessage(message: ConversationMessage): Promise<void> {
    try {
      this.executeSaveMessage(message);
    } catch (error) {
      throw wrapRepositoryError(error, 'saveMessage');
    }
  }

  async findMessagesBySession(sessionId: string): Promise<ConversationMessage[]> {
    try {
      return this.executeFindMessagesBySession(sessionId);
    } catch (error) {
      throw wrapRepositoryError(error, 'findMessagesBySession');
    }
  }

  private executeSaveSession(session: ConversationSession): void {
    const params = mapSessionToRow(session);
    this.database.run(
      `INSERT OR REPLACE INTO conversation_sessions
         (session_id, user_id, current_intent, context_summary, started_at, last_active_at)
       VALUES ($sessionId, $userId, $currentIntent, $contextSummary, $startedAt, $lastActiveAt)`,
      [params.$sessionId, params.$userId, params.$currentIntent, params.$contextSummary, params.$startedAt, params.$lastActiveAt],
    );
  }

  private executeFindSessionById(sessionId: string): ConversationSession | null {
    const statement = this.database.prepare(
      'SELECT session_id, user_id, current_intent, context_summary, started_at, last_active_at FROM conversation_sessions WHERE session_id = ?',
    );
    statement.bind([sessionId]);

    if (!statement.step()) {
      statement.free();
      return null;
    }

    const row = statement.getAsObject() as unknown as SessionRow;
    statement.free();

    const messages = this.selectMessagesBySession(sessionId);
    return mapRowToSession(row, messages);
  }

  private executeSaveMessage(message: ConversationMessage): void {
    this.database.run(
      `INSERT INTO conversation_messages (message_id, session_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [message.messageId, message.sessionId, message.role, message.content, message.createdAt.toISOString()],
    );
  }

  private executeFindMessagesBySession(sessionId: string): ConversationMessage[] {
    const rows = this.selectMessagesBySession(sessionId);
    return rows.map(mapRowToMessage);
  }

  private selectMessagesBySession(sessionId: string): MessageRow[] {
    const statement = this.database.prepare(
      'SELECT message_id, session_id, role, content, created_at FROM conversation_messages WHERE session_id = ? ORDER BY created_at ASC',
    );
    statement.bind([sessionId]);

    const rows: MessageRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject() as unknown as MessageRow);
    }
    statement.free();
    return rows;
  }
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(
    `Failed to ${operation}: ${message}`,
    operation,
  );
}
