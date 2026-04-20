import { useState, useRef, useCallback } from 'react';
import { useChatStore } from './chatStore';
import styles from './MessageInput.module.css';

export default function MessageInput() {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const isInputEmpty = inputValue.trim().length === 0;

  const submitMessage = useCallback(() => {
    if (isInputEmpty) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue, isInputEmpty, sendMessage]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    },
    [submitMessage],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(event.target.value);
      event.target.style.height = 'auto';
      event.target.style.height = `${event.target.scrollHeight}px`;
    },
    [],
  );

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="输入消息..."
        rows={1}
      />
      <button
        className={styles.sendButton}
        onClick={submitMessage}
        disabled={isInputEmpty}
        type="button"
      >
        发送
      </button>
    </div>
  );
}
