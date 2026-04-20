import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProactiveReminderCopy } from '../../../src/application/companion/companion-feedback';
import {
  ReminderScheduler,
  type ReminderScheduleRepository,
} from '../../../src/application/productivity/reminder-scheduler';
import type { Reminder } from '../../../src/domain/entities/reminder';
import { runtimeLogger } from '../../../src/shared/runtime-logger';

const NOW = new Date('2026-04-20T08:30:00.000Z');
const CHECK_INTERVAL_MS = 60_000;

function createDueReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    reminderId: 'reminder-1',
    userId: 'user-1',
    title: 'Drink water',
    scheduleRule: {
      type: 'once',
      datetime: new Date('2026-04-20T08:29:59.000Z'),
    },
    status: 'active',
    quietHoursPolicy: {
      respectQuietHours: false,
    },
    ...overrides,
  };
}

function createRepositoryMock(
  overrides: Partial<ReminderScheduleRepository> = {},
): ReminderScheduleRepository {
  return {
    findPending: vi.fn(),
    markCompleted: vi.fn(),
    ...overrides,
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('ReminderScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('start() checks immediately and completes due reminders', async () => {
    const reminder = createDueReminder();
    const notifyReminder = vi.fn();
    const reminderRepository = createRepositoryMock({
      findPending: vi.fn().mockResolvedValue([reminder]),
      markCompleted: vi.fn().mockResolvedValue(undefined),
    });
    const scheduler = new ReminderScheduler(reminderRepository, notifyReminder);

    scheduler.start();
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(1);
    expect(notifyReminder).toHaveBeenCalledTimes(1);
    expect(notifyReminder).toHaveBeenCalledWith(
      `[Reminder] ${createProactiveReminderCopy(reminder.title)}`,
    );
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markCompleted).toHaveBeenCalledWith(reminder.reminderId);
  });

  it('stop() prevents subsequent interval checks from firing', async () => {
    const reminder = createDueReminder();
    const notifyReminder = vi.fn();
    const reminderRepository = createRepositoryMock({
      findPending: vi.fn().mockResolvedValue([reminder]),
      markCompleted: vi.fn().mockResolvedValue(undefined),
    });
    const scheduler = new ReminderScheduler(reminderRepository, notifyReminder);

    scheduler.start();
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS);
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(2);
    expect(notifyReminder).toHaveBeenCalledTimes(2);
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(2);

    scheduler.stop();

    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS * 3);
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(2);
    expect(notifyReminder).toHaveBeenCalledTimes(2);
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(2);
  });

  it('keeps running after findPending rejects on one check', async () => {
    const reminder = createDueReminder();
    const notifyReminder = vi.fn();
    const logError = vi.spyOn(runtimeLogger, 'error').mockImplementation(() => undefined);
    const reminderRepository = createRepositoryMock({
      findPending: vi
        .fn()
        .mockRejectedValueOnce(new Error('findPending failed'))
        .mockResolvedValue([reminder]),
      markCompleted: vi.fn().mockResolvedValue(undefined),
    });
    const scheduler = new ReminderScheduler(reminderRepository, notifyReminder);

    scheduler.start();
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS);
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(2);
    expect(notifyReminder).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('[ReminderScheduler] check failed: findPending failed');
  });

  it('keeps running after markCompleted rejects on one check', async () => {
    const reminder = createDueReminder();
    const notifyReminder = vi.fn();
    const logError = vi.spyOn(runtimeLogger, 'error').mockImplementation(() => undefined);
    const reminderRepository = createRepositoryMock({
      findPending: vi.fn().mockResolvedValue([reminder]),
      markCompleted: vi
        .fn()
        .mockRejectedValueOnce(new Error('markCompleted failed'))
        .mockResolvedValue(undefined),
    });
    const scheduler = new ReminderScheduler(reminderRepository, notifyReminder);

    scheduler.start();
    await flushMicrotasks();

    expect(notifyReminder).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS);
    await flushMicrotasks();

    expect(reminderRepository.findPending).toHaveBeenCalledTimes(2);
    expect(notifyReminder).toHaveBeenCalledTimes(2);
    expect(reminderRepository.markCompleted).toHaveBeenCalledTimes(2);
    expect(logError).toHaveBeenCalledWith('[ReminderScheduler] check failed: markCompleted failed');
  });
});
