import { describe, expect, it, vi } from 'vitest';
import { RecallMemoryUseCase } from '../../../src/application/memory/recall-memory.usecase';
import type { MemoryRepository } from '../../../src/domain/ports/memory-repository.port';

describe('RecallMemoryUseCase', () => {
  it('passes query and userId through to repository.findRelevant', async () => {
    const memories = [
      {
        memoryId: 'memory-1',
        userId: 'user-1',
        category: 'preference',
        content: '喜欢猫',
        source: 'chat',
        confidence: 0.9,
        createdAt: new Date('2026-04-20T08:30:00.000Z'),
        isDeleted: false,
      },
    ];
    const memoryRepository: MemoryRepository = {
      save: vi.fn(),
      findByUser: vi.fn(),
      findRelevant: vi.fn().mockResolvedValue(memories),
      delete: vi.fn(),
      clearByUser: vi.fn(),
    };
    const useCase = new RecallMemoryUseCase(memoryRepository);

    const result = await useCase.execute({
      userId: 'user-1',
      query: '猫',
    });

    expect(memoryRepository.findRelevant).toHaveBeenCalledTimes(1);
    expect(memoryRepository.findRelevant).toHaveBeenCalledWith('猫', 'user-1');
    expect(result).toBe(memories);
  });
});
