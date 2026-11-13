'use client';
import { useState } from 'react';
import WebAnalytics from './WebAnalytics';
import WhatsAppAnalytics from './WhatsAppAnalytics';
import styles from './admin.module.css';

const TABS = [
  { key: 'web', label: 'Web' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

export default function AnalyticsPanel({ origin }) {
  const [tab, setTab] = useState('web');
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>Analytics</h2>
        <div className={styles.tabs} role="tablist" aria-label="Analytics source">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'web' ? (
        <WebAnalytics origin={origin} />
      ) : (
        <WhatsAppAnalytics origin={origin} />
      )}
    </section>
  );
}
