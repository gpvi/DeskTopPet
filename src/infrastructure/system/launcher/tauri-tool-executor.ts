import type { ToolExecutor } from '../../../domain/ports/tool-executor.port';
import type { ExecutionResult } from '../../../shared/types';
import { ToolExecutionError } from '../../../shared/errors/tool-execution-error';

/**
 * Tauri-backed implementation of the ToolExecutor port.
 * Uses @tauri-apps/plugin-shell and @tauri-apps/plugin-clipboard-manager
 * via dynamic imports to avoid build errors when not in a Tauri environment.
 */
export class TauriToolExecutor implements ToolExecutor {
  async openUrl(url: string): Promise<ExecutionResult> {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
      return { success: true, data: { url } };
    } catch (error: unknown) {
      throwAsToolExecutionError(error, 'openUrl');
      return unreachable();
    }
  }

  async openApplication(applicationName: string): Promise<ExecutionResult> {
    try {
      const { Command } = await import('@tauri-apps/plugin-shell');
      const command = Command.create(applicationName);
      await command.execute();
      return { success: true, data: { applicationName } };
    } catch (error: unknown) {
      throwAsToolExecutionError(error, 'openApplication');
      return unreachable();
    }
  }

  async openFolder(folderPath: string): Promise<ExecutionResult> {
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(folderPath);
      return { success: true, data: { folderPath } };
    } catch (error: unknown) {
      throwAsToolExecutionError(error, 'openFolder');
      return unreachable();
    }
  }

  async readClipboard(): Promise<ExecutionResult> {
    try {
      const { readText } = await import(
        '@tauri-apps/plugin-clipboard-manager'
      );
      const text = await readText();
      return { success: true, data: { text } };
    } catch (error: unknown) {
      throwAsToolExecutionError(error, 'readClipboard');
      return unreachable();
    }
  }
}

function throwAsToolExecutionError(
  error: unknown,
  toolName: string,
): never {
  if (error instanceof ToolExecutionError) {
    throw error;
  }

  const message =
    error instanceof Error ? error.message : String(error);

  throw new ToolExecutionError(
    `${toolName} failed: ${message}`,
    toolName,
  );
}

function unreachable(): never {
  throw new Error('Unreachable: throwAsToolExecutionError always throws');
}
