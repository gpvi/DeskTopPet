import type { ToolExecutor } from '../../domain/ports/tool-executor.port';
import type { LLMGateway } from '../../domain/ports/llm-gateway.port';
import type { ClipboardAction } from './clipboard-prompts';
import { buildClipboardPrompt } from './clipboard-prompts';

const EMPTY_CLIPBOARD_ERROR = '剪贴板是空的，先复制一些内容再试试吧~';

export class ClipboardUseCase {
  constructor(
    private readonly toolExecutor: ToolExecutor,
    private readonly llmGateway: LLMGateway,
  ) {}

  async processClipboard(
    action: ClipboardAction,
    model: string,
    targetLanguage?: string,
  ): Promise<string> {
    const clipboardResult = await this.toolExecutor.readClipboard();

    if (!clipboardResult.success || !clipboardResult.data) {
      return '读取剪贴板失败了，请检查权限设置~';
    }

    const clipboardText = (clipboardResult.data as { text: string }).text;
    if (!clipboardText || clipboardText.trim().length === 0) {
      return EMPTY_CLIPBOARD_ERROR;
    }

    return this.processWithModel(action, clipboardText, model, targetLanguage);
  }

  private async processWithModel(
    action: ClipboardAction,
    clipboardText: string,
    model: string,
    targetLanguage?: string,
  ): Promise<string> {
    const prompts = buildClipboardPrompt(action, clipboardText, targetLanguage);
    const response = await this.llmGateway.completeChat({
      messages: [
        { role: 'system', content: prompts.systemPrompt },
        { role: 'user', content: prompts.userPrompt },
      ],
      model,
    });
    return response.content;
  }
}
