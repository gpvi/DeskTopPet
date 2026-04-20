import type { AppContainer } from './composition-root';
import type { LLMProviderConfig } from '../../infrastructure/llm/provider-config';
import { createLLMGateway } from '../../infrastructure/llm/gateway/provider-factory';
import { initializeDatabase } from '../../infrastructure/persistence/sqlite/database';
import { ConversationRepositoryImpl } from '../../infrastructure/persistence/repositories/conversation-repository-impl';
import { MemoryRepositoryImpl } from '../../infrastructure/persistence/repositories/memory-repository-impl';
import { UsageRepositoryImpl } from '../../infrastructure/persistence/repositories/usage-repository-impl';
import { SettingsRepositoryImpl } from '../../infrastructure/persistence/repositories/settings-repository-impl';
import { ReminderRepositoryImpl } from '../../infrastructure/persistence/repositories/reminder-repository-impl';
import { TodoRepositoryImpl } from '../../infrastructure/persistence/repositories/todo-repository-impl';
import { createToolExecutor } from '../../infrastructure/system/launcher/tool-executor-factory';

const PLACEHOLDER_LLM_CONFIG: LLMProviderConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'PLACEHOLDER_API_KEY',
  defaultModel: 'deepseek-chat',
};

const DEFAULT_DATABASE_PATH = 'desktop-pet-app.db';

let cachedContainer: AppContainer | null = null;

export async function createAppContainer(
  llmConfig: LLMProviderConfig = PLACEHOLDER_LLM_CONFIG,
): Promise<AppContainer> {
  if (cachedContainer) return cachedContainer;

  const database = await initializeDatabase(DEFAULT_DATABASE_PATH);

  cachedContainer = {
    llmGateway: createLLMGateway(llmConfig),
    toolExecutor: createToolExecutor(),
    conversationRepository: new ConversationRepositoryImpl(database),
    memoryRepository: new MemoryRepositoryImpl(database),
    usageRepository: new UsageRepositoryImpl(database),
    reminderRepository: new ReminderRepositoryImpl(database),
    todoRepository: new TodoRepositoryImpl(database),
    settingsRepository: new SettingsRepositoryImpl(database),
  };

  return cachedContainer;
}

export function getAppContainer(): AppContainer | null {
  return cachedContainer;
}
