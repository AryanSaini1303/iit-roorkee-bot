'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from '../page.module.css';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import CategoriesPieChart from '@/components/CategoriesCountChart';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [session, setSession] = useState(null);
  const supabase = createClient('CWC');
  const router = useRouter();
  const [signOutFlag, setSignOutFlag] = useState(false);
  const [totalVisits, setTotalVisits] = useState(0);
  const [count, setCount] = useState(0);
  const route = usePathname();
  const [categoriesData, setCategoriesData] = useState([]);

  const refreshCount = async () => {
    const { data, error } = await supabase
      .from('heartbeats')
      .select('session_id')
      .gt('last_seen_at', new Date(Date.now() - 30000).toISOString());
    if (!error) setCount(data.length);
  };

  useEffect(() => {
    if (!supabase) return;
    refreshCount();
    const channel = supabase
      .channel('heartbeats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'heartbeats' },
        () => {
          // whenever anyone pings, recalc
          refreshCount();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
      if (error) {
        console.error('Session fetch error:', error.message);
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      router.replace('/admin');
    }
  }, []);

  const signOut = async () => {
    setSignOutFlag(true);
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    sessionStorage.clear();
    if (error) {
      console.error('Sign-out error:', error.message);
    } else {
      setSession(null);
      router.push('/CWC/adminLogin');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await fetch('/api/list_users', {
      method: 'POST',
      body: JSON.stringify({ origin: 'CWC' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setUsers(data.users || []);
    const res1 = await fetch('/api/getTotalVisits', {
      method: 'POST',
      body: JSON.stringify({ origin: 'CWC' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data1 = await res1.json();
    // console.log(data1);
    setTotalVisits(data1.count || 0);
    setLoadingUsers(false);
    // console.log(data?.users[0]);
  };

  const getCategoriesCount = async () => {
    const res = await fetch('/api/getCategoriesCount', {
      method: 'POST',
      body: JSON.stringify({ origin: 'CWC' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    // console.log(data);
    setCategoriesData(data.data || []);
    setLoadingCategories(false);
    // console.log(data?.users[0]);
  };

  useEffect(() => {
    fetchUsers();
    getCategoriesCount();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (
    !loading &&
    (!session ||
      !process.env.NEXT_PUBLIC_ADMIN_ACCESS.split(',')
        .join(',')
        .includes(session.user?.email))
  ) {
    return (
      <div className="wrapper">
        <h1>Unauthenticated</h1>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapperContainer} wrapper`}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <ul>
            <li>
              <Link
                href={'/CWC/admin'}
                className={route === '/CWC/admin' ? `${styles.active}` : null}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={'/CWC/admin/analytics'}
                className={
                  route === '/CWC/admin/analytics' ? `${styles.active}` : null
                }
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href={'/CWC/admin/kb'}
                className={
                  route === '/CWC/admin/kb' ? `${styles.active}` : null
                }
              >
                Knowledge Base
              </Link>
            </li>
            <li>
              <Link
                href={'/CWC/admin/upload'}
                className={
                  route === '/CWC/admin/upload' ? `${styles.active}` : null
                }
              >
                Upload
              </Link>
            </li>
          </ul>
        </aside>
        <section className={styles.mainContent}>
          <button className={styles.signOut} onClick={signOut}>
            {signOutFlag ? 'Signing out...' : 'Sign Out'}
          </button>
          <h1>Admin Dashboard</h1>
          <section className={styles.bottomContainer}>
            {loadingCategories
              ? 'Loading...'
              : totalVisits.length !== 0 && (
                  <section
                    className={styles.infoContainer}
                    style={{ height: '70vh' }}
                  >
                    <h2>Web Analytics</h2>
                    <ul>
                      <li>
                        Number of Visits:{' '}
                        <span>{loadingUsers ? '--' : totalVisits}</span>
                      </li>
                      <li>
                        Number of Registered Users:{' '}
                        <span>{loadingUsers ? '--' : users.length}</span>
                      </li>
                      <li>
                        Number of Live Users:{' '}
                        <span>{loadingUsers ? '--' : count}</span>
                      </li>
                    </ul>
                    {categoriesData.length !== 0 && (
                      <CategoriesPieChart data={categoriesData} />
                    )}
                  </section>
                )}
          </section>
        </section>
      </div>
    </div>
  );
}
