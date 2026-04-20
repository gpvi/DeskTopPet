import { create } from "zustand";

export type PetMood = "idle" | "thinking" | "happy" | "sleeping" | "reminding";

interface PetPosition {
  x: number;
  y: number;
}

interface PetState {
  mood: PetMood;
  position: PetPosition;
  isChatPanelOpen: boolean;
}

interface PetActions {
  setMood: (mood: PetMood) => void;
  updatePosition: (position: PetPosition) => void;
  openChatPanel: () => void;
  closeChatPanel: () => void;
}

type PetStore = PetState & PetActions;

const usePetStore = create<PetStore>((set) => ({
  mood: "idle",
  position: { x: 100, y: 100 },
  isChatPanelOpen: false,

  setMood: (mood: PetMood) => set({ mood }),

  updatePosition: (position: PetPosition) => set({ position }),

  openChatPanel: () => set({ isChatPanelOpen: true }),

  closeChatPanel: () => set({ isChatPanelOpen: false }),
}));

export default usePetStore;
