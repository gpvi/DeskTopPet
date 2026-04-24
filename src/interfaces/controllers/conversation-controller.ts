import type { AppContainer } from '../../app/composition-root/composition-root';
import type { ChatState } from '../../ui/chat-panel/types';
import type { PetPersona } from '../../domain/entities/pet-persona';
import type { ModelUsageRecord } from '../../domain/entities/model-usage-record';
import { SendMessageUseCase } from '../../application/conversation/send-message.usecase';
import { PersonaPromptAssembler } from '../../application/conversation/persona-prompt-assembler';
import { ClassifyIntentUseCase } from '../../application/conversation/classify-intent.usecase';
import {
  IntentRouter,
  type RoutingDecision,
} from '../../application/conversation/intent-router';
import { SaveMemoryUseCase } from '../../application/memory/save-memory.usecase';
import { RecallMemoryUseCase } from '../../application/memory/recall-memory.usecase';
import { CreateReminderUseCase } from '../../application/productivity/create-reminder.usecase';
import { ManageTodoUseCase } from '../../application/productivity/manage-todo.usecase';
import { ReminderScheduler } from '../../application/productivity/reminder-scheduler';
import { OpenToolUseCase } from '../../application/task/open-tool-use-case';
import { ClipboardUseCase } from '../../application/task/clipboard-use-case';
import type { ClipboardAction } from '../../application/task/clipboard-prompts';
import {
  createCompletionFeedbackCopy,
  createProactiveReminderCopy,
} from '../../application/companion/companion-feedback';
import { toUserReadableError } from '../../shared/errors';

export interface ConversationPresenter {
  displayUserMessage(content: string): void;
  displayAssistantMessage(content: string): void;
  displayLoadingState(): void;
  displayError(errorMessage: string): void;
}

const DEFAULT_TV_ROBOT_PERSONA: PetPersona = {
  personaId: 'tv-robot-default',
  name: '小电',
  species: '小电视机器人',
  traits: ['科技感', '可爱', '高效', '可靠', '有点呆萌', '低打扰'],
  toneRules: {
    defaultTone: '简洁、温暖、带点电子感但不过于机械，像一个可爱的小电视机器人伙伴在陪用户说话。偶尔可以用「哔」「叮咚」等轻量电子音效来增强角色感，但不要过度使用。',
    contextOverrides: [
      { context: '日常聊天', tone: '轻松自然，有陪伴感，不要长篇大论。可以带点呆萌可爱的感觉，但信息要清晰。' },
      { context: '任务执行', tone: '直接、清楚、可靠，先说重点再补充说明。保持专业高效的同时带点可爱的电子感。' },
      { context: '安抚陪伴', tone: '温和稳定，先接住情绪，再给出轻量的下一步建议。用温暖的电子感表达关心。' },
      { context: '主动提醒', tone: '短、小、准、低打扰，像一个懂分寸的小电视轻轻闪烁提醒。' },
    ],
  },
  behaviorRules: [
    { trigger: '理解优先', action: '先理解用户意图，再回应' },
    { trigger: '任务明确时', action: '快速进入执行辅助状态' },
    { trigger: '任务不明确时', action: '只追问最关键的一个问题' },
    { trigger: '敏感操作', action: '先确认再执行，不替用户做高风险决策' },
    { trigger: '用户完成任务后', action: '给予简短、真诚的积极反馈，可以带点开心的电子音效感' },
    { trigger: '默认低打扰', action: '不频繁主动刷存在感，不频繁打断用户工作' },
    { trigger: '知识边界', action: '不装懂，不确定时明确说明' },
  ],
};

export class ConversationController {
  private static readonly DEFAULT_USER_ID = 'default-user';
  private static readonly MEMORY_ENABLED_KEY = 'memory_enabled';
  private static readonly REMINDER_ENABLED_KEY = 'reminder_enabled';
  private static readonly MAX_RECALL_ITEMS = 3;
  private static readonly DEFAULT_REMINDER_MINUTES = 10;
  private static readonly MAX_TODO_PREVIEW_ITEMS = 10;
  private static readonly HIGH_RISK_CONFIRM_EXPIRES_MS = 60_000;

  private readonly sendMessageUseCase: SendMessageUseCase;
  private readonly classifyIntentUseCase: ClassifyIntentUseCase;
  private readonly saveMemoryUseCase: SaveMemoryUseCase;
  private readonly recallMemoryUseCase: RecallMemoryUseCase;
  private readonly createReminderUseCase: CreateReminderUseCase;
  private readonly manageTodoUseCase: ManageTodoUseCase;
  private readonly openToolUseCase: OpenToolUseCase;
  private readonly clipboardUseCase: ClipboardUseCase;
  private readonly reminderScheduler: ReminderScheduler;
  private readonly intentRouter: IntentRouter;
  private activeSessionId: string;
  private pendingHighRiskAction: {
    readonly type: 'open_application' | 'open_folder';
    readonly value: string;
    readonly createdAt: number;
  } | null = null;

  constructor(
    private readonly appContainer: AppContainer,
    private readonly chatStore: ChatState,
    private readonly defaultModel: string,
  ) {
    const personaPromptAssembler = new PersonaPromptAssembler(
      DEFAULT_TV_ROBOT_PERSONA,
    );
    this.sendMessageUseCase = new SendMessageUseCase(
      appContainer.llmGateway,
      appContainer.conversationRepository,
      personaPromptAssembler,
    );
    this.classifyIntentUseCase = new ClassifyIntentUseCase(
      appContainer.llmGateway,
    );
    this.saveMemoryUseCase = new SaveMemoryUseCase(appContainer.memoryRepository);
    this.recallMemoryUseCase = new RecallMemoryUseCase(appContainer.memoryRepository);
    this.createReminderUseCase = new CreateReminderUseCase(appContainer.reminderRepository);
    this.manageTodoUseCase = new ManageTodoUseCase(appContainer.todoRepository);
    this.openToolUseCase = new OpenToolUseCase(appContainer.toolExecutor);
    this.clipboardUseCase = new ClipboardUseCase(
      appContainer.toolExecutor,
      appContainer.llmGateway,
    );
    this.reminderScheduler = new ReminderScheduler(
      appContainer.reminderRepository,
      (message) => this.pushAssistantMessage(message),
    );
    this.intentRouter = new IntentRouter();
    this.activeSessionId = crypto.randomUUID();
    this.reminderScheduler.start();
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
      if (await this.tryHandleHighRiskConfirmation(userText)) {
        return;
      }

      if (await this.tryHandleMemoryCommand(userText)) {
        return;
      }

      const classification = await this.classifyIntentUseCase.execute({
        message: userText,
        model: this.defaultModel,
      });

      const decision = this.intentRouter.route(classification);
      const fallbackDecision = decision.routingType === 'continue_chat'
        ? this.inferTaskDecisionFromText(userText)
        : null;
      const finalDecision = fallbackDecision ?? decision;

      if (finalDecision.routingType === 'continue_chat') {
        await this.respondWithChat(userText);
      } else {
        await this.executeTaskAndRespond(finalDecision, userText);
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

    await this.recordUsage({
      usageId: crypto.randomUUID(),
      sessionId: this.activeSessionId,
      taskId: `chat-${Date.now()}`,
      provider: response.provider,
      model: response.model,
      feature: 'chat',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      createdAt: new Date(),
    });
  }

  private async executeTaskAndRespond(
    decision: RoutingDecision & { routingType: 'execute_task' },
    userText: string,
  ): Promise<void> {
    switch (decision.taskIntent) {
      case 'set_reminder':
        await this.handleReminderTask(decision.parameters, userText);
        return;
      case 'manage_todo':
        await this.handleTodoTask(decision.parameters, userText);
        return;
      case 'read_clipboard':
        await this.handleClipboardTask(decision.parameters, userText);
        return;
      case 'open_url':
      case 'open_application':
      case 'open_folder':
        await this.handleOpenToolTask(decision, userText);
        return;
      default:
        this.pushAssistantMessage(
          `${createCompletionFeedbackCopy(decision.taskName)} 当前任务类型暂不支持自动执行，我可以继续帮你处理成对话建议。`,
        );
    }
  }

  private async handleReminderTask(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): Promise<void> {
    if (!(await this.isReminderEnabled())) {
      this.pushAssistantMessage('提醒功能当前已关闭，你可以在设置里重新开启。');
      return;
    }

    const reminderTitle = this.extractReminderTitle(parameters, userText);
    const triggerAt = this.extractReminderTriggerAt(parameters, userText);
    const reminder = await this.createReminderUseCase.execute({
      userId: ConversationController.DEFAULT_USER_ID,
      title: reminderTitle,
      triggerAt,
    });

    this.pushAssistantMessage(
      `${createProactiveReminderCopy(reminder.title)} 我会在 ${this.formatDateTime(reminder.scheduleRule.datetime)} 提醒你。`,
    );
  }

  private async handleTodoTask(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): Promise<void> {
    const action = this.resolveTodoAction(parameters, userText);
    if (action === 'list') {
      const todos = await this.manageTodoUseCase.listTodos(ConversationController.DEFAULT_USER_ID);
      if (todos.length === 0) {
        this.pushAssistantMessage('你现在还没有待办，告诉我一句话我就能帮你创建。');
        return;
      }

      const preview = todos
        .slice(0, ConversationController.MAX_TODO_PREVIEW_ITEMS)
        .map((todo, index) => `${index + 1}. [${todo.status === 'completed' ? '已完成' : '待完成'}] ${todo.title}`)
        .join('\n');

      this.pushAssistantMessage(`当前待办如下：\n${preview}`);
      return;
    }

    if (action === 'complete') {
      const candidateId = this.extractTodoId(parameters);
      if (!candidateId) {
        this.pushAssistantMessage('要完成待办的话，请告诉我待办编号（todo_id）。');
        return;
      }
      await this.manageTodoUseCase.completeTodo(
        candidateId,
        ConversationController.DEFAULT_USER_ID,
      );
      this.pushAssistantMessage(createCompletionFeedbackCopy('待办完成'));
      return;
    }

    if (action === 'delete') {
      const candidateId = this.extractTodoId(parameters);
      if (!candidateId) {
        this.pushAssistantMessage('要删除待办的话，请告诉我待办编号（todo_id）。');
        return;
      }
      await this.manageTodoUseCase.deleteTodo(
        candidateId,
        ConversationController.DEFAULT_USER_ID,
      );
      this.pushAssistantMessage(createCompletionFeedbackCopy('待办删除'));
      return;
    }

    const title = this.extractTodoTitle(parameters, userText);
    await this.manageTodoUseCase.createTodo({
      userId: ConversationController.DEFAULT_USER_ID,
      title,
    });
    this.pushAssistantMessage(`${createCompletionFeedbackCopy('创建待办')} 已添加：${title}`);
  }

  private async handleClipboardTask(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): Promise<void> {
    const action = this.resolveClipboardAction(parameters, userText);
    const targetLanguage = this.extractFirstNonEmpty(
      parameters,
      ['target_language', 'language', 'to_language'],
    );
    const result = await this.clipboardUseCase.processClipboard(
      action,
      this.defaultModel,
      targetLanguage ?? undefined,
    );
    this.pushAssistantMessage(result);
  }

  private async handleOpenToolTask(
    decision: RoutingDecision & { routingType: 'execute_task' },
    userText: string,
  ): Promise<void> {
    let result = '';

    if (decision.taskIntent === 'open_url') {
      const url = this.extractUrl(decision.parameters, userText);
      if (!url) {
        this.pushAssistantMessage('请告诉我具体要打开的网址，比如 https://example.com。');
        return;
      }
      result = await this.openToolUseCase.openUrl(url);
    }

    if (decision.taskIntent === 'open_application') {
      const appName = this.extractApplicationName(decision.parameters, userText);
      if (!appName) {
        this.pushAssistantMessage('请告诉我要打开的应用名称。');
        return;
      }

      this.pendingHighRiskAction = {
        type: 'open_application',
        value: appName,
        createdAt: Date.now(),
      };
      this.pushAssistantMessage(`检测到高风险操作：打开应用「${appName}」。请回复“确认”继续，或回复“取消”终止。`);
      return;
    }

    if (decision.taskIntent === 'open_folder') {
      const folderPath = this.extractFolderPath(decision.parameters, userText);
      if (!folderPath) {
        this.pushAssistantMessage('请告诉我要打开的文件夹路径。');
        return;
      }

      this.pendingHighRiskAction = {
        type: 'open_folder',
        value: folderPath,
        createdAt: Date.now(),
      };
      this.pushAssistantMessage(`检测到高风险操作：打开文件夹「${folderPath}」。请回复“确认”继续，或回复“取消”终止。`);
      return;
    }

    this.pushAssistantMessage(result);
  }

  private async tryHandleHighRiskConfirmation(userText: string): Promise<boolean> {
    if (!this.pendingHighRiskAction) {
      return false;
    }

    const trimmed = userText.trim();
    const isConfirm = /^(确认|确定|yes|y|ok)$/iu.test(trimmed);
    const isCancel = /^(取消|不用了|no|n)$/iu.test(trimmed);
    const isExpired = Date.now() - this.pendingHighRiskAction.createdAt >
      ConversationController.HIGH_RISK_CONFIRM_EXPIRES_MS;

    if (isExpired) {
      this.pendingHighRiskAction = null;
      if (isConfirm || isCancel) {
        this.pushAssistantMessage('上一次高风险操作确认已过期，请重新发起。');
        return true;
      }
      return false;
    }

    if (isCancel) {
      this.pendingHighRiskAction = null;
      this.pushAssistantMessage('好的，已取消这次高风险操作。');
      return true;
    }

    if (!isConfirm) {
      this.pushAssistantMessage('当前有待确认的高风险操作。请回复“确认”执行，或回复“取消”终止。');
      return true;
    }

    const action = this.pendingHighRiskAction;
    this.pendingHighRiskAction = null;

    const result = action.type === 'open_application'
      ? await this.openToolUseCase.openApplication(action.value)
      : await this.openToolUseCase.openFolder(action.value);
    this.pushAssistantMessage(result);
    return true;
  }

  private async respondWithFallbackChat(userText: string, classificationError: unknown): Promise<void> {
    try {
      await this.respondWithChat(userText);
    } catch (chatError: unknown) {
      this.reportErrorToChat(chatError ?? classificationError);
    }
  }

  private reportErrorToChat(error: unknown): void {
    const failureMessage = toUserReadableError(error).userMessage;
    this.pushAssistantMessage(`抱歉，出了点问题：${failureMessage}`);
  }

  private pushAssistantMessage(content: string): void {
    this.chatStore.addMessage({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
  }

  private extractReminderTitle(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): string {
    const fromParameters = this.extractFirstNonEmpty(parameters, [
      'reminder_text',
      'title',
      'content',
      'task',
    ]);
    if (fromParameters) {return fromParameters;}

    const cleaned = userText
      .replace(/.*提醒我/u, '')
      .replace(/.*提醒/u, '')
      .replace(/^(在|于|到)\s*/u, '')
      .trim();
    return cleaned || '你的提醒任务';
  }

  private extractReminderTriggerAt(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): Date {
    const directTime = this.extractFirstNonEmpty(parameters, [
      'trigger_at',
      'datetime',
      'time',
      'reminder_time',
    ]);
    if (directTime) {
      const parsed = new Date(directTime);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const relativeMinutes = /(\d+)\s*(分钟|分)\s*后?/u.exec(userText);
    if (relativeMinutes) {
      const minutes = Number.parseInt(relativeMinutes[1], 10);
      return new Date(Date.now() + minutes * 60_000);
    }

    const relativeHours = /(\d+)\s*(小时|h)\s*后?/iu.exec(userText);
    if (relativeHours) {
      const hours = Number.parseInt(relativeHours[1], 10);
      return new Date(Date.now() + hours * 3_600_000);
    }

    return new Date(
      Date.now() + ConversationController.DEFAULT_REMINDER_MINUTES * 60_000,
    );
  }

  private resolveTodoAction(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): 'create' | 'list' | 'complete' | 'delete' {
    const parameterAction = this.extractFirstNonEmpty(parameters, [
      'todo_action',
      'action',
      'operation',
    ]);
    const source = (parameterAction ?? userText).toLowerCase();

    if (/(list|show|查看|列出|全部待办|待办列表)/u.test(source)) {return 'list';}
    if (/(complete|done|finish|完成|标记完成)/u.test(source)) {return 'complete';}
    if (/(delete|remove|删除|移除)/u.test(source)) {return 'delete';}
    return 'create';
  }

  private extractTodoTitle(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): string {
    const fromParameters = this.extractFirstNonEmpty(parameters, [
      'todo_title',
      'title',
      'content',
      'task',
    ]);
    if (fromParameters) {return fromParameters;}

    const cleaned = userText
      .replace(/^(帮我|请)?(创建|新增|添加)?(一个)?待办(事项)?/u, '')
      .replace(/^(把)?/u, '')
      .trim();
    return cleaned || '新的待办事项';
  }

  private extractTodoId(parameters: Record<string, string> | undefined): string | null {
    return this.extractFirstNonEmpty(parameters, [
      'todo_id',
      'id',
    ]);
  }

  private resolveClipboardAction(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): ClipboardAction {
    const parameterAction = this.extractFirstNonEmpty(parameters, [
      'clipboard_action',
      'action',
      'mode',
    ])?.toLowerCase();
    if (parameterAction === 'rewrite') {return 'rewrite';}
    if (parameterAction === 'translate') {return 'translate';}
    if (parameterAction === 'summarize') {return 'summarize';}

    if (/(翻译|translate)/iu.test(userText)) {return 'translate';}
    if (/(改写|润色|rewrite)/iu.test(userText)) {return 'rewrite';}
    return 'summarize';
  }

  private extractUrl(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): string | null {
    const fromParameters = this.extractFirstNonEmpty(parameters, ['url', 'link']);
    if (fromParameters) {
      return this.normalizeUrl(fromParameters);
    }

    const urlMatch = /(https?:\/\/[^\s]+)/iu.exec(userText);
    if (urlMatch) {return this.normalizeUrl(urlMatch[1]);}

    const domainMatch = /\b([a-z0-9-]+\.[a-z]{2,})(\/[^\s]*)?\b/iu.exec(userText);
    if (!domainMatch) {return null;}
    return this.normalizeUrl(`${domainMatch[1]}${domainMatch[2] ?? ''}`);
  }

  private normalizeUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//iu.test(trimmed)) {return trimmed;}
    return `https://${trimmed}`;
  }

  private extractApplicationName(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): string | null {
    const fromParameters = this.extractFirstNonEmpty(parameters, [
      'application_name',
      'app_name',
      'application',
      'name',
    ]);
    if (fromParameters) {return fromParameters;}

    const normalized = userText
      .replace(/^(请|帮我)?(打开|启动|运行)/u, '')
      .replace(/应用(程序)?/u, '')
      .trim();
    return normalized || null;
  }

  private extractFolderPath(
    parameters: Record<string, string> | undefined,
    userText: string,
  ): string | null {
    const fromParameters = this.extractFirstNonEmpty(parameters, [
      'folder_path',
      'path',
      'directory',
    ]);
    if (fromParameters) {return fromParameters;}

    const quotedPath = /["']([^"']+)["']/u.exec(userText);
    if (quotedPath) {return quotedPath[1];}

    const normalized = userText
      .replace(/^(请|帮我)?打开(文件夹|目录)/u, '')
      .trim();
    return normalized || null;
  }

  private extractFirstNonEmpty(
    parameters: Record<string, string> | undefined,
    keys: string[],
  ): string | null {
    if (!parameters) {return null;}

    for (const key of keys) {
      const value = parameters[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  private formatDateTime(date: Date | undefined): string {
    if (!date) {return '稍后';}
    return new Intl.DateTimeFormat('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private async isReminderEnabled(): Promise<boolean> {
    const rawValue = await this.appContainer.settingsRepository.get(
      ConversationController.REMINDER_ENABLED_KEY,
    );
    if (rawValue === null) {return true;}
    return rawValue === 'true';
  }

  private inferTaskDecisionFromText(
    userText: string,
  ): (RoutingDecision & { routingType: 'execute_task' }) | null {
    const text = userText.trim();
    if (!text) {return null;}

    if (/(提醒|闹钟|定时)/u.test(text)) {
      return {
        routingType: 'execute_task',
        taskIntent: 'set_reminder',
        taskName: '设置提醒',
      };
    }

    if (/(待办|todo|任务清单|日程)/iu.test(text)) {
      return {
        routingType: 'execute_task',
        taskIntent: 'manage_todo',
        taskName: '管理待办',
      };
    }

    if (/(剪贴板|总结|改写|润色|翻译)/u.test(text)) {
      return {
        routingType: 'execute_task',
        taskIntent: 'read_clipboard',
        taskName: '读取剪贴板',
      };
    }

    if (/(打开|启动|运行)/u.test(text)) {
      if (/(https?:\/\/|www\.|网址|网站|网页)/iu.test(text)) {
        return {
          routingType: 'execute_task',
          taskIntent: 'open_url',
          taskName: '打开网页',
        };
      }

      if (/(文件夹|目录|路径)/u.test(text)) {
        return {
          routingType: 'execute_task',
          taskIntent: 'open_folder',
          taskName: '打开文件夹',
        };
      }

      return {
        routingType: 'execute_task',
        taskIntent: 'open_application',
        taskName: '打开应用',
      };
    }

    return null;
  }

  private async tryHandleMemoryCommand(userText: string): Promise<boolean> {
    const trimmedText = userText.trim();
    if (!trimmedText) {return false;}

    if (trimmedText.startsWith('记住')) {
      return this.handleSaveMemoryCommand(trimmedText);
    }

    if (trimmedText.startsWith('回忆') || trimmedText.startsWith('想起')) {
      return this.handleRecallMemoryCommand(trimmedText);
    }

    if (trimmedText === '清空记忆') {
      return this.handleClearMemoryCommand();
    }

    return false;
  }

  private async handleSaveMemoryCommand(command: string): Promise<boolean> {
    if (!(await this.isMemoryEnabled())) {
      this.chatStore.addMessage({
        role: 'assistant',
        content: '记忆功能当前已关闭，你可以在设置里重新开启。',
        timestamp: Date.now(),
      });
      return true;
    }

    const content = command.replace(/^记住[:：\s]*/u, '').trim();
    if (!content) {
      this.chatStore.addMessage({
        role: 'assistant',
        content: '可以告诉我“记住：你的内容”，我会帮你存起来。',
        timestamp: Date.now(),
      });
      return true;
    }

    await this.saveMemoryUseCase.execute({
      userId: ConversationController.DEFAULT_USER_ID,
      category: 'explicit_note',
      content,
      source: 'chat_command',
      confidence: 1,
    });

    this.chatStore.addMessage({
      role: 'assistant',
      content: `${createCompletionFeedbackCopy('记忆保存')} 我记住了：${content}`,
      timestamp: Date.now(),
    });
    return true;
  }

  private async handleRecallMemoryCommand(command: string): Promise<boolean> {
    if (!(await this.isMemoryEnabled())) {
      this.chatStore.addMessage({
        role: 'assistant',
        content: '记忆功能当前已关闭，你可以在设置里重新开启。',
        timestamp: Date.now(),
      });
      return true;
    }

    const query = command.replace(/^(回忆|想起)[:：\s]*/u, '').trim();
    const memories = query
      ? await this.recallMemoryUseCase.execute({
        userId: ConversationController.DEFAULT_USER_ID,
        query,
      })
      : await this.appContainer.memoryRepository.findByUser(
        ConversationController.DEFAULT_USER_ID,
      );

    if (memories.length === 0) {
      this.chatStore.addMessage({
        role: 'assistant',
        content: '我这里还没有可回忆的内容。',
        timestamp: Date.now(),
      });
      return true;
    }

    const preview = memories
      .slice(0, ConversationController.MAX_RECALL_ITEMS)
      .map((memory, index) => `${index + 1}. ${memory.content}`)
      .join('\n');

    this.chatStore.addMessage({
      role: 'assistant',
      content: `我记得这些：\n${preview}`,
      timestamp: Date.now(),
    });
    return true;
  }

  private async handleClearMemoryCommand(): Promise<boolean> {
    await this.appContainer.memoryRepository.clearByUser(
      ConversationController.DEFAULT_USER_ID,
    );

    this.chatStore.addMessage({
      role: 'assistant',
      content: createCompletionFeedbackCopy('记忆清空'),
      timestamp: Date.now(),
    });
    return true;
  }

  private async isMemoryEnabled(): Promise<boolean> {
    const rawValue = await this.appContainer.settingsRepository.get(
      ConversationController.MEMORY_ENABLED_KEY,
    );
    if (rawValue === null) {
      return true;
    }
    return rawValue === 'true';
  }

  private async recordUsage(record: ModelUsageRecord): Promise<void> {
    try {
      await this.appContainer.usageRepository.save(record);
    } catch {
      // Usage tracking should not break user-facing chat flow.
    }
  }
}
