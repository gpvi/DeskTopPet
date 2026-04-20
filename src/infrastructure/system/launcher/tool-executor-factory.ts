import type { ToolExecutor } from '../../../domain/ports/tool-executor.port';
import { TauriToolExecutor } from './tauri-tool-executor';
import { WebToolExecutor } from './web-tool-executor';

export function createToolExecutor(): ToolExecutor {
  return isTauriEnvironment()
    ? new TauriToolExecutor()
    : new WebToolExecutor();
}

function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}
