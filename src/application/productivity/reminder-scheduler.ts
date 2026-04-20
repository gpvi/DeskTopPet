import type { ReminderRepositoryImpl } from '../../infrastructure/persistence/repositories/reminder-repository-impl';

const CHECK_INTERVAL_MS = 60_000;

export class ReminderScheduler {
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly reminderRepository: ReminderRepositoryImpl) {}

  start(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => this.checkReminders(), CHECK_INTERVAL_MS);
    this.checkReminders();
  }

  stop(): void {
    if (this.timerId === null) return;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  private async checkReminders(): Promise<void> {
    const pendingReminders = await this.reminderRepository.findPending();
    const now = new Date();

    for (const reminder of pendingReminders) {
      const triggerTime = reminder.scheduleRule.datetime;
      if (triggerTime && triggerTime <= now) {
        this.fireReminder(reminder.title, reminder.reminderId);
      }
    }
  }

  private async fireReminder(title: string, reminderId: string): Promise<void> {
    console.info(`[Reminder] "${title}" triggered`);
    await this.reminderRepository.markCompleted(reminderId);
  }
}
