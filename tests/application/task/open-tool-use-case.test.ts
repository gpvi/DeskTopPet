import { describe, expect, it, vi } from 'vitest';
import type { ToolExecutor } from '../../../src/domain/ports/tool-executor.port';
import { OpenToolUseCase } from '../../../src/application/task/open-tool-use-case';

function createToolExecutorMock(): ToolExecutor {
  return {
    openUrl: vi.fn(),
    openApplication: vi.fn(),
    openFolder: vi.fn(),
    readClipboard: vi.fn(),
  };
}

describe('OpenToolUseCase', () => {
  it('returns success message when openUrl succeeds', async () => {
    const toolExecutor = createToolExecutorMock();
    vi.mocked(toolExecutor.openUrl).mockResolvedValue({ success: true });
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openUrl('https://example.com');

    expect(result).toBe('汪！已经帮你打开 https://example.com 啦~');
    expect(toolExecutor.openUrl).toHaveBeenCalledWith('https://example.com');
  });

  it('returns failure message when openApplication fails', async () => {
    const toolExecutor = createToolExecutorMock();
    vi.mocked(toolExecutor.openApplication).mockResolvedValue({
      success: false,
      error: 'not found',
    });
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openApplication('Calculator');

    expect(result).toBe('打开应用失败了：not found');
    expect(toolExecutor.openApplication).toHaveBeenCalledWith('Calculator');
  });
});
