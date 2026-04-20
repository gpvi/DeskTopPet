import type { Database as SqlJsDatabase } from 'sql.js';
import type { TodoItem } from '../../../domain/entities/todo-item';
import { RepositoryError } from '../../../shared/errors/repository-error';
import {
  mapRowToTodo,
  mapTodoToRow,
  type TodoRow,
} from '../sqlite/mappers/todo-mapper';

export class TodoRepositoryImpl {
  constructor(private readonly database: SqlJsDatabase) {}

  async save(todo: TodoItem): Promise<void> {
    try {
      const params = mapTodoToRow(todo, new Date());
      this.database.run(
        `INSERT OR REPLACE INTO todos
           (todo_id, user_id, title, description, status, priority, due_at, created_at)
         VALUES ($todoId, $userId, $title, $description, $status, $priority, $dueAt, $createdAt)`,
        [params.$todoId, params.$userId, params.$title, params.$description,
         params.$status, params.$priority, params.$dueAt, params.$createdAt],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'save todo');
    }
  }

  async findByUser(userId: string): Promise<TodoItem[]> {
    try {
      const statement = this.database.prepare(
        `SELECT todo_id, user_id, title, description, status, priority, due_at, created_at, completed_at
         FROM todos WHERE user_id = ? ORDER BY created_at DESC`,
      );
      statement.bind([userId]);
      const rows: TodoItem[] = [];
      while (statement.step()) {
        rows.push(mapRowToTodo(statement.getAsObject() as unknown as TodoRow));
      }
      statement.free();
      return rows;
    } catch (error) {
      throw wrapRepositoryError(error, 'find todos by user');
    }
  }

  async markCompleted(todoId: string, userId: string): Promise<void> {
    try {
      this.database.run(
        `UPDATE todos
         SET status = 'completed', completed_at = ?
         WHERE todo_id = ? AND user_id = ?`,
        [new Date().toISOString(), todoId, userId],
      );
      assertAffectedRows(this.database, 'mark todo completed', todoId, userId);
    } catch (error) {
      throw wrapRepositoryError(error, 'mark todo completed');
    }
  }

  async delete(todoId: string, userId: string): Promise<void> {
    try {
      this.database.run(
        'DELETE FROM todos WHERE todo_id = ? AND user_id = ?',
        [todoId, userId],
      );
      assertAffectedRows(this.database, 'delete todo', todoId, userId);
    } catch (error) {
      throw wrapRepositoryError(error, 'delete todo');
    }
  }
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {return error;}
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(`Failed to ${operation}: ${message}`, operation);
}

function assertAffectedRows(
  database: SqlJsDatabase,
  operation: string,
  todoId: string,
  userId: string,
): void {
  const result = database.exec('SELECT changes() AS affected');
  const affected = Number(result[0]?.values?.[0]?.[0] ?? 0);
  if (affected > 0) {return;}
  throw new RepositoryError(
    `Failed to ${operation}: todo not found or access denied (todoId=${todoId}, userId=${userId})`,
    operation,
  );
}
