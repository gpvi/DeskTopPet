/**
 * Represents a task that the agent needs to execute on behalf of the user.
 */
export interface AgentTask {
  readonly taskId: string;
  readonly userId: string;
  readonly taskType: string;
  readonly intent: string;
  readonly parameters: Record<string, unknown>;
  readonly status: 'pending' | 'executing' | 'completed' | 'failed';
  readonly requiresConfirmation: boolean;
}
