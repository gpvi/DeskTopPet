import type { ExecutionResult } from '../../shared/types';

/**
 * Port: abstract executor for system-level tool operations.
 */
export interface ToolExecutor {
  openUrl(url: string): Promise<ExecutionResult>;
  openApplication(name: string): Promise<ExecutionResult>;
  openFolder(path: string): Promise<ExecutionResult>;
  readClipboard(): Promise<ExecutionResult>;
}
