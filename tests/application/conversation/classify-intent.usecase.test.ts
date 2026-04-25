import { describe, expect, it, vi } from 'vitest';
import { ClassifyIntentUseCase } from '../../../src/application/conversation/classify-intent.usecase';
import type { LLMGateway } from '../../../src/domain/ports/llm-gateway.port';

function createLlmGatewayMock(): LLMGateway {
  return {
    completeChat: vi.fn(),
    classifyIntent: vi.fn(),
  };
}

describe('ClassifyIntentUseCase', () => {
  it('returns a valid task decision when the LLM responds with valid JSON', async () => {
    const llmGateway = createLlmGatewayMock();
    vi.mocked(llmGateway.completeChat).mockResolvedValue({
      content: '```json\n{"intent":"open_url","confidence":0.93,"parameters":{"url":"https://example.com"}}\n```',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 20,
      outputTokens: 8,
    });

    const useCase = new ClassifyIntentUseCase(llmGateway);
    const result = await useCase.execute({
      message: '打开 example 网站',
      model: 'gpt-4o-mini',
    });

    expect(result).toEqual({
      intent: 'open_url',
      confidence: 0.93,
      extractedParameters: {
        url: 'https://example.com',
      },
    });
    expect(llmGateway.completeChat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: '打开 example 网站' }),
        ],
        model: 'gpt-4o-mini',
        temperature: 0,
        maxTokens: 256,
        feature: 'intent_classification',
      }),
    );
  });

  it('falls back to chat when the LLM returns invalid or unsupported structure', async () => {
    const llmGateway = createLlmGatewayMock();
    vi.mocked(llmGateway.completeChat).mockResolvedValue({
      content: '{ "intent": "not_supported", "confidence": 2 }',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 11,
      outputTokens: 3,
    });

    const useCase = new ClassifyIntentUseCase(llmGateway);
    const result = await useCase.execute({
      message: '随便聊聊',
    });

    expect(result).toEqual({
      intent: 'chat',
      confidence: 0,
    });
  });

  it('falls back to chat when the LLM response is not valid JSON', async () => {
    const llmGateway = createLlmGatewayMock();
    vi.mocked(llmGateway.completeChat).mockResolvedValue({
      content: 'sorry, I cannot classify this',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 4,
      outputTokens: 2,
    });

    const useCase = new ClassifyIntentUseCase(llmGateway);
    const result = await useCase.execute({
      message: '再来一个',
      model: 'gpt-4o-mini',
    });

    expect(result).toEqual({
      intent: 'chat',
      confidence: 0,
    });
  });

  it('falls back to chat when gateway throws error', async () => {
    const llmGateway = createLlmGatewayMock();
    vi.mocked(llmGateway.completeChat).mockRejectedValue(new Error('gateway unavailable'));

    const useCase = new ClassifyIntentUseCase(llmGateway);
    const result = await useCase.execute({
      message: '帮我打开浏览器',
      model: 'gpt-4o-mini',
    });

    expect(result).toEqual({
      intent: 'chat',
      confidence: 0,
    });
  });
});
