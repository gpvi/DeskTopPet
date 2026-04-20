import { describe, expect, it } from 'vitest';
import { initializeDatabase } from '../../../../src/infrastructure/persistence/sqlite/database';
import { TodoRepositoryImpl } from '../../../../src/infrastructure/persistence/repositories/todo-repository-impl';

async function createTodoRepository() {
  const database = await initializeDatabase(':memory:');
  const repository = new TodoRepositoryImpl(database);
  return { database, repository };
}

async function insertTodo(database: Awaited<ReturnType<typeof initializeDatabase>>, params: {
  todoId: string;
  userId: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueAt?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}) {
  database.run(
    `INSERT INTO todos
       (todo_id, user_id, title, description, status, priority, due_at, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.todoId,
      params.userId,
      params.title ?? 'Test todo',
      params.description ?? '',
      params.status ?? 'pending',
      params.priority ?? 'medium',
      params.dueAt ?? null,
      params.createdAt ?? '2026-04-20T08:30:00.000Z',
      params.completedAt ?? null,
    ],
  );
}

function getTodoRow(database: Awaited<ReturnType<typeof initializeDatabase>>, todoId: string) {
  const statement = database.prepare(
    `SELECT todo_id, user_id, status, completed_at
       FROM todos
      WHERE todo_id = ?`,
  );
  statement.bind([todoId]);
  if (!statement.step()) {
    statement.free();
    return null;
  }
  const row = statement.getAsObject() as {
    todo_id: string;
    user_id: string;
    status: string;
    completed_at: string | null;
  };
  statement.free();
  return row;
}

describe('TodoRepositoryImpl', () => {
  it('marks a todo completed when the user matches the owner', async () => {
    const { database, repository } = await createTodoRepository();
    try {
      await insertTodo(database, {
        todoId: 'todo-1',
        userId: 'user-1',
      });

      await repository.markCompleted('todo-1', 'user-1');

      const row = getTodoRow(database, 'todo-1');
      expect(row).toMatchObject({
        todo_id: 'todo-1',
        user_id: 'user-1',
        status: 'completed',
      });
      expect(row?.completed_at).toEqual(expect.any(String));
    } finally {
      database.close();
    }
  });

  it('rejects markCompleted when the user does not match the owner', async () => {
    const { database, repository } = await createTodoRepository();
    try {
      await insertTodo(database, {
        todoId: 'todo-1',
        userId: 'user-1',
      });

      await expect(repository.markCompleted('todo-1', 'user-2')).rejects.toThrow();
      expect(getTodoRow(database, 'todo-1')).toMatchObject({
        todo_id: 'todo-1',
        user_id: 'user-1',
        status: 'pending',
        completed_at: null,
      });
    } finally {
      database.close();
    }
  });

  it('deletes a todo when the user matches the owner', async () => {
    const { database, repository } = await createTodoRepository();
    try {
      await insertTodo(database, {
        todoId: 'todo-1',
        userId: 'user-1',
      });

      await repository.delete('todo-1', 'user-1');

      const row = getTodoRow(database, 'todo-1');
      expect(row).toBeNull();
    } finally {
      database.close();
    }
  });

  it('rejects delete when the user does not match the owner', async () => {
    const { database, repository } = await createTodoRepository();
    try {
      await insertTodo(database, {
        todoId: 'todo-1',
        userId: 'user-1',
      });

      await expect(repository.delete('todo-1', 'user-2')).rejects.toThrow();
      expect(getTodoRow(database, 'todo-1')).toMatchObject({
        todo_id: 'todo-1',
        user_id: 'user-1',
        status: 'pending',
        completed_at: null,
      });
    } finally {
      database.close();
    }
  });
});
