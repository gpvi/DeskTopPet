import type { LLMGateway } from '../../../domain/ports/llm-gateway.port';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  IntentClassificationRequest,
  IntentClassificationResponse,
} from '../../../interfaces/dto';
import type { LLMProviderConfig } from '../provider-config';
import { OpenAICompatibleProvider } from '../providers/openai-compatible-provider';

/**
 * Concrete LLMGateway that delegates to a single provider adapter.
 *
 * Currently all supported providers share the OpenAI-compatible adapter,
 * differing only by config. New provider types can be added by switching
 * on config.provider in the future.
 */
export class LLMGatewayImpl implements LLMGateway {
  private readonly delegate: LLMGateway;

  constructor(config: LLMProviderConfig) {
    this.delegate = this.createDelegateProvider(config);
  }

  async completeChat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return this.delegate.completeChat(request);
  }

  async classifyIntent(
    request: IntentClassificationRequest,
  ): Promise<IntentClassificationResponse> {
    return this.delegate.classifyIntent(request);
  }

  private createDelegateProvider(
    config: LLMProviderConfig,
  ): LLMGateway {
    return new OpenAICompatibleProvider(config);
  }
}
