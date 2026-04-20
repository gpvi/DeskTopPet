import { useCallback } from 'react';
import { useChatStore } from './chatStore';
import styles from './QuickActions.module.css';

const QUICK_ACTION_ITEMS = [
  { label: '创建提醒', presetText: '帮我创建一个提醒' },
  { label: '创建待办', presetText: '帮我创建一个待办事项' },
  { label: '总结剪贴板', presetText: '帮我总结剪贴板内容' },
  { label: '今天日程', presetText: '查看今天的日程安排' },
] as const;

export default function QuickActions() {
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleQuickAction = useCallback(
    (presetText: string) => {
      sendMessage(presetText);
    },
    [sendMessage],
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
