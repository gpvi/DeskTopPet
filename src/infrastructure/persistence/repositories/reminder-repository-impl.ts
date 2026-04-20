import type { Database as SqlJsDatabase } from 'sql.js';
import type { Reminder } from '../../../domain/entities/reminder';
import { RepositoryError } from '../../../shared/errors/repository-error';
import {
  mapRowToReminder,
  mapReminderToRow,
  type ReminderRow,
} from '../sqlite/mappers/reminder-mapper';

export class ReminderRepositoryImpl {
  constructor(private readonly database: SqlJsDatabase) {}

  async save(reminder: Reminder): Promise<void> {
    try {
      const params = mapReminderToRow(reminder, new Date());
      this.database.run(
        `INSERT OR REPLACE INTO reminders
           (reminder_id, user_id, title, schedule_type, trigger_at, cron_expression,
            status, respect_quiet_hours, reschedule_to, created_at)
         VALUES ($reminderId, $userId, $title, $scheduleType, $triggerAt, $cronExpression,
                 $status, $respectQuietHours, $rescheduleTo, $createdAt)`,
        [params.$reminderId, params.$userId, params.$title, params.$scheduleType,
         params.$triggerAt, params.$cronExpression, params.$status, params.$respectQuietHours,
         params.$rescheduleTo, params.$createdAt],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'save reminder');
    }
  }

  async findPending(): Promise<Reminder[]> {
    try {
      const statement = this.database.prepare(
        `SELECT reminder_id, user_id, title, schedule_type, trigger_at, cron_expression,
                status, respect_quiet_hours, reschedule_to, created_at
         FROM reminders WHERE status = 'active' ORDER BY trigger_at ASC`,
      );
      const rows: Reminder[] = [];
      while (statement.step()) {
        rows.push(mapRowToReminder(statement.getAsObject() as unknown as ReminderRow));
      }
      statement.free();
      return rows;
    } catch (error) {
      throw wrapRepositoryError(error, 'find pending reminders');
    }
  }

  async markCompleted(reminderId: string): Promise<void> {
    try {
      this.database.run(
        "UPDATE reminders SET status = 'completed' WHERE reminder_id = ?",
        [reminderId],
      );
    } catch (error) {
      throw wrapRepositoryError(error, 'mark reminder completed');
    }
  }
}

function wrapRepositoryError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new RepositoryError(`Failed to ${operation}: ${message}`, operation);
}
