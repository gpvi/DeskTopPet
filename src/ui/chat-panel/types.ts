export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  togglePanel: () => void;
  setTyping: (typing: boolean) => void;
}
