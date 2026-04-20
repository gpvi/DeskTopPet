import type { TodoItem } from '../../domain/entities/todo-item';

export interface TodoRepository {
  save(todo: TodoItem): Promise<void>;
  findByUser(userId: string): Promise<TodoItem[]>;
  markCompleted(todoId: string, userId: string): Promise<void>;
  delete(todoId: string, userId: string): Promise<void>;
}

export class ManageTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

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

  async completeTodo(todoId: string, userId: string): Promise<void> {
    await this.todoRepository.markCompleted(todoId, userId);
  }

  async deleteTodo(todoId: string, userId: string): Promise<void> {
    await this.todoRepository.delete(todoId, userId);
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
