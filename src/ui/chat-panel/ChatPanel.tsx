import { useEffect, useRef } from 'react';
import { useChatStore } from './chatStore';
import { useSettingsStore } from '../settings/settingsStore';
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

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={styles.settingsButton}
      onClick={onClick}
      type="button"
      aria-label="打开设置面板"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 3.5A3.5 3.5 0 1 1 7 10.5A3.5 3.5 0 0 1 7 3.5ZM7 1.2L7.6 2.4C7.8 2.8 8.2 3.1 8.7 3.2L10 3.5L10.5 4.8L9.7 5.8C9.4 6.2 9.3 6.8 9.4 7.3L9.7 8.6L8.5 9.3L7.4 8.7C7 8.5 6.4 8.5 6 8.7L4.9 9.3L3.7 8.6L4 7.3C4.1 6.8 4 6.2 3.7 5.8L2.9 4.8L3.4 3.5L4.7 3.2C5.2 3.1 5.6 2.8 5.8 2.4L6.4 1.2H7Z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function ChatPanel() {
  const isOpen = useChatStore((state) => state.isOpen);
  const togglePanel = useChatStore((state) => state.togglePanel);
  const toggleSettingsPanel = useSettingsStore((state) => state.togglePanel);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (isOpen) {togglePanel();}
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, togglePanel]);

  if (!isOpen) {return null;}

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>对话</span>
        <div className={styles.headerActions}>
          <SettingsButton onClick={toggleSettingsPanel} />
          <CloseButton onClick={togglePanel} />
        </div>
      </div>
      <MessageList />
      <QuickActions />
      <MessageInput />
    </div>
  );
}
