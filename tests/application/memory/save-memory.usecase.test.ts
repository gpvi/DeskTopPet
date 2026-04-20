import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SaveMemoryUseCase } from '../../../src/application/memory/save-memory.usecase';
import type { MemoryRepository } from '../../../src/domain/ports/memory-repository.port';

describe('SaveMemoryUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T08:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('generates memoryId and createdAt, then persists the memory', async () => {
    const memoryRepository: MemoryRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByUser: vi.fn(),
      findRelevant: vi.fn(),
      delete: vi.fn(),
      clearByUser: vi.fn(),
    };
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('memory-123');

    const useCase = new SaveMemoryUseCase(memoryRepository);

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'preference',
      content: '喜欢猫',
      source: 'chat',
    });

    expect(memoryRepository.save).toHaveBeenCalledTimes(1);
    expect(memoryRepository.save).toHaveBeenCalledWith({
      memoryId: 'memory-123',
      userId: 'user-1',
      category: 'preference',
      content: '喜欢猫',
      source: 'chat',
      confidence: 1,
      createdAt: new Date('2026-04-20T08:30:00.000Z'),
      isDeleted: false,
    });
    expect(result).toEqual({
      memoryId: 'memory-123',
      userId: 'user-1',
      category: 'preference',
      content: '喜欢猫',
      source: 'chat',
      confidence: 1,
      createdAt: new Date('2026-04-20T08:30:00.000Z'),
      isDeleted: false,
    });
  });
});
