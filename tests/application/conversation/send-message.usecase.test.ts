import { describe, expect, it, vi } from 'vitest';
import { SendMessageUseCase } from '../../../src/application/conversation/send-message.usecase';
import type { ConversationMessage } from '../../../src/domain/entities/conversation-message';
import type { ConversationRepository } from '../../../src/domain/ports/conversation-repository.port';
import type { LLMGateway } from '../../../src/domain/ports/llm-gateway.port';
import type { PersonaPromptAssembler } from '../../../src/application/conversation/persona-prompt-assembler';

function createConversationRepositoryMock(): ConversationRepository {
  return {
    saveSession: vi.fn(),
    findSessionById: vi.fn(),
    saveMessage: vi.fn(),
    findMessagesBySession: vi.fn(),
  };
}

function createLlmGatewayMock(): LLMGateway {
  return {
    completeChat: vi.fn(),
    classifyIntent: vi.fn(),
  };
}

function createPersonaPromptAssemblerMock(): PersonaPromptAssembler {
  return {
    assembleSystemPrompt: vi.fn().mockReturnValue('system prompt'),
  };
}

describe('SendMessageUseCase', () => {
  it('returns assistant metadata and persists both user and assistant messages on success', async () => {
    const llmGateway = createLlmGatewayMock();
    const conversationRepository = createConversationRepositoryMock();
    const personaPromptAssembler = createPersonaPromptAssemblerMock();

    vi.mocked(conversationRepository.findMessagesBySession).mockResolvedValue([
      {
        messageId: 'history-1',
        sessionId: 'session-1',
        role: 'user',
        content: 'previous message',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      } satisfies ConversationMessage,
    ]);
    vi.mocked(llmGateway.completeChat).mockResolvedValue({
      content: 'hello, I am your assistant',
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 12,
      outputTokens: 7,
    });

    const useCase = new SendMessageUseCase(
      llmGateway,
      conversationRepository,
      personaPromptAssembler,
    );

    const result = await useCase.execute({
      userText: 'hi',
      sessionId: 'session-1',
      model: 'mock-model',
    });

    expect(result).toMatchObject({
      provider: 'mock-provider',
      model: 'mock-model',
      inputTokens: 12,
      outputTokens: 7,
      assistantMessage: {
        sessionId: 'session-1',
        role: 'assistant',
        content: 'hello, I am your assistant',
      },
    });
    expect(conversationRepository.saveMessage).toHaveBeenCalledTimes(2);
    expect(conversationRepository.saveMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sessionId: 'session-1',
        role: 'user',
        content: 'hi',
      }),
    );
    expect(conversationRepository.saveMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sessionId: 'session-1',
        role: 'assistant',
        content: 'hello, I am your assistant',
      }),
    );
    expect(llmGateway.completeChat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        feature: 'chat',
        sessionId: 'session-1',
        messages: [
          expect.objectContaining({ role: 'system', content: 'system prompt' }),
          expect.objectContaining({ role: 'user', content: 'previous message' }),
        ],
      }),
    );
  });

  it('does not save assistant message when gateway fails after user message is persisted', async () => {
    const llmGateway = createLlmGatewayMock();
    const conversationRepository = createConversationRepositoryMock();
    const personaPromptAssembler = createPersonaPromptAssemblerMock();

    vi.mocked(conversationRepository.findMessagesBySession).mockResolvedValue([]);
    vi.mocked(llmGateway.completeChat).mockRejectedValue(new Error('gateway down'));

    const useCase = new SendMessageUseCase(
      llmGateway,
      conversationRepository,
      personaPromptAssembler,
    );

    await expect(
      useCase.execute({
        userText: 'hi',
        sessionId: 'session-1',
        model: 'mock-model',
      }),
    ).rejects.toThrow('gateway down');

    expect(conversationRepository.saveMessage).toHaveBeenCalledTimes(1);
    expect(conversationRepository.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        role: 'user',
        content: 'hi',
      }),
    );
  });
});
