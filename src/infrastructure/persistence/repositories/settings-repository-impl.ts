import type { Database as SqlJsDatabase } from 'sql.js';
import { RepositoryError } from '../../../shared/errors/repository-error';

export class SettingsRepositoryImpl {
  constructor(private readonly database: SqlJsDatabase) {}

  async get(key: string): Promise<string | null> {
    try {
      const statement = this.database.prepare(
        'SELECT value FROM settings WHERE key = ?',
      );
      statement.bind([key]);
      if (!statement.step()) {
        statement.free();
        return null;
      }
      const row = statement.getAsObject() as { value: string };
      statement.free();
      return row.value;
    } catch (error) {
      throw wrapRepositoryError(error, 'get setting');
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.database.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'set setting');
    }
  }
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {return error;}
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(`Failed to ${operation}: ${message}`, operation);
}
