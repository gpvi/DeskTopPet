import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeDatabase } from '../../../../src/infrastructure/persistence/sqlite/database';

type MockStorage = Storage & {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  key: ReturnType<typeof vi.fn>;
};

function createMockStorage(initialValues: Record<string, string> = {}): MockStorage {
  const store = new Map<string, string>(Object.entries(initialValues));

  const storage = {
    get length() {
      return store.size;
    },
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
  } as unknown as MockStorage;

  return storage;
}

async function waitForPersistence(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 20);
  });
}

describe('initializeDatabase', () => {
  let originalLocalStorage: Storage | undefined;

  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')?.value;
  });

  afterEach(() => {
    if (originalLocalStorage === undefined) {
      delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }
    vi.restoreAllMocks();
  });

  it('does not use localStorage snapshots in :memory: mode', async () => {
    const storage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: storage,
    });

    const database = await initializeDatabase(':memory:');
    database.close();
    await waitForPersistence();

    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('loads and saves snapshots when localStorage is available', async () => {
    const storage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: storage,
    });

    const dbPath = 'memory-snapshot.db';
    const firstDatabase = await initializeDatabase(dbPath);
    firstDatabase.run(
      "INSERT INTO memories (memory_id, user_id, category, content, source, confidence, created_at, is_deleted) VALUES ('memory-1', 'user-1', 'preference', '喜欢猫', 'chat', 0.9, '2026-04-20T08:30:00.000Z', 0)",
    );
    firstDatabase.close();
    await waitForPersistence();

    expect(storage.getItem).toHaveBeenCalledWith(`desktop-pet:sqlite:${dbPath}`);
    expect(storage.setItem).toHaveBeenCalled();

    const snapshotCall = storage.setItem.mock.calls
      .find((call) => call[0] === `desktop-pet:sqlite:${dbPath}`);
    const snapshotValue = snapshotCall?.[1];
    expect(snapshotValue).toBeTypeOf('string');
    expect(snapshotValue).not.toContain('memory-1');

    const secondDatabase = await initializeDatabase(dbPath);
    const result = secondDatabase.exec("SELECT content FROM memories WHERE memory_id = 'memory-1'");
    secondDatabase.close();
    await waitForPersistence();

    expect(storage.getItem).toHaveBeenCalledWith(`desktop-pet:sqlite:${dbPath}`);
    expect(result[0]?.values).toEqual([['喜欢猫']]);
  });
});
