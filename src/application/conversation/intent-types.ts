/**
 * Granular intent types for task routing.
 * 'chat' is the safe fallback — never block the user.
 */
export type UserIntent =
  | 'chat'
  | 'set_reminder'
  | 'open_url'
  | 'open_application'
  | 'open_folder'
  | 'read_clipboard'
  | 'manage_todo'
  | 'ask_question';

/**
 * Result of classifying a user message into a specific intent.
 */
export interface IntentClassificationResult {
  readonly intent: UserIntent;
  readonly confidence: number;
  readonly extractedParameters?: Record<string, string>;
}

/**
 * Intents that should be handled by the normal conversational chat flow.
 */
const CHAT_INTENTS: ReadonlySet<UserIntent> = new Set<UserIntent>([
  'chat',
  'ask_question',
]);

export function isChatIntent(intent: UserIntent): boolean {
  return CHAT_INTENTS.has(intent);
}

/**
 * Intents that require a tool action rather than a conversational reply.
 */
const TASK_INTENTS: ReadonlySet<UserIntent> = new Set<UserIntent>([
  'set_reminder',
  'open_url',
  'open_application',
  'open_folder',
  'read_clipboard',
  'manage_todo',
]);

export function isTaskIntent(intent: UserIntent): boolean {
  return TASK_INTENTS.has(intent);
}
