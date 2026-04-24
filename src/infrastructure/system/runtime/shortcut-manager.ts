import { runtimeLogger } from '../../../shared/runtime-logger';

const CHAT_SHORTCUT = 'Ctrl+Shift+P';

type ShortcutCleanup = () => void;
type GlobalShortcutPlugin = {
  register(shortcut: string, handler: () => void): Promise<void>;
  unregister(shortcut: string): Promise<void>;
  isRegistered?: (shortcut: string) => Promise<boolean>;
};

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
    const register = readPluginFunction(plugin, 'register');
    const unregister = readPluginFunction(plugin, 'unregister');
    const isRegistered = readPluginFunction(plugin, 'isRegistered');

    if (!register || !unregister) {
      throw new Error('global shortcut plugin missing register/unregister');
    }

    if (isRegistered && await isRegistered(CHAT_SHORTCUT)) {
      await unregister(CHAT_SHORTCUT);
    }

    await register(CHAT_SHORTCUT, onTrigger);
    return () => {
      void unregister(CHAT_SHORTCUT);
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtimeLogger.warn(`[Shortcut] Tauri shortcut unavailable: ${message}`);
    return null;
  }
}

function readPluginFunction(
  plugin: unknown,
  name: keyof GlobalShortcutPlugin,
): ((shortcut: string, handler?: () => void) => Promise<unknown>) | null {
  try {
    const value = (plugin as Partial<GlobalShortcutPlugin>)[name];
    return typeof value === 'function'
      ? value as (shortcut: string, handler?: () => void) => Promise<unknown>
      : null;
  } catch {
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
