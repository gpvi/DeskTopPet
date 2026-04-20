import type { LLMGateway } from '../../domain/ports/llm-gateway.port';
import type { ChatCompletionRequest } from '../../interfaces/dto';
import type {
  IntentClassificationResult,
  UserIntent,
} from './intent-types';

const VALID_INTENTS: ReadonlySet<string> = new Set<string>([
  'chat',
  'set_reminder',
  'open_url',
  'open_application',
  'open_folder',
  'read_clipboard',
  'manage_todo',
  'ask_question',
]);

const CHAT_FALLBACK: IntentClassificationResult = {
  intent: 'chat',
  confidence: 0,
} as const;

export interface ClassifyIntentRequest {
  readonly message: string;
  readonly model?: string;
}

export class ClassifyIntentUseCase {
  constructor(private readonly llmGateway: LLMGateway) {}

  async execute(request: ClassifyIntentRequest): Promise<IntentClassificationResult> {
    const completionRequest = this.buildClassificationRequest(request.message, request.model);
    const response = await this.llmGateway.completeChat(completionRequest);
    return this.parseClassificationResponse(response.content);
  }

  private buildClassificationRequest(message: string, model?: string): ChatCompletionRequest {
    return {
      messages: [
        { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      model,
      temperature: 0,
      maxTokens: 256,
    };
  }

  private parseClassificationResponse(rawContent: string): IntentClassificationResult {
    const cleanedContent = this.stripMarkdownFences(rawContent);
    const parsed = this.safelyParseJson(cleanedContent);
    return this.buildResult(parsed);
  }

  private stripMarkdownFences(content: string): string {
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  private safelyParseJson(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private buildResult(parsed: Record<string, unknown>): IntentClassificationResult {
    const intent = this.validateIntent(parsed.intent);
    if (intent === 'chat') {
      return CHAT_FALLBACK;
    }
    return {
      intent,
      confidence: this.extractConfidence(parsed.confidence),
      extractedParameters: this.extractParameters(parsed.parameters),
    };
  }

  private validateIntent(rawValue: unknown): UserIntent {
    if (typeof rawValue === 'string' && VALID_INTENTS.has(rawValue)) {
      return rawValue as UserIntent;
    }
    return 'chat';
  }

  private extractConfidence(rawValue: unknown): number {
    if (typeof rawValue === 'number' && rawValue >= 0 && rawValue <= 1) {
      return rawValue;
    }
    return 0.5;
  }

  private extractParameters(rawValue: unknown): Record<string, string> | undefined {
    if (typeof rawValue !== 'object' || rawValue === null) {
      return undefined;
    }
    const parameters = this.stringifyParameterValues(rawValue as Record<string, unknown>);
    return Object.keys(parameters).length > 0 ? parameters : undefined;
  }

  private stringifyParameterValues(parameters: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  }
}

const CLASSIFICATION_SYSTEM_PROMPT = [
  '你是一个桌面宠物助手（金毛犬）的意图分类器。',
  '根据用户消息，判断意图类型。只返回 JSON，不要其他文字。',
  '',
  '可选意图：',
  '- chat：闲聊、打招呼、情感交流、开玩笑',
  '- ask_question：知识问答、询问信息',
  '- set_reminder：设置提醒、定时提醒',
  '- open_url：打开网页、网址',
  '- open_application：打开应用程序（如微信、记事本）',
  '- open_folder：打开文件夹、目录',
  '- read_clipboard：读取剪贴板内容',
  '- manage_todo：管理待办事项（添加、删除、查看、完成）',
  '',
  '返回格式：{ "intent": "意图类型", "confidence": 0.0-1.0, "parameters": { "key": "value" } }',
  'parameters 中提取关键信息，如 url、application_name、folder_path、reminder_text、todo_action 等。',
  '如果不确定，返回 "chat"。',
].join('\n');
