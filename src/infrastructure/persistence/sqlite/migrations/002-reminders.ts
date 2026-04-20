/**
 * Migration 002: Create reminders table.
 *
 * Stores scheduled reminders with their schedule rules and quiet-hours policy.
 * Uses TEXT for ISO timestamps and UUID identifiers.
 */
export const MIGRATION_002_REMINDERS = `
  CREATE TABLE IF NOT EXISTS reminders (
    reminder_id           TEXT PRIMARY KEY,
    user_id               TEXT    NOT NULL,
    title                 TEXT    NOT NULL,
    schedule_type         TEXT    NOT NULL CHECK (schedule_type IN ('once', 'recurring')),
    trigger_at            TEXT,
    cron_expression       TEXT,
    status                TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'snoozed', 'cancelled')),
    respect_quiet_hours   INTEGER NOT NULL DEFAULT 0,
    reschedule_to         TEXT,
    created_at            TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reminders_trigger_at
    ON reminders(trigger_at);

  CREATE INDEX IF NOT EXISTS idx_reminders_status
    ON reminders(status);
`;
