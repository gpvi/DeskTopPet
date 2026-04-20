import { useEffect, useRef } from 'react';
import { useChatStore } from './chatStore';
import type { ChatMessage } from './types';
import styles from './MessageList.module.css';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}>
      <div className={styles.bubble}>
        <span className={styles.content}>{message.content}</span>
        <span className={styles.time}>{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

export default function MessageList() {
  const messages = useChatStore((state) => state.messages);
  const isTyping = useChatStore((state) => state.isTyping);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={styles.container}>
      {messages.map((message) => (
        <MessageItem key={message.timestamp} message={message} />
      ))}
      {isTyping && (
        <div className={`${styles.message} ${styles.assistantMessage}`}>
          <div className={styles.bubble}>
            <span className={styles.typingIndicator}>正在输入...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
