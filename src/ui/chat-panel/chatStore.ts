import { create } from 'zustand';
import type { ChatMessage, ChatState } from './types';
import type { ConversationController } from '../../interfaces/controllers/conversation-controller';

export interface ChatStateWithController extends ChatState {
  conversationController: ConversationController | null;
  sendMessage: (text: string) => void;
  setConversationController: (controller: ConversationController) => void;
}

export const useChatStore = create<ChatStateWithController>((set, get) => ({
  messages: [],
  isOpen: false,
  isTyping: false,
  conversationController: null as ConversationController | null,

  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

  openPanel: () =>
    set({ isOpen: true }),

  togglePanel: () =>
    set((state) => ({ isOpen: !state.isOpen })),

  setTyping: (typing: boolean) =>
    set({ isTyping: typing }),

  sendMessage: (text: string) => {
    const controller = get().conversationController;
    if (!controller) {
      get().addMessage({
        role: 'assistant',
        content: '系统正在初始化，请稍候...',
        timestamp: Date.now(),
      });
      return;
    }
    controller.handleUserMessage(text);
  },

  setConversationController: (controller: ConversationController) =>
    set({ conversationController: controller }),
}));
