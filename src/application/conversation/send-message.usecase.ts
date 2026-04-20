import type { ConversationMessage } from '../../domain/entities/conversation-message';
import type { LLMGateway } from '../../domain/ports/llm-gateway.port';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.port';
import type { ChatCompletionRequest } from '../../interfaces/dto';

export interface SendMessageRequest {
  readonly userText: string;
  readonly sessionId: string;
  readonly model: string;
}

export interface SendMessageResponse {
  readonly assistantMessage: ConversationMessage;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export class SendMessageUseCase {
  constructor(
    private readonly llmGateway: LLMGateway,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    const userMessage = this.createUserMessage(request.userText, request.sessionId);
    await this.conversationRepository.saveMessage(userMessage);

    const completionResponse = await this.requestChatCompletion(
      request.sessionId,
      request.model,
    );

    const assistantMessage = this.createAssistantMessage(
      completionResponse.content,
      request.sessionId,
    );
    await this.conversationRepository.saveMessage(assistantMessage);

    return {
      assistantMessage,
      inputTokens: completionResponse.inputTokens,
      outputTokens: completionResponse.outputTokens,
    };
  }

  private createUserMessage(text: string, sessionId: string): ConversationMessage {
    return {
      messageId: crypto.randomUUID(),
      sessionId,
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
  }

  private async requestChatCompletion(
    sessionId: string,
    model: string,
  ) {
    const history = await this.conversationRepository.findMessagesBySession(sessionId);
    const completionRequest = this.buildCompletionRequest(history, model);
    return this.llmGateway.completeChat(completionRequest);
  }

  private buildCompletionRequest(
    history: ConversationMessage[],
    model: string,
  ): ChatCompletionRequest {
    return {
      messages: history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      model,
    };
  }

  private createAssistantMessage(content: string, sessionId: string): ConversationMessage {
    return {
      messageId: crypto.randomUUID(),
      sessionId,
      role: 'assistant',
      content,
      createdAt: new Date(),
    };
  }
}
