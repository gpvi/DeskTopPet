import { useEffect, useMemo, useRef, useState } from 'react';
import usePetStore from './petState';
import { useChatStore } from '../chat-panel/chatStore';
import {
  type DisplayMood,
  petLottieByMood,
} from './animations/petLottieAnimations';
import LottieLightPlayer from './LottieLightPlayer';
import tvRobotImage from './assets/tv-robot-cutout.png';
import styles from './PetShell.module.css';

const HAPPY_STATE_DURATION_MS = 2200;
const REMINDER_IDLE_THRESHOLD_MS = 60000;
const REMINDER_STATE_DURATION_MS = 3200;
const REMINDER_COOLDOWN_MS = 45000;
const REMINDER_TICK_MS = 1000;

const MOOD_LABEL_MAP: Record<DisplayMood, string> = {
  idle: '',
  thinking: '思考中',
  happy: '完成啦',
  reminding: '轻提醒',
};

function handlePetClick(): void {
  const chatStore = useChatStore.getState();
  if (!chatStore.isOpen) {
    chatStore.togglePanel();
  }
}

function getLastAssistantTimestamp(
  messages: ReturnType<typeof useChatStore.getState>['messages'],
): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'assistant') {
      return message.timestamp;
    }
  }
  return 0;
}

function resolveDisplayMood(params: {
  readonly isTyping: boolean;
  readonly now: number;
  readonly happyUntil: number;
  readonly reminderUntil: number;
  readonly mood: ReturnType<typeof usePetStore.getState>['mood'];
}): DisplayMood {
  const { isTyping, now, happyUntil, reminderUntil, mood } = params;

  if (isTyping) {return 'thinking';}
  if (now < happyUntil || mood === 'happy') {return 'happy';}
  if (now < reminderUntil || mood === 'reminding') {return 'reminding';}
  return 'idle';
}

export default function PetShell() {
  const mood = usePetStore((state) => state.mood);
  const isTyping = useChatStore((state) => state.isTyping);
  const isChatOpen = useChatStore((state) => state.isOpen);
  const messages = useChatStore((state) => state.messages);
  const [now, setNow] = useState(() => Date.now());
  const [happyUntil, setHappyUntil] = useState(0);
  const [reminderUntil, setReminderUntil] = useState(0);
  const lastAssistantRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const lastReminderAtRef = useRef(0);

  useEffect(() => {
    if (lastInteractionRef.current === 0) {
      lastInteractionRef.current = Date.now();
    }
    const timer = window.setInterval(() => setNow(Date.now()), REMINDER_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessageTimestamp = messages[messages.length - 1].timestamp;
      lastInteractionRef.current = latestMessageTimestamp;
    }

    const lastAssistantTimestamp = getLastAssistantTimestamp(messages);
    if (lastAssistantTimestamp > lastAssistantRef.current) {
      lastAssistantRef.current = lastAssistantTimestamp;
      setHappyUntil(Date.now() + HAPPY_STATE_DURATION_MS);
    }
  }, [messages]);

  useEffect(() => {
    if (isTyping || isChatOpen) {
      lastInteractionRef.current = Date.now();
      return;
    }

    const elapsed = now - lastInteractionRef.current;
    const afterCooldown = now - lastReminderAtRef.current;
    if (elapsed >= REMINDER_IDLE_THRESHOLD_MS && afterCooldown >= REMINDER_COOLDOWN_MS) {
      const nextReminderUntil = now + REMINDER_STATE_DURATION_MS;
      lastReminderAtRef.current = now;
      setReminderUntil(nextReminderUntil);
    }
  }, [isChatOpen, isTyping, now]);

  const displayMood = useMemo(
    () =>
      resolveDisplayMood({
        isTyping,
        now,
        happyUntil,
        reminderUntil,
        mood,
      }),
    [happyUntil, isTyping, mood, now, reminderUntil],
  );

  return (
    <div className={styles.petShell} data-tauri-drag-region onClick={handlePetClick}>
      <div className={styles.animationFrame} data-mood={displayMood}>
        <img
          className={`${styles.robotImage} ${styles[`robot${displayMood}`]}`}
          src={tvRobotImage}
          alt="电视机机器人桌宠"
          draggable={false}
        />
        <LottieLightPlayer
          animationData={petLottieByMood[displayMood]}
          className={styles.lottieLayer}
        />
      </div>
      <span className={styles.moodIndicator}>{MOOD_LABEL_MAP[displayMood]}</span>
    </div>
  );
}
