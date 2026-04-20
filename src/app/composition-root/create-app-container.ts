import type { AppContainer } from './composition-root';
import type { LLMProviderConfig } from '../../infrastructure/llm/provider-config';
import { createLLMGateway } from '../../infrastructure/llm/gateway/provider-factory';
import { initializeDatabase } from '../../infrastructure/persistence/sqlite/database';
import { ConversationRepositoryImpl } from '../../infrastructure/persistence/repositories/conversation-repository-impl';

const PLACEHOLDER_LLM_CONFIG: LLMProviderConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'PLACEHOLDER_API_KEY',
  defaultModel: 'deepseek-chat',
};

/**
 * Factory function that wires all port interfaces to concrete implementations.
 *
 * Infrastructure adapters are resolved here at bootstrap time. Stubs remain
 * for ports that have not yet been integrated.
 */
export async function createAppContainer(
  llmConfig: LLMProviderConfig = PLACEHOLDER_LLM_CONFIG,
): Promise<AppContainer> {
  const database = await initializeDatabase(':memory:');
  const conversationRepository = new ConversationRepositoryImpl(database);

  return {
    llmGateway: createLLMGateway(llmConfig),

    toolExecutor: {
      async openUrl() {
        console.warn('[Stub] ToolExecutor.openUrl — no adapter registered');
        return { success: false, error: 'ToolExecutor adapter not implemented' };
      },
      async openApplication() {
        console.warn('[Stub] ToolExecutor.openApplication — no adapter registered');
        return { success: false, error: 'ToolExecutor adapter not implemented' };
      },
      async openFolder() {
        console.warn('[Stub] ToolExecutor.openFolder — no adapter registered');
        return { success: false, error: 'ToolExecutor adapter not implemented' };
      },
      async readClipboard() {
        console.warn('[Stub] ToolExecutor.readClipboard — no adapter registered');
        return { success: false, error: 'ToolExecutor adapter not implemented' };
      },
    },

    conversationRepository,

    memoryRepository: {
      async save() {
        console.warn('[Stub] MemoryRepository.save — no adapter registered');
      },
      async findByUser() {
        console.warn('[Stub] MemoryRepository.findByUser — no adapter registered');
        return [];
      },
      async findRelevant() {
        console.warn('[Stub] MemoryRepository.findRelevant — no adapter registered');
        return [];
      },
      async delete() {
        console.warn('[Stub] MemoryRepository.delete — no adapter registered');
      },
      async clearByUser() {
        console.warn('[Stub] MemoryRepository.clearByUser — no adapter registered');
      },
    },

    usageRepository: {
      async save() {
        console.warn('[Stub] UsageRepository.save — no adapter registered');
      },
      async queryDailyTrend() {
        console.warn('[Stub] UsageRepository.queryDailyTrend — no adapter registered');
        return [];
      },
    },
  };
}
