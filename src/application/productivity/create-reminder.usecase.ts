import type { Reminder } from '../../domain/entities/reminder';

export interface ReminderRepository {
  save(reminder: Reminder): Promise<void>;
}

export interface CreateReminderRequest {
  readonly title: string;
  readonly userId: string;
  readonly triggerAt: Date;
}

export class CreateReminderUseCase {
  constructor(private readonly reminderRepository: ReminderRepository) {}

  async execute(request: CreateReminderRequest): Promise<Reminder> {
    const reminder = this.buildReminder(request);
    await this.reminderRepository.save(reminder);
    return reminder;
  }

  private buildReminder(request: CreateReminderRequest): Reminder {
    return {
      reminderId: crypto.randomUUID(),
      userId: request.userId,
      title: request.title,
      scheduleRule: {
        type: 'once',
        datetime: request.triggerAt,
      },
      status: 'active',
      quietHoursPolicy: {
        respectQuietHours: true,
      },
    };
  }
}
