import type { ToolExecutor } from '../../domain/ports/tool-executor.port';

export interface OpenToolSecurityPolicy {
  readonly allowedApplications: ReadonlyArray<string>;
  readonly allowedFolderPrefixes: ReadonlyArray<string>;
}

const DEFAULT_SECURITY_POLICY: OpenToolSecurityPolicy = {
  allowedApplications: [
    'notepad',
    'calc',
    'calculator',
    'chrome',
    'msedge',
    'firefox',
    'code',
    'explorer',
    'wechat',
    'qq',
    'powershell',
    'cmd',
    'terminal',
  ],
  allowedFolderPrefixes: [
    'c:\\users\\',
    'd:\\users\\',
    'e:\\projects\\',
    '/users/',
    '/home/',
  ],
};

export class OpenToolUseCase {
  constructor(
    private readonly toolExecutor: ToolExecutor,
    private readonly securityPolicy: OpenToolSecurityPolicy = DEFAULT_SECURITY_POLICY,
  ) {}

  async openUrl(url: string): Promise<string> {
    const validationError = this.validateUrl(url);
    if (validationError) {
      return `打开网页失败了：${validationError}`;
    }

    const result = await this.toolExecutor.openUrl(url);
    return result.success
      ? `汪！已经帮你打开 ${url} 啦~`
      : `打开网页失败了：${result.error}`;
  }

  async openApplication(applicationName: string): Promise<string> {
    const validationError = this.validateApplicationName(applicationName);
    if (validationError) {
      return `打开应用失败了：${validationError}`;
    }

    const result = await this.toolExecutor.openApplication(applicationName);
    return result.success
      ? `汪！${applicationName} 已经打开啦~`
      : `打开应用失败了：${result.error}`;
  }

  async openFolder(folderPath: string): Promise<string> {
    const validationError = this.validateFolderPath(folderPath);
    if (validationError) {
      return `打开文件夹失败了：${validationError}`;
    }

    const result = await this.toolExecutor.openFolder(folderPath);
    return result.success
      ? `汪！文件夹已经打开啦~`
      : `打开文件夹失败了：${result.error}`;
  }

  private validateUrl(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) {return 'URL 不能为空';}
    if (trimmed.length > 2048) {return 'URL 过长';}

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '仅允许打开 http/https 网页';
      }
      return null;
    } catch {
      return 'URL 格式不合法';
    }
  }

  private validateApplicationName(applicationName: string): string | null {
    const trimmed = applicationName.trim();
    if (!trimmed) {return '应用名称不能为空';}
    if (!/^[\p{L}\p{N}_ .-]+$/u.test(trimmed)) {
      return '应用名称包含非法字符';
    }

    const normalized = trimmed.toLowerCase().replace(/\.exe$/u, '');
    const inWhitelist = this.securityPolicy.allowedApplications
      .some((candidate) => candidate.toLowerCase() === normalized);

    if (!inWhitelist) {
      return '应用未在安全白名单中';
    }

    return null;
  }

  private validateFolderPath(folderPath: string): string | null {
    const trimmed = folderPath.trim();
    if (!trimmed) {return '文件夹路径不能为空';}
    if (!this.isAbsolutePath(trimmed)) {return '仅允许绝对路径';}
    if (trimmed.includes('..')) {return '不允许使用路径回退';}
    if (/[;&|`$><]/u.test(trimmed)) {return '路径包含高风险字符';}

    const normalized = trimmed.replace(/\//gu, '\\').toLowerCase();
    const inWhitelist = this.securityPolicy.allowedFolderPrefixes
      .map((prefix) => prefix.replace(/\//gu, '\\').toLowerCase())
      .some((prefix) => normalized.startsWith(prefix));

    if (!inWhitelist) {
      return '文件夹不在安全白名单范围内';
    }

    return null;
  }

  private isAbsolutePath(path: string): boolean {
    return /^[a-z]:\\/iu.test(path) || path.startsWith('\\\\') || path.startsWith('/');
  }
}
