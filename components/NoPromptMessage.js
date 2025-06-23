'use client';

import styles from './NoPromptMessage.module.css';

export default function NoPromptsMessage() {
  return (
    <div className={styles.overlay}>
      <div className={styles.messageBox}>
        <h2>You've Hit Your Daily Limit</h2>
        <p>Resets 24 hrs after last use — stay tuned.</p>
      </div>
    </div>
  );
}
