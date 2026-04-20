import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type WindowMock = {
  __TAURI_INTERNALS__?: unknown;
};

async function loadSystemPreferences() {
  return import('../../../../src/infrastructure/system/runtime/system-preferences');
}

function installWindowMock(withTauriInternals: boolean): WindowMock {
  const mockWindow: WindowMock = {};

  if (withTauriInternals) {
    mockWindow.__TAURI_INTERNALS__ = {};
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: mockWindow,
  });

  return mockWindow;
}

describe('applyRuntimeSetting', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { window?: unknown }).window;
  });

  it('does not throw when auto-start and notification plugins are unavailable', async () => {
    installWindowMock(true);

    vi.doMock('@tauri-apps/plugin-autostart', () => {
      throw new Error('autostart unavailable');
    });
    vi.doMock('@tauri-apps/plugin-notification', () => {
      throw new Error('notification unavailable');
    });

    const { applyRuntimeSettings } = await loadSystemPreferences();

    await expect(
      applyRuntimeSettings([
        { key: 'auto_start', value: true },
        { key: 'notification_enabled', value: true },
      ]),
    ).resolves.toBeUndefined();
  });

  it('enables auto-start through the plugin when available', async () => {
    installWindowMock(true);
    const enable = vi.fn().mockResolvedValue(undefined);
    const disable = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@tauri-apps/plugin-autostart', () => ({
      enable,
      disable,
    }));

    const { applyRuntimeSetting } = await loadSystemPreferences();

    await applyRuntimeSetting('auto_start', true);

    expect(enable).toHaveBeenCalledTimes(1);
    expect(disable).not.toHaveBeenCalled();
  });

  it('disables auto-start through the plugin when available', async () => {
    installWindowMock(true);
    const enable = vi.fn().mockResolvedValue(undefined);
    const disable = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@tauri-apps/plugin-autostart', () => ({
      enable,
      disable,
    }));

    const { applyRuntimeSetting } = await loadSystemPreferences();

    await applyRuntimeSetting('auto_start', false);

    expect(disable).toHaveBeenCalledTimes(1);
    expect(enable).not.toHaveBeenCalled();
  });

  it('requests notification permission through the plugin when available', async () => {
    installWindowMock(true);
    const isPermissionGranted = vi.fn().mockResolvedValue(false);
    const requestPermission = vi.fn().mockResolvedValue('granted');

    vi.doMock('@tauri-apps/plugin-notification', () => ({
      isPermissionGranted,
      requestPermission,
    }));

    const { applyRuntimeSetting } = await loadSystemPreferences();

    await applyRuntimeSetting('notification_enabled', true);

    expect(isPermissionGranted).toHaveBeenCalledTimes(1);
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
