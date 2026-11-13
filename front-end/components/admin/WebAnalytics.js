'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import CategoriesPieChart from '@/components/CategoriesCountChart';
import LoaderComponent from '@/components/loader';
import styles from './admin.module.css';

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function WebAnalytics({ origin }) {
  const supabase = useMemo(() => createClient(origin), [origin]);
  const [users, setUsers] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [categories, setCategories] = useState([]);
  const [live, setLive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshLive = async () => {
      const { data, error } = await supabase
        .from('heartbeats')
        .select('session_id')
        .gt('last_seen_at', new Date(Date.now() - 30000).toISOString());
      if (!error) setLive(data.length);
    };
    refreshLive();
    const channel = supabase
      .channel('heartbeats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'heartbeats' },
        refreshLive,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const [u, v, c] = await Promise.all([
        post('/api/list_users', { origin }).catch(() => ({})),
        post('/api/getTotalVisits', { origin }).catch(() => ({})),
        post('/api/getCategoriesCount', { origin }).catch(() => ({})),
      ]);
      setUsers(u.users || []);
      setTotalVisits(v.count || 0);
      setCategories(c.data || []);
      setLoading(false);
    })();
  }, [origin]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = users.filter(
    (u) => u.created_at && new Date(u.created_at).getTime() >= weekAgo,
  ).length;
  const activeThisWeek = users.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= weekAgo,
  ).length;
  const val = (n) => (loading ? '--' : n);

  return (
    <>
      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tileWeb}`}>
          <span className={styles.tileValue}>{val(totalVisits)}</span>
          <span className={styles.tileLabel}>Total visits</span>
        </div>
        <div className={`${styles.tile} ${styles.tileWeb}`}>
          <span className={styles.tileValue}>{val(users.length)}</span>
          <span className={styles.tileLabel}>Registered users</span>
        </div>
        <div className={`${styles.tile} ${styles.tileWeb}`}>
          <span className={styles.tileValue}>{live}</span>
          <span className={styles.tileLabel}>Live now</span>
        </div>
        <div className={`${styles.tile} ${styles.tileWeb}`}>
          <span className={styles.tileValue}>{val(newThisWeek)}</span>
          <span className={styles.tileLabel}>New sign-ups, 7 days</span>
        </div>
        <div className={`${styles.tile} ${styles.tileWeb}`}>
          <span className={styles.tileValue}>{val(activeThisWeek)}</span>
          <span className={styles.tileLabel}>Signed in, 7 days</span>
        </div>
      </div>
      <div className={`${styles.card} ${styles.chartBox}`}>
        <h3>Questions by category</h3>
        {loading ? (
          <div className={styles.loading}>
            <LoaderComponent />
          </div>
        ) : categories.length ? (
          <CategoriesPieChart data={categories} />
        ) : (
          <p className={styles.empty}>No category data yet.</p>
        )}
      </div>
    </>
  );
}
