import { DomainError } from './domain-error';

/**
 * Raised when a tool or system operation fails during execution.
 */
export class ToolExecutionError extends DomainError {
  public readonly toolName: string;

  constructor(message: string, toolName: string) {
    super(message, 'TOOL_EXECUTION_ERROR');
    this.toolName = toolName;
  }
}
