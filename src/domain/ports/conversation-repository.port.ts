import type {
  ConversationSession,
  ConversationMessage,
} from '../entities';

/**
 * Port: persistence operations for conversation data.
 */
export interface ConversationRepository {
  saveSession(session: ConversationSession): Promise<void>;
  findSessionById(sessionId: string): Promise<ConversationSession | null>;
  saveMessage(message: ConversationMessage): Promise<void>;
  findMessagesBySession(sessionId: string): Promise<ConversationMessage[]>;
}
