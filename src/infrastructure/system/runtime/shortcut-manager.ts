import { runtimeLogger } from '../../../shared/runtime-logger';

const CHAT_SHORTCUT = 'Ctrl+Shift+P';

type ShortcutCleanup = () => void;

export async function setupChatShortcut(
  onTrigger: () => void,
): Promise<ShortcutCleanup> {
  if (isTauriEnvironment()) {
    const tauriCleanup = await tryRegisterTauriShortcut(onTrigger);
    if (tauriCleanup) {
      return tauriCleanup;
    }
  }
  return registerWebFallbackShortcut(onTrigger);
}

async function tryRegisterTauriShortcut(
  onTrigger: () => void,
): Promise<ShortcutCleanup | null> {
  try {
    const plugin = await import(
      /* @vite-ignore */
      '@tauri-apps/plugin-global-shortcut'
    );

    await plugin.register(CHAT_SHORTCUT, onTrigger);
    return () => {
      void plugin.unregister(CHAT_SHORTCUT);
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtimeLogger.warn(`[Shortcut] Tauri shortcut unavailable: ${message}`);
    return null;
  }
}

function registerWebFallbackShortcut(onTrigger: () => void): ShortcutCleanup {
  const handler = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const hasPrimaryModifier = event.ctrlKey || event.metaKey;
    if (hasPrimaryModifier && event.shiftKey && key === 'p') {
      event.preventDefault();
      onTrigger();
    }
  };

  window.addEventListener('keydown', handler);
  return () => {
    window.removeEventListener('keydown', handler);
  };
}

function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}
