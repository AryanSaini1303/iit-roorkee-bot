'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import FileLoader from '@/components/FileLoader';
import Link from 'next/link';
import UsersPanel from '@/components/admin/UsersPanel';

export default function AdminPage() {
  // const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const supabase = createClient('CWC');
  const router = useRouter();
  const [signOutFlag, setSignOutFlag] = useState(false);
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
      router.replace('/CWC/admin');
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
          <UsersPanel origin="CWC" />
          {/* <section className={styles.bottomContainer}>
            <section className={styles.uploadContainer}>
              <h2>Upload PDFs</h2>
              {!uploading ? (
                <div
                  {...getRootProps()}
                  className={`${styles.dropzone} ${
                    isDragActive ? styles.activeDrop : ''
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop PDFs here...</p>
                  ) : (
                    <p>Drag & drop PDFs here, or click to select</p>
                  )}
                </div>
              ) : (
                <div className={styles.loaderContainer}>
                  <FileLoader />
                </div>
              )}
              {uploading && (
                <div className={styles.uploading}>
                  <h4>Uploading...</h4>
                  <p>
                    Hold tight &ndash; our AI is weaving your data into its
                    knowledge base. Precision takes time.
                  </p>
                </div>
              )}
            </section>
          </section> */}
        </section>
      </div>
    </div>
  );
}
