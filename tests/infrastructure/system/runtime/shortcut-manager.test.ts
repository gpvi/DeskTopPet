import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type WindowMock = {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  __TAURI_INTERNALS__?: unknown;
};

async function loadShortcutManager() {
  return import('../../../../src/infrastructure/system/runtime/shortcut-manager');
}

function installWindowMock(withTauriInternals: boolean): WindowMock {
  const mockWindow: WindowMock = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

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

describe('setupChatShortcut', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { window?: unknown }).window;
  });

  it('falls back to window keydown when the shortcut plugin is unavailable', async () => {
    const mockWindow = installWindowMock(true);
    const onTrigger = vi.fn();

    vi.doMock('@tauri-apps/plugin-global-shortcut', () => {
      throw new Error('plugin unavailable');
    });

    const { setupChatShortcut } = await loadShortcutManager();

    const cleanup = await setupChatShortcut(onTrigger);

    expect(cleanup).toBeTypeOf('function');
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
    expect(onTrigger).not.toHaveBeenCalled();

    const handler = vi.mocked(mockWindow.addEventListener).mock.calls[0]?.[1] as
      | ((event: KeyboardEvent) => void)
      | undefined;
    expect(handler).toBeTypeOf('function');

    const preventDefault = vi.fn();
    handler?.({
      key: 'p',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      preventDefault,
    } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    cleanup();

    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('keydown', handler);
  });

  it('registers and unregisters the Tauri global shortcut when the plugin is available', async () => {
    installWindowMock(true);
    const onTrigger = vi.fn();
    const register = vi.fn().mockResolvedValue(undefined);
    const unregister = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@tauri-apps/plugin-global-shortcut', () => ({
      register,
      unregister,
    }));

    const { setupChatShortcut } = await loadShortcutManager();
    const cleanup = await setupChatShortcut(onTrigger);

    expect(register).toHaveBeenCalledWith('Ctrl+Shift+P', onTrigger);
    expect(onTrigger).not.toHaveBeenCalled();

    cleanup();

    expect(unregister).toHaveBeenCalledWith('Ctrl+Shift+P');
  });
});
