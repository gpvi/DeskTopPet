import type { ToolExecutor } from '../../../domain/ports/tool-executor.port';
import type { ExecutionResult } from '../../../shared/types';

const BROWSER_UNAVAILABLE_ERROR = 'Not available in browser environment';

/**
 * Browser-based fallback for the ToolExecutor port.
 * Used during Vite dev mode when Tauri APIs are not available.
 */
export class WebToolExecutor implements ToolExecutor {
  async openUrl(url: string): Promise<ExecutionResult> {
    try {
      window.open(url, '_blank', 'noopener');
      return { success: true, data: { url } };
    } catch (error: unknown) {
      return wrapBrowserError(error, 'openUrl');
    }
  }

  async openApplication(): Promise<ExecutionResult> {
    return { success: false, error: BROWSER_UNAVAILABLE_ERROR };
  }

  async openFolder(): Promise<ExecutionResult> {
    return { success: false, error: BROWSER_UNAVAILABLE_ERROR };
  }

  async readClipboard(): Promise<ExecutionResult> {
    if (!hasClipboardAccess()) {
      return {
        success: false,
        error: 'Clipboard API not available in this browser context',
      };
    }

    try {
      const text = await navigator.clipboard.readText();
      return { success: true, data: { text } };
    } catch (error: unknown) {
      return wrapBrowserError(error, 'readClipboard');
    }
  }
}

function hasClipboardAccess(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined' &&
    typeof navigator.clipboard.readText === 'function'
  );
}

function wrapBrowserError(error: unknown, operation: string): ExecutionResult {
  const message =
    error instanceof Error ? error.message : String(error);
  return { success: false, error: `${operation} failed in browser: ${message}` };
}
