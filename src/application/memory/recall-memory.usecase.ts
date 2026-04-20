import type { UserMemory } from '../../domain/entities/user-memory';
import type { MemoryRepository } from '../../domain/ports/memory-repository.port';

export interface RecallMemoryRequest {
  readonly userId: string;
  readonly query: string;
}

/**
 * Retrieves memories relevant to a keyword query for a given user.
 */
export class RecallMemoryUseCase {
  constructor(private readonly memoryRepository: MemoryRepository) {}

  async execute(request: RecallMemoryRequest): Promise<UserMemory[]> {
    return this.memoryRepository.findRelevant(request.query, request.userId);
  }
}
