import type { ConversationMessage } from '../../domain/entities/conversation-message';
import type { LLMGateway } from '../../domain/ports/llm-gateway.port';
import type { ConversationRepository } from '../../domain/ports/conversation-repository.port';
import type { ChatCompletionRequest } from '../../interfaces/dto';
import type { PersonaPromptAssembler } from './persona-prompt-assembler';

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
    private readonly personaPromptAssembler: PersonaPromptAssembler,
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
    const systemMessage = this.buildSystemMessage();
    const conversationMessages = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    return {
      messages: [systemMessage, ...conversationMessages],
      model,
    };
  }

  private buildSystemMessage(): { readonly role: 'system'; readonly content: string } {
    const runtimeContext = this.createRuntimeContext();
    const systemContent = this.personaPromptAssembler.assembleSystemPrompt(runtimeContext);
    return { role: 'system', content: systemContent };
  }

  private createRuntimeContext() {
    const now = new Date();
    return {
      currentTime: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      currentDate: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
      userName: '',
      petState: 'idle',
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
