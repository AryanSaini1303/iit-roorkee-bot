'use client';
import styles from './ZenaLoading.module.css';

export default function ZenaLoading({ lang }) {
  return (
    <div className={styles.loadingContainer} key={lang}>
      <div className={styles.dots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className={styles.text}>Eva is thinking...</p>
    </div>
  );
}
