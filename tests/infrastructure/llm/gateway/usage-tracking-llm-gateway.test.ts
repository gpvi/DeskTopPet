import { describe, expect, it, vi } from 'vitest';
import { UsageTrackingLLMGateway } from '../../../../src/infrastructure/llm/gateway/usage-tracking-llm-gateway';
import type { LLMGateway } from '../../../../src/domain/ports/llm-gateway.port';
import type { UsageRepository } from '../../../../src/domain/ports/usage-repository.port';

function createDelegate(): LLMGateway {
  return {
    completeChat: vi.fn(),
    classifyIntent: vi.fn(),
  };
}

function createUsageRepository(): UsageRepository {
  return {
    save: vi.fn(),
    queryDailyTrend: vi.fn(),
  };
}

describe('UsageTrackingLLMGateway', () => {
  it('records usage after chat completion', async () => {
    const delegate = createDelegate();
    const usageRepository = createUsageRepository();
    vi.mocked(delegate.completeChat).mockResolvedValue({
      content: 'hello',
      provider: 'deepseek',
      model: 'deepseek-chat',
      inputTokens: 11,
      outputTokens: 7,
    });

    const gateway = new UsageTrackingLLMGateway(delegate, usageRepository);

    await gateway.completeChat({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'deepseek-chat',
      feature: 'chat',
      sessionId: 'session-1',
      taskId: 'task-1',
    });

    expect(usageRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        taskId: 'task-1',
        provider: 'deepseek',
        model: 'deepseek-chat',
        feature: 'chat',
        inputTokens: 11,
        outputTokens: 7,
      }),
    );
  });

  it('records usage after intent classification', async () => {
    const delegate = createDelegate();
    const usageRepository = createUsageRepository();
    vi.mocked(delegate.classifyIntent).mockResolvedValue({
      intent: 'task',
      confidence: 0.92,
      provider: 'deepseek',
      model: 'deepseek-chat',
      inputTokens: 13,
      outputTokens: 3,
    });

    const gateway = new UsageTrackingLLMGateway(delegate, usageRepository);

    await gateway.classifyIntent({
      message: 'remind me',
      sessionId: 'session-2',
      feature: 'intent_classification',
      taskId: 'intent-task',
    });

    expect(usageRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-2',
        taskId: 'intent-task',
        provider: 'deepseek',
        model: 'deepseek-chat',
        feature: 'intent_classification',
        inputTokens: 13,
        outputTokens: 3,
      }),
    );
  });
});
