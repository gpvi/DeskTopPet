import usePetStore from "./petState";
import styles from "./PetShell.module.css";

const PET_IMAGE_PATH = "/img/aemirpkfnO.jpg";

const MOOD_LABEL_MAP: Record<string, string> = {
  idle: "",
  thinking: "Thinking...",
  happy: "Happy!",
  sleeping: "Zzz...",
  reminding: "Remind!",
};

function getMoodLabel(mood: string): string {
  return MOOD_LABEL_MAP[mood] ?? "";
}

function handlePetClick(): void {
  const store = usePetStore.getState();
  store.openChatPanel();
}

export default function PetShell(): JSX.Element {
  const mood = usePetStore((state) => state.mood);

  return (
    <div
      className={styles.petShell}
      data-tauri-drag-region
      onClick={handlePetClick}
    >
      <img
        className={styles.petImage}
        src={PET_IMAGE_PATH}
        alt="Desktop pet - golden retriever"
        draggable={false}
      />
      <span className={styles.moodIndicator}>{getMoodLabel(mood)}</span>
    </div>
  );
}
