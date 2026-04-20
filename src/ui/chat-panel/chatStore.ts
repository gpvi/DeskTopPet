import { create } from 'zustand';
import type { ChatMessage, ChatState } from './types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  isTyping: false,

  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

  togglePanel: () =>
    set((state) => ({ isOpen: !state.isOpen })),

  setTyping: (typing: boolean) =>
    set({ isTyping: typing }),
}));
