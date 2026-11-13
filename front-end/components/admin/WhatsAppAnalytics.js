'use client';
import { useEffect, useState } from 'react';
import LoaderComponent from '@/components/loader';
import styles from './admin.module.css';

const shortDay = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

function Bars({ rows, nameKey, valueKey }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <ul className={styles.bars}>
      {rows.map((r) => (
        <li key={r[nameKey]} className={styles.barRow}>
          <span className={styles.barName} title={r[nameKey]}>
            {r[nameKey]}
          </span>
          <span className={styles.barTrack}>
            <span
              className={styles.barFill}
              style={{ width: `${(r[valueKey] / max) * 100}%` }}
            />
          </span>
          <span className={styles.barNum}>{r[valueKey]}</span>
        </li>
      ))}
    </ul>
  );
}

export default function WhatsAppAnalytics({ origin }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/whatsapp_analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin }),
        });
        const data = await res.json();
        if (data.error) setError(data.error);
        else setStats(data.stats);
      } catch {
        setError('Could not load WhatsApp analytics.');
      }
    })();
  }, [origin]);

  if (error) return <p className={styles.error}>{error}</p>;
  if (!stats)
    return (
      <div className={styles.loading}>
        <LoaderComponent />
      </div>
    );

  const t = stats.totals;
  const tiles = [
    [t.users, 'WhatsApp users'],
    [t.activeUsersWeek, 'Active, 7 days'],
    [t.newUsersWeek, 'New users, 7 days'],
    [t.questions, 'Questions asked'],
    [t.questionsToday, 'Questions today'],
    [t.avgQuestionsPerUser, 'Questions per user'],
    [t.sessions, 'Chat sessions'],
  ];
  const maxDay = Math.max(1, ...stats.perDay.map((d) => d.count));
  const modes = stats.modes.length ? stats.modes : [];

  return (
    <>
      <div className={styles.tiles}>
        {tiles.map(([v, label]) => (
          <div key={label} className={`${styles.tile} ${styles.tileWhatsapp}`}>
            <span className={styles.tileValue}>{v}</span>
            <span className={styles.tileLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <h3>Questions per day, last 14 days</h3>
        <div className={styles.spark}>
          {stats.perDay.map((d) => (
            <div key={d.date} className={styles.sparkCol} title={`${shortDay(d.date)}: ${d.count}`}>
              {d.count > 0 && <span className={styles.sparkVal}>{d.count}</span>}
              <span
                className={styles.sparkBar}
                style={{ height: `${(d.count / maxDay) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className={styles.sparkLabels}>
          {stats.perDay.map((d, i) => (
            <span key={d.date}>{i % 2 === 0 ? shortDay(d.date) : ''}</span>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Types of questions</h3>
          {stats.categories.length ? (
            <Bars rows={stats.categories} nameKey="name" valueKey="num" />
          ) : (
            <p className={styles.note}>No categorised questions yet.</p>
          )}
          {stats.uncategorised > 0 && (
            <p className={styles.note} style={{ marginTop: '0.8rem' }}>
              {stats.uncategorised} earlier question
              {stats.uncategorised === 1 ? '' : 's'} were answered before
              categories were recorded.
            </p>
          )}
        </div>

        <div className={styles.card}>
          <h3>Questions by mode</h3>
          {modes.length ? (
            <Bars rows={modes} nameKey="label" valueKey="num" />
          ) : (
            <p className={styles.note}>No mode data yet.</p>
          )}
          <h3 style={{ marginTop: '1.2rem' }}>Users by current mode</h3>
          <Bars rows={stats.currentModes} nameKey="label" valueKey="num" />
        </div>

        <div className={styles.card}>
          <h3>Most active users</h3>
          {stats.topUsers.length ? (
            <Bars rows={stats.topUsers} nameKey="phone" valueKey="questions" />
          ) : (
            <p className={styles.note}>No questions yet.</p>
          )}
        </div>
      </div>
      <p className={styles.note}>
        One WhatsApp number serves both modes, so these figures are the same in
        the DSA and CWC admin panels.
      </p>
    </>
  );
}
