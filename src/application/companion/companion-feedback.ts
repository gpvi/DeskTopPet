const PROACTIVE_REMINDER_PREFIX = [
  '小提醒一下',
  '轻轻提醒你',
  '准备好了就看看这个',
] as const;

const COMPLETION_FEEDBACK_PREFIX = [
  '做得很好',
  '这一步很稳',
  '进展不错',
] as const;

function pickBySeed(items: readonly string[], seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return items[hash % items.length] ?? items[0];
}

export function createProactiveReminderCopy(reminderTitle: string): string {
  const prefix = pickBySeed(PROACTIVE_REMINDER_PREFIX, reminderTitle);
  return `${prefix}：${reminderTitle}`;
}

export function createCompletionFeedbackCopy(taskLabel: string): string {
  const prefix = pickBySeed(COMPLETION_FEEDBACK_PREFIX, taskLabel);
  return `${prefix}，${taskLabel}已完成。`;
}
