/**
 * Request payload for classifying the user's conversational intent.
 */
export interface IntentClassificationRequest {
  readonly message: string;
  readonly sessionId: string;
}

/**
 * Response payload containing the classified intent and confidence score.
 */
export interface IntentClassificationResponse {
  readonly intent: 'chat' | 'task' | 'question';
  readonly confidence: number;
  readonly parameters?: Record<string, unknown>;
}
