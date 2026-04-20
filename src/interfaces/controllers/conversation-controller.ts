import type { AppContainer } from '../../app/composition-root/composition-root';
import type { ChatState } from '../../ui/chat-panel/types';
import type { PetPersona } from '../../domain/entities/pet-persona';
import { SendMessageUseCase } from '../../application/conversation/send-message.usecase';
import { PersonaPromptAssembler } from '../../application/conversation/persona-prompt-assembler';
import { ClassifyIntentUseCase } from '../../application/conversation/classify-intent.usecase';
import { IntentRouter } from '../../application/conversation/intent-router';

export interface ConversationPresenter {
  displayUserMessage(content: string): void;
  displayAssistantMessage(content: string): void;
  displayLoadingState(): void;
  displayError(errorMessage: string): void;
}

const DEFAULT_GOLDEN_RETRIEVER_PERSONA: PetPersona = {
  personaId: 'golden-retriever-default',
  name: 'Buddy',
  species: '金毛犬',
  traits: ['温暖', '忠诚', '聪明', '可靠', '亲近', '克制'],
  toneRules: {
    defaultTone: '简洁、温暖、自然、轻松，像一只聪明懂事的金毛犬伙伴在陪用户说话',
    contextOverrides: [
      { context: '日常聊天', tone: '轻松自然，有陪伴感，不要长篇大论' },
      { context: '任务执行', tone: '直接、清楚、可靠，先说重点再补充说明' },
      { context: '安抚陪伴', tone: '温和稳定，先接住情绪，再给出轻量的下一步建议' },
      { context: '主动提醒', tone: '短、小、准、低打扰，像懂分寸的金毛犬轻轻提醒' },
    ],
  },
  behaviorRules: [
    { trigger: '理解优先', action: '先理解用户意图，再回应' },
    { trigger: '任务明确时', action: '快速进入执行辅助状态' },
    { trigger: '任务不明确时', action: '只追问最关键的一个问题' },
    { trigger: '敏感操作', action: '先确认再执行，不替用户做高风险决策' },
    { trigger: '用户完成任务后', action: '给予简短、真诚的积极反馈' },
    { trigger: '默认低打扰', action: '不频繁主动刷存在感，不频繁打断用户工作' },
    { trigger: '知识边界', action: '不装懂，不确定时明确说明' },
  ],
};

export class ConversationController {
  private readonly sendMessageUseCase: SendMessageUseCase;
  private readonly classifyIntentUseCase: ClassifyIntentUseCase;
  private readonly intentRouter: IntentRouter;
  private activeSessionId: string;

  constructor(
    private readonly appContainer: AppContainer,
    private readonly chatStore: ChatState,
    private readonly defaultModel: string,
  ) {
    const personaPromptAssembler = new PersonaPromptAssembler(
      DEFAULT_GOLDEN_RETRIEVER_PERSONA,
    );
    this.sendMessageUseCase = new SendMessageUseCase(
      appContainer.llmGateway,
      appContainer.conversationRepository,
      personaPromptAssembler,
    );
    this.classifyIntentUseCase = new ClassifyIntentUseCase(
      appContainer.llmGateway,
    );
    this.intentRouter = new IntentRouter();
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
      const classification = await this.classifyIntentUseCase.execute({
        message: userText,
        model: this.defaultModel,
      });

      const decision = this.intentRouter.route(classification);

      if (decision.routingType === 'continue_chat') {
        await this.respondWithChat(userText);
      } else {
        this.respondWithTaskPlaceholder(decision.taskName);
      }
    } catch (error: unknown) {
      await this.respondWithFallbackChat(userText, error);
    } finally {
      this.chatStore.setTyping(false);
    }
  }

  private async respondWithChat(userText: string): Promise<void> {
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
  }

  private respondWithTaskPlaceholder(taskName: string): void {
    this.chatStore.addMessage({
      role: 'assistant',
      content: `汪！我知道你想${taskName}，但这个功能还在开发中，很快就来！`,
      timestamp: Date.now(),
    });
  }

  private async respondWithFallbackChat(userText: string, classificationError: unknown): Promise<void> {
    try {
      await this.respondWithChat(userText);
    } catch (chatError: unknown) {
      this.reportErrorToChat(classificationError);
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
