import { describe, expect, it, vi } from 'vitest';
import { ManageTodoUseCase, type TodoRepository } from '../../../src/application/productivity/manage-todo.usecase';

function createTodoRepositoryMock(): TodoRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByUser: vi.fn().mockResolvedValue([]),
    markCompleted: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ManageTodoUseCase', () => {
  it('passes userId to the repository when completing a todo', async () => {
    const todoRepository = createTodoRepositoryMock();
    const useCase = new ManageTodoUseCase(todoRepository);

    await useCase.completeTodo('todo-1', 'user-1');

    expect(todoRepository.markCompleted).toHaveBeenCalledTimes(1);
    expect(todoRepository.markCompleted).toHaveBeenCalledWith('todo-1', 'user-1');
  });

  it('passes userId to the repository when deleting a todo', async () => {
    const todoRepository = createTodoRepositoryMock();
    const useCase = new ManageTodoUseCase(todoRepository);

    await useCase.deleteTodo('todo-1', 'user-1');

    expect(todoRepository.delete).toHaveBeenCalledTimes(1);
    expect(todoRepository.delete).toHaveBeenCalledWith('todo-1', 'user-1');
  });
});
