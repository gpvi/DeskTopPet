import { useEffect } from 'react';
import PetShell from './ui/desktop-pet/PetShell';
import ChatPanel from './ui/chat-panel/ChatPanel';
import SettingsPanel from './ui/settings/SettingsPanel';
import { useChatStore } from './ui/chat-panel/chatStore';
import { ConversationController } from './interfaces/controllers/conversation-controller';
import { createAppContainer } from './app/composition-root';
import { setupChatShortcut } from './infrastructure/system/runtime/shortcut-manager';
import './styles/global.css';

const DEFAULT_MODEL = 'deepseek-chat';

function useBootstrapConversationController() {
  const setConversationController = useChatStore(
    (state) => state.setConversationController,
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const container = await createAppContainer();
      if (cancelled) {return;}

      const controller = new ConversationController(
        container,
        useChatStore.getState(),
        DEFAULT_MODEL,
      );
      setConversationController(controller);
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [setConversationController]);
}

function App() {
  useBootstrapConversationController();
  useBindChatShortcut();
  return (
    <>
      <PetShell />
      <ChatPanel />
      <SettingsPanel />
    </>
  );
}

function useBindChatShortcut() {
  const openPanel = useChatStore((state) => state.openPanel);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;

    async function bindShortcut() {
      const dispose = await setupChatShortcut(() => {
        openPanel();
      });
      if (!mounted) {
        dispose();
        return;
      }
      cleanup = dispose;
    }

    bindShortcut();
    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [openPanel]);
}

export default App;
