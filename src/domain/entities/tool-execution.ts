import type { ExecutionResult } from '../../shared/types';

/**
 * Records the result of executing a tool or system operation.
 */
export interface ToolExecution {
  readonly executionId: string;
  readonly taskId: string;
  readonly toolName: string;
  readonly input: Record<string, unknown>;
  readonly output: ExecutionResult;
  readonly status: 'success' | 'failure' | 'timeout';
}
