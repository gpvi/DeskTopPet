import { useEffect, useRef } from 'react';
import { useChatStore } from './chatStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import QuickActions from './QuickActions';
import styles from './ChatPanel.module.css';

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={styles.closeButton}
      onClick={onClick}
      type="button"
      aria-label="关闭聊天面板"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M1 1L13 13M1 13L13 1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export default function ChatPanel() {
  const isOpen = useChatStore((state) => state.isOpen);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (isOpen) togglePanel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, togglePanel]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>对话</span>
        <CloseButton onClick={togglePanel} />
      </div>
      <MessageList />
      <QuickActions />
      <MessageInput />
    </div>
  );
}
