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

  it('rejects non http(s) urls before invoking the executor', async () => {
    const toolExecutor = createToolExecutorMock();
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openUrl('ftp://example.com');

    expect(result).toBe('打开网页失败了：仅允许打开 http/https 网页');
    expect(toolExecutor.openUrl).not.toHaveBeenCalled();
  });

  it('rejects blank or suspicious application names before invoking the executor', async () => {
    const toolExecutor = createToolExecutorMock();
    const useCase = new OpenToolUseCase(toolExecutor);

    const blankResult = await useCase.openApplication('   ');
    const suspiciousResult = await useCase.openApplication('Calculator&&rm -rf');

    expect(blankResult).toBe('打开应用失败了：应用名称不能为空');
    expect(suspiciousResult).toBe('打开应用失败了：应用名称包含非法字符');
    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
  });

  it('rejects non absolute folder paths before invoking the executor', async () => {
    const toolExecutor = createToolExecutorMock();
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openFolder('documents/projects');

    expect(result).toBe('打开文件夹失败了：仅允许绝对路径');
    expect(toolExecutor.openFolder).not.toHaveBeenCalled();
  });

  it('rejects application not in whitelist', async () => {
    const toolExecutor = createToolExecutorMock();
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openApplication('regedit');

    expect(result).toBe('打开应用失败了：应用未在安全白名单中');
    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
  });

  it('rejects folder path outside whitelist', async () => {
    const toolExecutor = createToolExecutorMock();
    const useCase = new OpenToolUseCase(toolExecutor);

    const result = await useCase.openFolder('C:\\Windows\\System32');

    expect(result).toBe('打开文件夹失败了：文件夹不在安全白名单范围内');
    expect(toolExecutor.openFolder).not.toHaveBeenCalled();
  });
});
