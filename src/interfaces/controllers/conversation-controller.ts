import type { AppContainer } from '../../app/composition-root/composition-root';
import type { ChatState } from '../../ui/chat-panel/types';
import { SendMessageUseCase } from '../../application/conversation/send-message.usecase';

export interface ConversationPresenter {
  displayUserMessage(content: string): void;
  displayAssistantMessage(content: string): void;
  displayLoadingState(): void;
  displayError(errorMessage: string): void;
}

export class ConversationController {
  private readonly sendMessageUseCase: SendMessageUseCase;
  private activeSessionId: string;

  constructor(
    private readonly appContainer: AppContainer,
    private readonly chatStore: ChatState,
    private readonly defaultModel: string,
  ) {
    this.sendMessageUseCase = new SendMessageUseCase(
      appContainer.llmGateway,
      appContainer.conversationRepository,
    );
    this.activeSessionId = crypto.randomUUID();
  }

  async handleUserMessage(userText: string): Promise<void> {
    this.chatStore.addMessage({
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    });

    this.chatStore.setTyping(true);

    await this.processAndRespond(userText);
  }

  private async processAndRespond(userText: string): Promise<void> {
    try {
      const response = await this.sendMessageUseCase.execute({
        userText,
        sessionId: this.activeSessionId,
        model: this.defaultModel,
      });

      this.chatStore.addMessage({
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: Date.now(),
      });
    } catch (error: unknown) {
      this.reportErrorToChat(error);
    } finally {
      this.chatStore.setTyping(false);
    }
  }

  private reportErrorToChat(error: unknown): void {
    const failureMessage = this.extractErrorMessage(error);
    this.chatStore.addMessage({
      role: 'assistant',
      content: `抱歉，出了点问题：${failureMessage}`,
      timestamp: Date.now(),
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return '未知错误，请稍后重试';
  }
}
