import type { ModelUsageRecord } from '../../../domain/entities/model-usage-record';
import type { LLMGateway } from '../../../domain/ports/llm-gateway.port';
import type { UsageRepository } from '../../../domain/ports/usage-repository.port';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  IntentClassificationRequest,
  IntentClassificationResponse,
} from '../../../interfaces/dto';

type UsageContext = {
  readonly feature?: string;
  readonly sessionId?: string;
  readonly taskId?: string;
};

type UsageBearingResponse = {
  readonly provider?: string;
  readonly model?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
};

/**
 * Decorates an LLM gateway with usage persistence without leaking
 * UsageRepository into application use cases.
 */
export class UsageTrackingLLMGateway implements LLMGateway {
  constructor(
    private readonly delegate: LLMGateway,
    private readonly usageRepository: UsageRepository,
  ) {}

  async completeChat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    const response = await this.delegate.completeChat(request);
    await this.recordUsage(request, response, 'completeChat');
    return response;
  }

  async classifyIntent(
    request: IntentClassificationRequest,
  ): Promise<IntentClassificationResponse> {
    const response = await this.delegate.classifyIntent(request);
    await this.recordUsage(request, response, 'classifyIntent');
    return response;
  }

  private async recordUsage(
    request: UsageContext,
    response: UsageBearingResponse,
    fallbackFeature: string,
  ): Promise<void> {
    const record: ModelUsageRecord = {
      usageId: createUsageId(),
      sessionId: request.sessionId ?? 'unknown-session',
      taskId: request.taskId ?? 'unscoped-task',
      provider: response.provider ?? 'unknown-provider',
      model: response.model ?? 'unknown-model',
      feature: request.feature ?? fallbackFeature,
      inputTokens: response.inputTokens ?? 0,
      outputTokens: response.outputTokens ?? 0,
      createdAt: new Date(),
    };

    await this.usageRepository.save(record);
  }
}

function createUsageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `usage-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
