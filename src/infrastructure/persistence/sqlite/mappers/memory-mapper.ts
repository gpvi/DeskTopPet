import type { UserMemory } from '../../../../domain/entities/user-memory';

/** Row shape returned from the memories table. */
export interface MemoryRow {
  memory_id: string;
  user_id: string;
  category: string;
  content: string;
  source: string;
  confidence: number;
  created_at: string;
  is_deleted: number;
}

/** Parameter shape for persisting a memory. */
export interface MemoryRowParams {
  $memoryId: string;
  $userId: string;
  $category: string;
  $content: string;
  $source: string;
  $confidence: number;
  $createdAt: string;
  $isDeleted: number;
}

/** Map a database row to a UserMemory entity. */
export function mapRowToMemory(row: MemoryRow): UserMemory {
  return {
    memoryId: row.memory_id,
    userId: row.user_id,
    category: row.category,
    content: row.content,
    source: row.source,
    confidence: row.confidence,
    createdAt: new Date(row.created_at),
    isDeleted: row.is_deleted === 1,
  };
}

/** Map a UserMemory entity to database row parameters. */
export function mapMemoryToRow(memory: UserMemory): MemoryRowParams {
  return {
    $memoryId: memory.memoryId,
    $userId: memory.userId,
    $category: memory.category,
    $content: memory.content,
    $source: memory.source,
    $confidence: memory.confidence,
    $createdAt: memory.createdAt.toISOString(),
    $isDeleted: memory.isDeleted ? 1 : 0,
  };
}
