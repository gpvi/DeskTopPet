import type { Reminder } from '../../../../domain/entities/reminder';

/** Row shape returned from the reminders table. */
export interface ReminderRow {
  reminder_id: string;
  user_id: string;
  title: string;
  schedule_type: string;
  trigger_at: string | null;
  cron_expression: string | null;
  status: string;
  respect_quiet_hours: number;
  reschedule_to: string | null;
  created_at: string;
}

/** Parameter shape for persisting a reminder. */
export interface ReminderRowParams {
  $reminderId: string;
  $userId: string;
  $title: string;
  $scheduleType: string;
  $triggerAt: string | null;
  $cronExpression: string | null;
  $status: string;
  $respectQuietHours: number;
  $rescheduleTo: string | null;
  $createdAt: string;
}

/** Map a database row to a Reminder entity. */
export function mapRowToReminder(row: ReminderRow): Reminder {
  return {
    reminderId: row.reminder_id,
    userId: row.user_id,
    title: row.title,
    scheduleRule: {
      type: row.schedule_type as Reminder['scheduleRule']['type'],
      datetime: row.trigger_at ? new Date(row.trigger_at) : undefined,
      cronExpression: row.cron_expression ?? undefined,
    },
    status: row.status as Reminder['status'],
    quietHoursPolicy: {
      respectQuietHours: row.respect_quiet_hours === 1,
      rescheduleTo: row.reschedule_to ?? undefined,
    },
  };
}

/** Map a Reminder entity to database row parameters. */
export function mapReminderToRow(
  reminder: Reminder,
  createdAt: Date,
): ReminderRowParams {
  return {
    $reminderId: reminder.reminderId,
    $userId: reminder.userId,
    $title: reminder.title,
    $scheduleType: reminder.scheduleRule.type,
    $triggerAt: reminder.scheduleRule.datetime?.toISOString() ?? null,
    $cronExpression: reminder.scheduleRule.cronExpression ?? null,
    $status: reminder.status,
    $respectQuietHours: reminder.quietHoursPolicy.respectQuietHours ? 1 : 0,
    $rescheduleTo: reminder.quietHoursPolicy.rescheduleTo ?? null,
    $createdAt: createdAt.toISOString(),
  };
}
