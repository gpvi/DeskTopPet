import type {
  LLMGateway,
  ToolExecutor,
  ConversationRepository,
  MemoryRepository,
  UsageRepository,
} from '../../domain/ports';
import type { Reminder } from '../../domain/entities/reminder';
import type { TodoItem } from '../../domain/entities/todo-item';

/**
 * Central container holding all port instances.
 * Resolved at bootstrap time with concrete infrastructure adapters.
 */
export interface AppContainer {
  readonly llmGateway: LLMGateway;
  readonly toolExecutor: ToolExecutor;
  readonly conversationRepository: ConversationRepository;
  readonly memoryRepository: MemoryRepository;
  readonly usageRepository: UsageRepository;
  readonly reminderRepository: {
    save(reminder: Reminder): Promise<void>;
    findPending(): Promise<Reminder[]>;
    markCompleted(reminderId: string): Promise<void>;
  };
  readonly todoRepository: {
    save(todo: TodoItem): Promise<void>;
    findByUser(userId: string): Promise<TodoItem[]>;
    markCompleted(todoId: string): Promise<void>;
    delete(todoId: string): Promise<void>;
  };
  readonly settingsRepository: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
  };
}
