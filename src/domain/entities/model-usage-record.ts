/**
 * Tracks token usage for a single LLM invocation.
 */
export interface ModelUsageRecord {
  readonly usageId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly provider: string;
  readonly model: string;
  readonly feature: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly createdAt: Date;
}
