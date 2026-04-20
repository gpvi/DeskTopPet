import type { Reminder } from '../../domain/entities/reminder';
import { createProactiveReminderCopy } from '../companion/companion-feedback';
import { runtimeLogger } from '../../shared/runtime-logger';

export interface ReminderScheduleRepository {
  findPending(): Promise<Reminder[]>;
  markCompleted(reminderId: string): Promise<void>;
}

const CHECK_INTERVAL_MS = 60_000;

export class ReminderScheduler {
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly reminderRepository: ReminderScheduleRepository,
    private readonly notifyReminder: (message: string) => void = (message) => {
      runtimeLogger.info(message);
    },
  ) {}

  start(): void {
    if (this.timerId !== null) {return;}
    this.timerId = setInterval(() => {
      void this.checkRemindersSafely();
    }, CHECK_INTERVAL_MS);
    void this.checkRemindersSafely();
  }

  stop(): void {
    if (this.timerId === null) {return;}
    clearInterval(this.timerId);
    this.timerId = null;
  }

  private async checkRemindersSafely(): Promise<void> {
    try {
      const pendingReminders = await this.reminderRepository.findPending();
      const now = new Date();

      for (const reminder of pendingReminders) {
        const triggerTime = reminder.scheduleRule.datetime;
        if (triggerTime && triggerTime <= now) {
          await this.fireReminder(reminder.title, reminder.reminderId);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtimeLogger.error(`[ReminderScheduler] check failed: ${message}`);
    }
  }

  private async fireReminder(title: string, reminderId: string): Promise<void> {
    const reminderCopy = createProactiveReminderCopy(title);
    this.notifyReminder(`[Reminder] ${reminderCopy}`);
    await this.reminderRepository.markCompleted(reminderId);
  }
}
