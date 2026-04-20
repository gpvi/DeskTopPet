import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { MIGRATION_001_CONVERSATIONS } from './migrations/001-conversations';

const ALL_MIGRATIONS: string[] = [MIGRATION_001_CONVERSATIONS];

/**
 * Initialize an SQLite database via sql.js (WASM) and run all pending migrations.
 */
export async function initializeDatabase(
  dbPath: string,
): Promise<SqlJsDatabase> {
  const sqlJs = await initSqlJs();
  const database = new sqlJs.Database();

  runMigrations(database);

  if (dbPath !== ':memory:') {
    console.info(`[Persistence] Database initialized at ${dbPath}`);
  }

  return database;
}

function runMigrations(database: SqlJsDatabase): void {
  for (const migrationSql of ALL_MIGRATIONS) {
    database.run(migrationSql);
  }
}
