/**
 * A single message within a conversation session.
 */
export interface ConversationMessage {
  readonly messageId: string;
  readonly sessionId: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly createdAt: Date;
}
