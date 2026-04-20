/**
 * Standard result wrapper for tool and system operations.
 */
export interface ExecutionResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
}
