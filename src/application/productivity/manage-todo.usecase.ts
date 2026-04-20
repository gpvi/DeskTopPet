import type { TodoItem } from '../../domain/entities/todo-item';
import type { TodoRepositoryImpl } from '../../infrastructure/persistence/repositories/todo-repository-impl';

export class ManageTodoUseCase {
  constructor(private readonly todoRepository: TodoRepositoryImpl) {}

  async createTodo(request: {
    title: string;
    userId: string;
    description?: string;
    priority?: TodoItem['priority'];
  }): Promise<TodoItem> {
    const todo = this.buildTodo(request);
    await this.todoRepository.save(todo);
    return todo;
  }

  async listTodos(userId: string): Promise<TodoItem[]> {
    return this.todoRepository.findByUser(userId);
  }

  async completeTodo(todoId: string): Promise<void> {
    await this.todoRepository.markCompleted(todoId);
  }

  async deleteTodo(todoId: string): Promise<void> {
    await this.todoRepository.delete(todoId);
  }

  private buildTodo(request: {
    title: string;
    userId: string;
    description?: string;
    priority?: TodoItem['priority'];
  }): TodoItem {
    return {
      todoId: crypto.randomUUID(),
      userId: request.userId,
      title: request.title,
      description: request.description ?? '',
      status: 'pending',
      priority: request.priority ?? 'medium',
      dueAt: null,
    };
  }
}
