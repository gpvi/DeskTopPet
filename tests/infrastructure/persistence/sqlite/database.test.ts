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

  it('runs all migrations and can reopen an existing migrated snapshot', async () => {
    const storage = createMockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: storage,
    });

    const dbPath = 'migration-coverage.db';
    const firstDatabase = await initializeDatabase(dbPath);
    firstDatabase.run(
      `INSERT INTO conversation_sessions
         (session_id, user_id, current_intent, context_summary, started_at, last_active_at)
       VALUES ('session-1', 'user-1', 'chat', '', '2026-04-20T08:30:00.000Z', '2026-04-20T08:30:00.000Z')`,
    );
    firstDatabase.run(
      `INSERT INTO conversation_messages
         (message_id, session_id, role, content, created_at)
       VALUES ('message-1', 'session-1', 'user', 'hello', '2026-04-20T08:30:00.000Z')`,
    );
    firstDatabase.run(
      `INSERT INTO reminders
         (reminder_id, user_id, title, schedule_type, trigger_at, status, respect_quiet_hours, created_at)
       VALUES ('reminder-1', 'user-1', '喝水', 'once', '2026-04-20T08:31:00.000Z', 'active', 1, '2026-04-20T08:30:00.000Z')`,
    );
    firstDatabase.run(
      `INSERT INTO todos
         (todo_id, user_id, title, description, status, priority, created_at)
       VALUES ('todo-1', 'user-1', '整理测试证据', '', 'pending', 'medium', '2026-04-20T08:30:00.000Z')`,
    );
    firstDatabase.run(
      "INSERT INTO settings (key, value) VALUES ('theme', 'light')",
    );
    firstDatabase.run(
      "INSERT INTO memories (memory_id, user_id, category, content, source, confidence, created_at, is_deleted) VALUES ('memory-1', 'user-1', 'preference', '喜欢简洁回答', 'chat', 0.9, '2026-04-20T08:30:00.000Z', 0)",
    );
    firstDatabase.run(
      `INSERT INTO model_usage_records
         (usage_id, session_id, task_id, provider, model, feature, input_tokens, output_tokens, created_at)
       VALUES ('usage-1', 'session-1', 'task-1', 'deepseek', 'deepseek-chat', 'chat', 10, 5, '2026-04-20T08:30:00.000Z')`,
    );
    firstDatabase.close();
    await waitForPersistence();

    const secondDatabase = await initializeDatabase(dbPath);
    const tables = [
      'conversation_sessions',
      'conversation_messages',
      'reminders',
      'todos',
      'settings',
      'memories',
      'model_usage_records',
    ];

    for (const table of tables) {
      const result = secondDatabase.exec(`SELECT COUNT(*) FROM ${table}`);
      expect(result[0]?.values[0]?.[0]).toBe(1);
    }

    secondDatabase.close();
    await waitForPersistence();
  });

  it('falls back to a fresh migrated database when a persisted snapshot is corrupt', async () => {
    const dbPath = 'corrupt-snapshot.db';
    const storage = createMockStorage({
      [`desktop-pet:sqlite:${dbPath}`]: 'not-valid-base64',
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: storage,
    });

    const database = await initializeDatabase(dbPath);
    const result = database.exec(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'model_usage_records'",
    );
    database.close();
    await waitForPersistence();

    expect(result[0]?.values).toEqual([['model_usage_records']]);
    expect(storage.setItem).toHaveBeenCalledWith(
      `desktop-pet:sqlite:${dbPath}`,
      expect.any(String),
    );
  });
});
