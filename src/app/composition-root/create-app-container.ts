import type { AppContainer } from './composition-root';
import type { LLMProviderConfig, LLMProviderIdentifier } from '../../infrastructure/llm/provider-config';
import { createLLMGateway } from '../../infrastructure/llm/gateway/provider-factory';
import type { LLMGateway } from '../../domain/ports/llm-gateway.port';
import { initializeDatabase } from '../../infrastructure/persistence/sqlite/database';
import { ConversationRepositoryImpl } from '../../infrastructure/persistence/repositories/conversation-repository-impl';
import { MemoryRepositoryImpl } from '../../infrastructure/persistence/repositories/memory-repository-impl';
import { UsageRepositoryImpl } from '../../infrastructure/persistence/repositories/usage-repository-impl';
import { SettingsRepositoryImpl } from '../../infrastructure/persistence/repositories/settings-repository-impl';
import { ReminderRepositoryImpl } from '../../infrastructure/persistence/repositories/reminder-repository-impl';
import { TodoRepositoryImpl } from '../../infrastructure/persistence/repositories/todo-repository-impl';
import { createToolExecutor } from '../../infrastructure/system/launcher/tool-executor-factory';

const LLM_CONFIG_KEYS = {
  provider: 'llm:provider',
  baseUrl: 'llm:base_url',
  apiKey: 'llm:api_key',
  defaultModel: 'llm:default_model',
} as const;

const DEFAULT_LLM_CONFIG: LLMProviderConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  defaultModel: 'deepseek-chat',
};

const PROVIDER_PRESETS: Record<LLMProviderIdentifier, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-20250514' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
};

const DEFAULT_DATABASE_PATH = 'desktop-pet-app.db';

interface MutableAppContainer extends AppContainer {
  llmGateway: LLMGateway;
}

let cachedContainer: MutableAppContainer | null = null;

export async function createAppContainer(
  llmConfig?: LLMProviderConfig,
): Promise<AppContainer> {
  if (cachedContainer) {return cachedContainer;}

  const database = await initializeDatabase(DEFAULT_DATABASE_PATH);
  const settingsRepository = new SettingsRepositoryImpl(database);
  const usageRepository = new UsageRepositoryImpl(database);

  const configToUse = llmConfig ?? await loadLLMConfigFromRepository(settingsRepository);

  cachedContainer = {
    llmGateway: createLLMGateway(configToUse, usageRepository),
    toolExecutor: createToolExecutor(),
    conversationRepository: new ConversationRepositoryImpl(database),
    memoryRepository: new MemoryRepositoryImpl(database),
    usageRepository,
    reminderRepository: new ReminderRepositoryImpl(database),
    todoRepository: new TodoRepositoryImpl(database),
    settingsRepository,
  };

  return cachedContainer;
}

export function getAppContainer(): AppContainer | null {
  return cachedContainer;
}

export async function updateLLMConfigInContainer(config: LLMProviderConfig): Promise<void> {
  if (!cachedContainer) {return;}

  cachedContainer.llmGateway = createLLMGateway(config, cachedContainer.usageRepository);
}

async function loadLLMConfigFromRepository(
  repository: { get(key: string): Promise<string | null> },
): Promise<LLMProviderConfig> {
  try {
    const provider = await repository.get(LLM_CONFIG_KEYS.provider);
    const baseUrl = await repository.get(LLM_CONFIG_KEYS.baseUrl);
    const apiKey = await repository.get(LLM_CONFIG_KEYS.apiKey);
    const defaultModel = await repository.get(LLM_CONFIG_KEYS.defaultModel);

    const validProvider = provider && isValidProvider(provider as LLMProviderIdentifier)
      ? provider as LLMProviderIdentifier
      : DEFAULT_LLM_CONFIG.provider;

    const preset = PROVIDER_PRESETS[validProvider];

    return {
      provider: validProvider,
      baseUrl: baseUrl ?? preset.baseUrl,
      apiKey: apiKey ?? '',
      defaultModel: defaultModel ?? preset.defaultModel,
    };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

function isValidProvider(provider: LLMProviderIdentifier): boolean {
  const validProviders: LLMProviderIdentifier[] = [
    'openai', 'anthropic', 'deepseek', 'moonshot', 'qwen', 'zhipu'
  ];
  return validProviders.includes(provider);
}
