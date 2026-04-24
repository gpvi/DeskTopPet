import { runtimeLogger } from '../../../shared/runtime-logger';

export interface RuntimeSettingEntry {
  readonly key: string;
  readonly value: boolean;
}

const AUTO_START_KEY = 'auto_start';
const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

export async function applyRuntimeSettings(
  settings: ReadonlyArray<RuntimeSettingEntry>,
): Promise<void> {
  for (const entry of settings) {
    await applyRuntimeSetting(entry.key, entry.value);
  }
}

export async function applyRuntimeSetting(
  key: string,
  value: boolean,
): Promise<void> {
  if (key === AUTO_START_KEY) {
    await applyAutoStart(value);
    return;
  }

  if (key === NOTIFICATION_ENABLED_KEY) {
    await applyNotificationPermission(value);
  }
}

async function applyAutoStart(enabled: boolean): Promise<void> {
  if (!isTauriEnvironment()) {
    return;
  }

  try {
    const plugin = await import(
      /* @vite-ignore */
      '@tauri-apps/plugin-autostart'
    );
    if (enabled) {
      await plugin.enable();
    } else {
      await plugin.disable();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isExpectedAutoStartMissingError(message)) {
      runtimeLogger.info('[Runtime] Auto-start entry not found; treated as already disabled.');
      return;
    }
    runtimeLogger.warn(`[Runtime] Auto-start apply failed: ${message}`);
  }
}

async function applyNotificationPermission(enabled: boolean): Promise<void> {
  if (!enabled) {
    return;
  }

  if (isTauriEnvironment()) {
    try {
      const plugin = await import(
        /* @vite-ignore */
        '@tauri-apps/plugin-notification'
      );
      const granted = await plugin.isPermissionGranted();
      if (!granted) {
        await plugin.requestPermission();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtimeLogger.warn(`[Runtime] Tauri notification permission failed: ${message}`);
    }
    return;
  }

  if (typeof Notification === 'undefined') {
    return;
  }

  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtimeLogger.warn(`[Runtime] Browser notification permission failed: ${message}`);
    }
  }
}

function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}

function isExpectedAutoStartMissingError(message: string): boolean {
  return /os error 2|系统找不到指定的文件/iu.test(message);
}
