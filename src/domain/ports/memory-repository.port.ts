import type { UserMemory } from '../entities';

/**
 * Port: persistence operations for user memory data.
 */
export interface MemoryRepository {
  save(memory: UserMemory): Promise<void>;
  findByUser(userId: string): Promise<UserMemory[]>;
  findRelevant(query: string, userId: string): Promise<UserMemory[]>;
  delete(memoryId: string): Promise<void>;
  clearByUser(userId: string): Promise<void>;
}
