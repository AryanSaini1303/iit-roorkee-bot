'use client';
import styles from './ZenaLoading.module.css';

export default function ZenaLoading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.dots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className={styles.text}>Eva is thinking...</p>
    </div>
  );
}
