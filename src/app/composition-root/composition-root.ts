import type {
  LLMGateway,
  ToolExecutor,
  ConversationRepository,
  MemoryRepository,
  UsageRepository,
} from '../../domain/ports';

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
}
