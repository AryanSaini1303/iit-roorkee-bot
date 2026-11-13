'use client';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import LoaderComponent from '@/components/loader';
import SourceBadge from './SourceBadge';
import styles from './admin.module.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'web', label: 'Web' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

const formatDate = (v) =>
  v
    ? new Date(v).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '--';

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function UsersPanel({ origin }) {
  const [webUsers, setWebUsers] = useState([]);
  const [waUsers, setWaUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waError, setWaError] = useState(null);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    const [web, wa] = await Promise.all([
      post('/api/list_users', { origin }).catch(() => ({})),
      post('/api/whatsapp_users', { origin }).catch(() => ({
        error: 'Could not load WhatsApp users.',
      })),
    ]);
    setWebUsers(web.users || []);
    setWaUsers(wa.users || []);
    setWaError(wa.error || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    if (tab === 'web') return webUsers;
    if (tab === 'whatsapp') return waUsers;
    return [...webUsers, ...waUsers];
  }, [tab, webUsers, waUsers]);

  const counts = {
    all: webUsers.length + waUsers.length,
    web: webUsers.length,
    whatsapp: waUsers.length,
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    await post('/api/delete_user', { userId, origin });
    load();
  };

  const handleDownload = () => {
    const data = rows.map((u) => ({
      Source: u.source === 'whatsapp' ? 'WhatsApp' : 'Web',
      ID: u.id,
      Name: u.name || '',
      Email: u.email || '',
      Phone: u.phone || '',
      Organisation: u.organisation || '',
      Designation: u.designation || '',
      Mode: u.mode_label || '',
      Questions: u.questions ?? '',
      CreatedAt: u.created_at || '',
      LastActive: u.last_active || u.last_sign_in_at || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      `users-${tab}.xlsx`,
    );
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>Users</h2>
        <div className={styles.tabs} role="tablist" aria-label="User source">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={styles.count}>{loading ? '–' : counts[t.key]}</span>
            </button>
          ))}
        </div>
        <button
          className={styles.actionBtn}
          onClick={handleDownload}
          disabled={loading || rows.length === 0}
        >
          Export {TABS.find((t) => t.key === tab).label.toLowerCase()} users
        </button>
      </div>

      {waError && tab !== 'web' && (
        <p className={styles.error}>WhatsApp users unavailable: {waError}</p>
      )}

      {loading ? (
        <div className={styles.loading}>
          <LoaderComponent />
        </div>
      ) : rows.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          No {tab === 'all' ? '' : TABS.find((t) => t.key === tab).label + ' '}
          users yet.
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Source</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Organisation</th>
                <th>Designation</th>
                <th>Activity</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => {
                const isWa = u.source === 'whatsapp';
                return (
                  <tr key={`${u.source}-${u.id}`}>
                    <td className={styles.muted}>{i + 1}</td>
                    <td>
                      <SourceBadge source={u.source} />
                    </td>
                    <td>{u.name || '--'}</td>
                    <td>{u.email || '--'}</td>
                    <td>{u.phone || '--'}</td>
                    <td>{u.organisation || '--'}</td>
                    <td>{u.designation || '--'}</td>
                    <td className={styles.muted}>
                      {isWa
                        ? `${u.questions} question${u.questions === 1 ? '' : 's'} · ${u.mode_label} · ${formatDate(u.last_active)}`
                        : `Last sign-in ${formatDate(u.last_sign_in_at)}`}
                    </td>
                    <td>
                      {!isWa && (
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteUser(u.id)}
                          aria-label={`Delete ${u.email}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.2em"
                            height="1.2em"
                          >
                            <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                              <path d="M5.47 5.47a.75.75 0 0 1 1.06 0l12 12a.75.75 0 1 1-1.06 1.06l-12-12a.75.75 0 0 1 0-1.06"></path>
                              <path d="M18.53 5.47a.75.75 0 0 1 0 1.06l-12 12a.75.75 0 0 1-1.06-1.06l12-12a.75.75 0 0 1 1.06 0"></path>
                            </g>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>
        WhatsApp users are identified by phone number and can’t be deleted
        from here. One WhatsApp number serves both DSA and Guidelines modes, so
        this list is the same in both admin panels.
      </p>
    </section>
  );
}
