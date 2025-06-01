"use client";
import styles from "./ChatPlaceholder.module.css";
import { Sparkles } from "lucide-react"; // Optional, install lucide-react or use any icon lib

export default function ChatPlaceholder({lang}) {
  return (
    <div className={styles.placeholderContainer} key={lang}>
      <Sparkles size={28} className={styles.icon} />
      <h2 className={styles.title}>
        {lang === 'English' ? 'Eva is ready to continue your conversation' : 'Eva bersedia untuk meneruskan perbualan anda'}
      </h2>
      <p className={styles.subtitle}>
        {lang === 'English' ? 'Talk to Eva with a tap — or double tap to type. She remembers your conversation, so just pick up where you left off!' : 'Bercakap dengan Eva dengan ketik — atau ketik dua kali untuk menaip. Dia ingat perbualan anda, jadi sambung sahaja dari tempat anda berhenti!'}
      </p>
    </div>
  );
}
