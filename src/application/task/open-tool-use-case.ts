import type { ToolExecutor } from '../../domain/ports/tool-executor.port';

export class OpenToolUseCase {
  constructor(private readonly toolExecutor: ToolExecutor) {}

  async openUrl(url: string): Promise<string> {
    const result = await this.toolExecutor.openUrl(url);
    return result.success
      ? `汪！已经帮你打开 ${url} 啦~`
      : `打开网页失败了：${result.error}`;
  }

  async openApplication(applicationName: string): Promise<string> {
    const result = await this.toolExecutor.openApplication(applicationName);
    return result.success
      ? `汪！${applicationName} 已经打开啦~`
      : `打开应用失败了：${result.error}`;
  }

  async openFolder(folderPath: string): Promise<string> {
    const result = await this.toolExecutor.openFolder(folderPath);
    return result.success
      ? `汪！文件夹已经打开啦~`
      : `打开文件夹失败了：${result.error}`;
  }
}
