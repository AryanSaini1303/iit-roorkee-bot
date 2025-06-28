'use client';
import styles from './ChatPlaceholder.module.css';
import { Sparkles } from 'lucide-react';

export default function ChatPlaceholder({ lang }) {
  return (
    <div className={styles.placeholderContainer} key={lang}>
      <Sparkles size={28} className={styles.icon} />
      <h2 className={styles.title}>Your personalised ICED AI assistant</h2>
      <p className={styles.subtitle}>
        Ready to continue your conversation
      </p>
    </div>
  );
}
