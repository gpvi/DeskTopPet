/**
 * Request payload sent to the LLM for chat completion.
 */
export interface ChatCompletionRequest {
  readonly messages: ReadonlyArray<{
    readonly role: 'user' | 'assistant' | 'system';
    readonly content: string;
  }>;
  readonly model: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly feature?: string;
  readonly sessionId?: string;
  readonly taskId?: string;
}

/**
 * Response payload returned from the LLM after chat completion.
 */
export interface ChatCompletionResponse {
  readonly content: string;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}
