import type { TodoItem } from '../../../../domain/entities/todo-item';

/** Row shape returned from the todos table. */
export interface TodoRow {
  todo_id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Parameter shape for persisting a todo. */
export interface TodoRowParams {
  $todoId: string;
  $userId: string;
  $title: string;
  $description: string;
  $status: string;
  $priority: string;
  $dueAt: string | null;
  $createdAt: string;
}

/** Map a database row to a TodoItem entity. */
export function mapRowToTodo(row: TodoRow): TodoItem {
  return {
    todoId: row.todo_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status as TodoItem['status'],
    priority: row.priority as TodoItem['priority'],
    dueAt: row.due_at ? new Date(row.due_at) : null,
  };
}

/** Map a TodoItem entity to database row parameters. */
export function mapTodoToRow(todo: TodoItem, createdAt: Date): TodoRowParams {
  return {
    $todoId: todo.todoId,
    $userId: todo.userId,
    $title: todo.title,
    $description: todo.description,
    $status: todo.status,
    $priority: todo.priority,
    $dueAt: todo.dueAt?.toISOString() ?? null,
    $createdAt: createdAt.toISOString(),
  };
}
