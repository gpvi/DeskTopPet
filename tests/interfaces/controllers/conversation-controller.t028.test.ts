import { describe, expect, it, vi } from 'vitest';
import { ConversationController } from '../../../src/interfaces/controllers/conversation-controller';
import type { AppContainer } from '../../../src/app/composition-root/composition-root';
import type { ChatMessage, ChatState } from '../../../src/ui/chat-panel/types';

function createChatStateMock(): ChatState {
  const messages: ChatMessage[] = [];
  return {
    messages,
    isOpen: true,
    isTyping: false,
    addMessage: vi.fn((message: ChatMessage) => {
      messages.push(message);
    }),
    openPanel: vi.fn(),
    togglePanel: vi.fn(),
    setTyping: vi.fn(),
  };
}

function createAppContainerMock() {
  const llmGateway = {
    completeChat: vi.fn().mockResolvedValue({
      content: '{"intent":"open_application","confidence":0.95,"parameters":{"application_name":"notepad"}}',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 10,
      outputTokens: 5,
    }),
    classifyIntent: vi.fn(),
  };

  const toolExecutor = {
    openUrl: vi.fn().mockResolvedValue({ success: true }),
    openApplication: vi.fn().mockResolvedValue({ success: true }),
    openFolder: vi.fn().mockResolvedValue({ success: true }),
    readClipboard: vi.fn().mockResolvedValue({ success: true, data: { text: '' } }),
  };

  const container: AppContainer = {
    llmGateway,
    toolExecutor,
    conversationRepository: {
      saveSession: vi.fn(),
      findSessionById: vi.fn().mockResolvedValue(null),
      saveMessage: vi.fn(),
      findMessagesBySession: vi.fn().mockResolvedValue([]),
    },
    memoryRepository: {
      save: vi.fn(),
      findByUser: vi.fn().mockResolvedValue([]),
      findRelevant: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
      clearByUser: vi.fn(),
    },
    usageRepository: {
      save: vi.fn(),
      queryDailyTrend: vi.fn().mockResolvedValue([]),
    },
    reminderRepository: {
      save: vi.fn(),
      findPending: vi.fn().mockResolvedValue([]),
      markCompleted: vi.fn(),
    },
    todoRepository: {
      save: vi.fn(),
      findByUser: vi.fn().mockResolvedValue([]),
      markCompleted: vi.fn(),
      delete: vi.fn(),
    },
    settingsRepository: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
    },
  };

  return { container, llmGateway, toolExecutor };
}

describe('ConversationController T028 confirmations', () => {
  it('requires confirmation before opening applications', async () => {
    const chatStore = createChatStateMock();
    const { container, llmGateway, toolExecutor } = createAppContainerMock();

    const controller = new ConversationController(container, chatStore, 'mock-model');
    await controller.handleUserMessage('打开 notepad');

    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: expect.stringContaining('检测到高风险操作：打开应用「notepad」'),
      }),
    );

    await controller.handleUserMessage('确认');

    expect(toolExecutor.openApplication).toHaveBeenCalledWith('notepad');
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: '汪！notepad 已经打开啦~',
      }),
    );
  });

  it('does not execute high-risk actions when the user cancels', async () => {
    const chatStore = createChatStateMock();
    const { container, llmGateway, toolExecutor } = createAppContainerMock();

    const controller = new ConversationController(container, chatStore, 'mock-model');
    await controller.handleUserMessage('打开 notepad');

    await controller.handleUserMessage('取消');

    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
    expect(toolExecutor.openFolder).not.toHaveBeenCalled();
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: '好的，已取消这次高风险操作。',
      }),
    );
  });

  it('prompts for confirm or cancel when the reply is unrelated', async () => {
    const chatStore = createChatStateMock();
    const { container, llmGateway, toolExecutor } = createAppContainerMock();

    const controller = new ConversationController(container, chatStore, 'mock-model');
    await controller.handleUserMessage('打开 notepad');

    await controller.handleUserMessage('今天下午三点开会提醒我');

    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
    expect(toolExecutor.openFolder).not.toHaveBeenCalled();
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: '当前有待确认的高风险操作。请回复“确认”执行，或回复“取消”终止。',
      }),
    );
  });

  it('requires confirmation before opening folders', async () => {
    const chatStore = createChatStateMock();
    const { container, llmGateway, toolExecutor } = createAppContainerMock();
    llmGateway.completeChat.mockResolvedValueOnce({
      content: '{"intent":"open_folder","confidence":0.95,"parameters":{"folder_path":"E:\\\\Projects\\\\DeskTopPet"}}',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 10,
      outputTokens: 5,
    });

    const controller = new ConversationController(container, chatStore, 'mock-model');
    await controller.handleUserMessage('打开文件夹 "E:\\Projects\\DeskTopPet"');

    expect(toolExecutor.openFolder).not.toHaveBeenCalled();
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: expect.stringContaining('检测到高风险操作：打开文件夹'),
      }),
    );

    await controller.handleUserMessage('确认');

    expect(toolExecutor.openFolder).toHaveBeenCalledWith('E:\\Projects\\DeskTopPet');
    expect(toolExecutor.openApplication).not.toHaveBeenCalled();
    expect(llmGateway.completeChat).toHaveBeenCalledTimes(1);
    expect(chatStore.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: '汪！文件夹已经打开啦~',
      }),
    );
  });
});
