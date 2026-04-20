import { useCallback } from 'react';
import { useChatStore } from './chatStore';
import type { ChatMessage } from './types';
import styles from './QuickActions.module.css';

const QUICK_ACTION_ITEMS = [
  { label: '创建提醒', presetText: '帮我创建一个提醒' },
  { label: '创建待办', presetText: '帮我创建一个待办事项' },
  { label: '总结剪贴板', presetText: '帮我总结剪贴板内容' },
  { label: '今天日程', presetText: '查看今天的日程安排' },
] as const;

function createQuickMessage(text: string): ChatMessage {
  return { role: 'user', content: text, timestamp: Date.now() };
}

export default function QuickActions() {
  const addMessage = useChatStore((state) => state.addMessage);

  const handleQuickAction = useCallback(
    (presetText: string) => {
      addMessage(createQuickMessage(presetText));
    },
    [addMessage],
  );

  return (
    <div className={styles.container}>
      {QUICK_ACTION_ITEMS.map((item) => (
        <button
          key={item.label}
          className={styles.actionButton}
          onClick={() => handleQuickAction(item.presetText)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
