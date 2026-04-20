/**
 * A task or to-do item tracked for the user.
 */
export interface TodoItem {
  readonly todoId: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  readonly priority: 'low' | 'medium' | 'high';
  readonly dueAt: Date | null;
}
