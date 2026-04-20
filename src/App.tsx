import { useEffect } from 'react';
import PetShell from './ui/desktop-pet/PetShell';
import { useChatStore } from './ui/chat-panel/chatStore';
import { ConversationController } from './interfaces/controllers/conversation-controller';
import { createAppContainer } from './app/composition-root';
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
      if (cancelled) return;

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
  return <PetShell />;
}

export default App;
