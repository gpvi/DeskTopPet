import type { ConversationMessage } from './conversation-message';

/**
 * Represents an ongoing or completed conversation between the user and the pet.
 */
export interface ConversationSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly messages: ReadonlyArray<ConversationMessage>;
  readonly currentIntent: string | null;
  readonly startedAt: Date;
  readonly lastActiveAt: Date;
}
