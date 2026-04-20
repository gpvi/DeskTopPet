import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { runtimeLogger } from '../../../shared/runtime-logger';
import { MIGRATION_001_CONVERSATIONS } from './migrations/001-conversations';
import { MIGRATION_002_REMINDERS } from './migrations/002-reminders';
import { MIGRATION_003_TODOS } from './migrations/003-todos';
import { MIGRATION_004_SETTINGS } from './migrations/004-settings';
import { MIGRATION_005_MEMORIES } from './migrations/005-memories';
import { MIGRATION_006_USAGE } from './migrations/006-usage';

const IN_MEMORY_DB_PATH = ':memory:';
const STORAGE_KEY_PREFIX = 'desktop-pet:sqlite:';
const BYTE_CHUNK_SIZE = 0x8000;

const ALL_MIGRATIONS: string[] = [
  MIGRATION_001_CONVERSATIONS,
  MIGRATION_002_REMINDERS,
  MIGRATION_003_TODOS,
  MIGRATION_004_SETTINGS,
  MIGRATION_005_MEMORIES,
  MIGRATION_006_USAGE,
];

/**
 * Initialize an SQLite database via sql.js (WASM) and run all pending migrations.
 */
export async function initializeDatabase(
  dbPath: string,
): Promise<SqlJsDatabase> {
  const sqlJs = await initSqlJs();
  const storage = createStorageAdapter(dbPath);
  const snapshot = storage?.load();
  const database = snapshot ? new sqlJs.Database(snapshot) : new sqlJs.Database();

  runMigrations(database);
  if (storage) {
    attachAutoPersist(database, storage.save);
    storage.save(database.export());
  }

  if (dbPath !== IN_MEMORY_DB_PATH) {
    runtimeLogger.info(`[Persistence] Database initialized at ${dbPath}`);
  }

  return database;
}

function runMigrations(database: SqlJsDatabase): void {
  for (const migrationSql of ALL_MIGRATIONS) {
    database.run(migrationSql);
  }
}

function createStorageAdapter(
  dbPath: string,
): { load: () => Uint8Array | null; save: (data: Uint8Array) => void } | null {
  if (dbPath === IN_MEMORY_DB_PATH) {
    return null;
  }

  const localStorageRef = getLocalStorage();
  if (!localStorageRef) {
    runtimeLogger.warn(`[Persistence] localStorage unavailable, fallback to memory for ${dbPath}`);
    return null;
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${dbPath}`;
  return {
    load: () => {
      const encoded = localStorageRef.getItem(storageKey);
      if (!encoded) {
        return null;
      }
      try {
        return base64ToUint8Array(encoded);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        runtimeLogger.warn(`[Persistence] Snapshot decode failed for ${dbPath}: ${message}`);
        return null;
      }
    },
    save: (data: Uint8Array) => {
      try {
        localStorageRef.setItem(storageKey, uint8ArrayToBase64(data));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        runtimeLogger.warn(`[Persistence] Snapshot save failed for ${dbPath}: ${message}`);
      }
    },
  };
}

function attachAutoPersist(
  database: SqlJsDatabase,
  saveSnapshot: (data: Uint8Array) => void,
): void {
  const originalRun = database.run.bind(database);
  const originalExec = database.exec.bind(database);
  const originalClose = database.close.bind(database);

  database.run = (sql: string, params?: unknown[]): SqlJsDatabase => {
    const result = originalRun(sql, params);
    persistSnapshot(database, saveSnapshot);
    return result;
  };

  database.exec = (sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[] => {
    const result = originalExec(sql, params);
    if (isPotentialWriteSql(sql)) {
      persistSnapshot(database, saveSnapshot);
    }
    return result;
  };

  database.close = (): void => {
    persistSnapshot(database, saveSnapshot);
    originalClose();
  };
}

function persistSnapshot(
  database: SqlJsDatabase,
  saveSnapshot: (data: Uint8Array) => void,
): void {
  saveSnapshot(database.export());
}

function isPotentialWriteSql(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return (
    normalized.startsWith('INSERT') ||
    normalized.startsWith('UPDATE') ||
    normalized.startsWith('DELETE') ||
    normalized.startsWith('CREATE') ||
    normalized.startsWith('DROP') ||
    normalized.startsWith('ALTER') ||
    normalized.startsWith('REPLACE') ||
    normalized.startsWith('BEGIN') ||
    normalized.startsWith('COMMIT') ||
    normalized.startsWith('ROLLBACK')
  );
}

function getLocalStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BYTE_CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + BYTE_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return globalThis.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
