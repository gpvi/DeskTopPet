import type { Database as SqlJsDatabase } from 'sql.js';
import type { UserMemory } from '../../../domain/entities/user-memory';
import type { MemoryRepository } from '../../../domain/ports/memory-repository.port';
import { RepositoryError } from '../../../shared/errors/repository-error';
import {
  mapRowToMemory,
  mapMemoryToRow,
  type MemoryRow,
} from '../sqlite/mappers/memory-mapper';

export class MemoryRepositoryImpl implements MemoryRepository {
  constructor(private readonly database: SqlJsDatabase) {}

  async save(memory: UserMemory): Promise<void> {
    try {
      const params = mapMemoryToRow(memory);
      this.database.run(
        `INSERT OR REPLACE INTO memories
           (memory_id, user_id, category, content, source, confidence, created_at, is_deleted)
         VALUES ($memoryId, $userId, $category, $content, $source, $confidence, $createdAt, $isDeleted)`,
        [params.$memoryId, params.$userId, params.$category, params.$content,
         params.$source, params.$confidence, params.$createdAt, params.$isDeleted],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'save memory');
    }
  }

  async findByUser(userId: string): Promise<UserMemory[]> {
    try {
      const statement = this.database.prepare(
        `SELECT memory_id, user_id, category, content, source, confidence, created_at, is_deleted
         FROM memories
         WHERE user_id = ? AND is_deleted = 0
         ORDER BY created_at DESC`,
      );
      statement.bind([userId]);
      return this.collectRows(statement);
    } catch (error) {
      throw wrapRepositoryError(error, 'find memories by user');
    }
  }

  async findRelevant(query: string, userId: string): Promise<UserMemory[]> {
    try {
      const keywordPattern = `%${query}%`;
      const statement = this.database.prepare(
        `SELECT memory_id, user_id, category, content, source, confidence, created_at, is_deleted
         FROM memories
         WHERE user_id = ? AND is_deleted = 0 AND content LIKE ?
         ORDER BY confidence DESC, created_at DESC`,
      );
      statement.bind([userId, keywordPattern]);
      return this.collectRows(statement);
    } catch (error) {
      throw wrapRepositoryError(error, 'find relevant memories');
    }
  }

  async delete(memoryId: string): Promise<void> {
    try {
      this.database.run(
        'UPDATE memories SET is_deleted = 1 WHERE memory_id = ?',
        [memoryId],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'delete memory');
    }
  }

  async clearByUser(userId: string): Promise<void> {
    try {
      this.database.run(
        'UPDATE memories SET is_deleted = 1 WHERE user_id = ?',
        [userId],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'clear memories by user');
    }
  }

  private collectRows(statement: ReturnType<SqlJsDatabase['prepare']>): UserMemory[] {
    const memories: UserMemory[] = [];
    while (statement.step()) {
      memories.push(mapRowToMemory(statement.getAsObject() as unknown as MemoryRow));
    }
    statement.free();
    return memories;
  }
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {return error;}
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(`Failed to ${operation}: ${message}`, operation);
}
