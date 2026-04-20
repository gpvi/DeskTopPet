import OpenAI from 'openai';
import type { LLMGateway } from '../../../domain/ports/llm-gateway.port';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  IntentClassificationRequest,
  IntentClassificationResponse,
} from '../../../interfaces/dto';
import type { LLMProviderConfig } from '../provider-config';
import { LLMGatewayError } from '../../../shared/errors/llm-gateway-error';

/**
 * Adapter that implements LLMGateway using the OpenAI-compatible chat
 * completion API. Works with any provider that exposes an OpenAI-compatible
 * endpoint (DeepSeek, Moonshot, Qwen, Zhipu, etc.) via a custom baseUrl.
 */
export class OpenAICompatibleProvider implements LLMGateway {
  private readonly client: OpenAI;
  private readonly providerName: string;
  private readonly defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.providerName = config.provider;
    this.defaultModel = config.defaultModel;
  }

  async completeChat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await this.sendChatCompletion(request);
      return this.extractCompletionResponse(response);
    } catch (error) {
      throw this.wrapAsGatewayError(error);
    }
  }

  async classifyIntent(
    request: IntentClassificationRequest,
  ): Promise<IntentClassificationResponse> {
    try {
      const completionRequest =
        this.buildIntentClassificationRequest(request);
      const response =
        await this.sendChatCompletion(completionRequest);
      const content = this.extractContentFromResponse(response);
      return this.parseIntentClassification(content);
    } catch (error) {
      throw this.wrapAsGatewayError(error);
    }
  }

  private async sendChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<OpenAI.ChatCompletion> {
    return this.client.chat.completions.create({
      model: request.model ?? this.defaultModel,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });
  }

  private extractCompletionResponse(
    response: OpenAI.ChatCompletion,
  ): ChatCompletionResponse {
    const choice = response.choices[0];
    const content = choice?.message?.content ?? '';
    return {
      content,
      provider: this.providerName,
      model: response.model,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }

  private extractContentFromResponse(
    response: OpenAI.ChatCompletion,
  ): string {
    const choice = response.choices[0];
    return choice?.message?.content ?? '';
  }

  private buildIntentClassificationRequest(
    request: IntentClassificationRequest,
  ): ChatCompletionRequest {
    const systemPrompt = this.createIntentClassificationSystemPrompt();
    return {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message },
      ],
      model: this.defaultModel,
      temperature: 0,
    };
  }

  private createIntentClassificationSystemPrompt(): string {
    return [
      'You are an intent classifier for a desktop pet assistant.',
      'Classify the user message into exactly one of: chat, task, question.',
      'Respond ONLY with a JSON object: { "intent": "chat"|"task"|"question", "confidence": 0.0-1.0 }',
    ].join('\n');
  }

  private parseIntentClassification(
    rawContent: string,
  ): IntentClassificationResponse {
    const cleanedContent = this.stripMarkdownFences(rawContent);
    const parsed = this.safelyParseJson(cleanedContent);
    return {
      intent: this.validateIntent(parsed.intent),
      confidence: this.validateConfidence(parsed.confidence),
      parameters: parsed.parameters,
    };
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
      return { intent: 'chat', confidence: 0.5 };
    }
  }

  private validateIntent(
    intent: unknown,
  ): 'chat' | 'task' | 'question' {
    const validIntents = new Set(['chat', 'task', 'question']);
    if (typeof intent === 'string' && validIntents.has(intent)) {
      return intent as 'chat' | 'task' | 'question';
    }
    return 'chat';
  }

  private validateConfidence(confidence: unknown): number {
    if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
      return confidence;
    }
    return 0.5;
  }

  private wrapAsGatewayError(error: unknown): LLMGatewayError {
    if (error instanceof LLMGatewayError) {
      return error;
    }
    const message =
      error instanceof Error ? error.message : 'Unknown LLM gateway error';
    return new LLMGatewayError(message, this.providerName);
  }
}
