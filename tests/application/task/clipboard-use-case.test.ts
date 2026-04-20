import { describe, expect, it, vi } from 'vitest';
import { ClipboardUseCase } from '../../../src/application/task/clipboard-use-case';
import type { LLMGateway } from '../../../src/domain/ports/llm-gateway.port';
import type { ToolExecutor } from '../../../src/domain/ports/tool-executor.port';

function createToolExecutorMock(): ToolExecutor {
  return {
    openUrl: vi.fn(),
    openApplication: vi.fn(),
    openFolder: vi.fn(),
    readClipboard: vi.fn(),
  };
}

function createLlmGatewayMock(): LLMGateway {
  return {
    completeChat: vi.fn(),
    classifyIntent: vi.fn(),
  };
}

describe('ClipboardUseCase', () => {
  it('returns permission message when clipboard reading fails', async () => {
    const toolExecutor = createToolExecutorMock();
    const llmGateway = createLlmGatewayMock();
    vi.mocked(toolExecutor.readClipboard).mockResolvedValue({ success: false });
    const useCase = new ClipboardUseCase(toolExecutor, llmGateway);

    const result = await useCase.processClipboard('summarize', 'gpt-4o-mini');

    expect(result).toBe('读取剪贴板失败了，请检查权限设置~');
    expect(llmGateway.completeChat).not.toHaveBeenCalled();
  });

  it('returns empty clipboard message when text is blank', async () => {
    const toolExecutor = createToolExecutorMock();
    const llmGateway = createLlmGatewayMock();
    vi.mocked(toolExecutor.readClipboard).mockResolvedValue({
      success: true,
      data: { text: '   ' },
    });
    const useCase = new ClipboardUseCase(toolExecutor, llmGateway);

    const result = await useCase.processClipboard('rewrite', 'gpt-4o-mini');

    expect(result).toBe('剪贴板是空的，先复制一些内容再试试吧~');
    expect(llmGateway.completeChat).not.toHaveBeenCalled();
  });

  it('sends prompt to llm and returns processed content', async () => {
    const toolExecutor = createToolExecutorMock();
    const llmGateway = createLlmGatewayMock();
    vi.mocked(toolExecutor.readClipboard).mockResolvedValue({
      success: true,
      data: { text: 'hello world' },
    });
    vi.mocked(llmGateway.completeChat).mockResolvedValue({
      content: 'summary result',
      provider: 'mock-provider',
      model: 'gpt-4o-mini',
      inputTokens: 10,
      outputTokens: 5,
    });
    const useCase = new ClipboardUseCase(toolExecutor, llmGateway);

    const result = await useCase.processClipboard('summarize', 'gpt-4o-mini');

    expect(result).toBe('summary result');
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(vi.mocked(llmGateway.completeChat).mock.calls[0]?.[0]).toMatchObject({
      model: 'gpt-4o-mini',
      messages: [
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ],
    });
  });
});
