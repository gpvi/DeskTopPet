import type { UserMemory } from '../../domain/entities/user-memory';
import type { MemoryRepository } from '../../domain/ports/memory-repository.port';

export interface SaveMemoryRequest {
  readonly userId: string;
  readonly category: string;
  readonly content: string;
  readonly source: string;
  readonly confidence?: number;
}

/**
 * Explicitly persists a piece of information about the user.
 *
 * Memories are never auto-recorded — the caller decides what to save.
 */
export class SaveMemoryUseCase {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async execute(request: SaveMemoryRequest): Promise<UserMemory> {
    const memory = this.buildMemory(request);
    await this.memoryRepository.save(memory);
    return memory;
  }

  private buildMemory(request: SaveMemoryRequest): UserMemory {
    return {
      memoryId: crypto.randomUUID(),
      userId: request.userId,
      category: request.category,
      content: request.content,
      source: request.source,
      confidence: request.confidence ?? 1.0,
      createdAt: new Date(),
      isDeleted: false,
    };
  }
}
