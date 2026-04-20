import type { AppContainer } from './composition-root';

/**
 * Factory function that wires all port interfaces to their stub implementations.
 *
 * Stub implementations log a warning so developers know a real adapter is needed.
 * Replace each stub with an actual infrastructure adapter during integration.
 */
export function createAppContainer(): AppContainer {
  return {
    llmGateway: {
      async completeChat() {
        console.warn('[Stub] LLMGateway.completeChat — no adapter registered');
        throw new Error('LLMGateway adapter not implemented');
      },
      async classifyIntent() {
        console.warn('[Stub] LLMGateway.classifyIntent — no adapter registered');
        throw new Error('LLMGateway adapter not implemented');
      },
    },

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

    conversationRepository: {
      async saveSession() {
        console.warn('[Stub] ConversationRepository.saveSession — no adapter registered');
      },
      async findSessionById() {
        console.warn('[Stub] ConversationRepository.findSessionById — no adapter registered');
        return null;
      },
      async saveMessage() {
        console.warn('[Stub] ConversationRepository.saveMessage — no adapter registered');
      },
      async findMessagesBySession() {
        console.warn('[Stub] ConversationRepository.findMessagesBySession — no adapter registered');
        return [];
      },
    },

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
