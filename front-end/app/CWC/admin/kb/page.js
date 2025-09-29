'use client';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [supabase, setSupabase] = useState(null);
  useEffect(() => {
    const sb = createClient('CWC');
    setSupabase(sb);
  }, []);
  const router = useRouter();
  const [signOutFlag, setSignOutFlag] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const route = usePathname();

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

  const fetchPdfs = async () => {
    const res = await fetch('/api/list_pdfs');
    const data = await res.json();
    setPdfs(data.pdfs || []);
    // console.log(data1);
    setLoadingPdfs(false);
    // console.log(data?.users[0]);
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

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
            <section className={styles.infoContainer}>
              <h2>Knowledge Base</h2>
              <ul>
                {loadingPdfs
                  ? 'loading...'
                  : pdfs.map((pdf, i) => (
                      <li key={pdf}>
                        {i + 1}. {pdf}
                      </li>
                    ))}
              </ul>
            </section>
          </section>
        </section>
      </div>
    </div>
  );
}
