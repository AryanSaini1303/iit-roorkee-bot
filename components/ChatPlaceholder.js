"use client";
import styles from "./ChatPlaceholder.module.css";
import { Sparkles } from "lucide-react"; // Optional, install lucide-react or use any icon lib

export default function ChatPlaceholder() {
  return (
    <div className={styles.placeholderContainer}>
      <Sparkles size={28} className={styles.icon} />
      <h2 className={styles.title}>
        Zena is ready to continue your conversation
      </h2>
      <p className={styles.subtitle}>
        Talk to Zena with a tap — or double tap to type. She remembers your
        conversation, so just pick up where you left off!
      </p>
    </div>
  );
}
