'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from '../page.module.css';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import { usePathname, useRouter } from 'next/navigation';
import FileLoader from '@/components/FileLoader';
import Link from 'next/link';

export default function AdminPage() {
  const [uploadingKB, setUploadingKB] = useState(false);
  const [uploadingMeta, setUploadingMeta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const supabase = createClient();
  const router = useRouter();
  const [signOutFlag, setSignOutFlag] = useState(false);
  const route = usePathname();
  const onDropKnowledgeBase = useCallback(async (acceptedFiles) => {
    await handleUpload(acceptedFiles, '/api/upload', 'knowledgeBase');
  }, []);

  const onDropMetadata = useCallback(async (acceptedFiles) => {
    await handleUpload(acceptedFiles, '/api/uploadMetadata', 'metadata');
  }, []);
  const {
    getRootProps: getKBRootProps,
    getInputProps: getKBInputProps,
    isDragActive: isKBActive,
  } = useDropzone({
    onDrop: onDropKnowledgeBase,
    accept: { 'application/pdf': ['.pdf'] },
  });
  const {
    getRootProps: getMetaRootProps,
    getInputProps: getMetaInputProps,
    isDragActive: isMetaActive,
  } = useDropzone({
    onDrop: onDropMetadata,
    accept: { 'application/pdf': ['.pdf'] },
  });

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
      router.push('/adminLogin');
    }
  };

  const handleUpload = async (acceptedFiles, endpoint, type) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });
    type === 'knowledgeBase' ? setUploadingKB(true) : setUploadingMeta(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log(data);
      alert(`Uploaded: ${data.files_processed.join(', ')}`);
    } catch (err) {
      alert('Upload failed.');
      console.error(err);
    }
    type === 'knowledgeBase' ? setUploadingKB(false) : setUploadingMeta(false);
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
                href={'/admin'}
                className={route === '/admin' ? `${styles.active}` : null}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={'/admin/analytics'}
                className={
                  route === '/admin/analytics' ? `${styles.active}` : null
                }
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href={'/admin/kb'}
                className={route === '/admin/kb' ? `${styles.active}` : null}
              >
                Knowledge Base
              </Link>
            </li>
            <li>
              <Link
                href={'/admin/upload'}
                className={
                  route === '/admin/upload' ? `${styles.active}` : null
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
          <h2 style={{ textAlign: 'left' }}>Upload to:</h2>
          <section className={styles.bottomContainer}>
            <section className={styles.uploadContainer}>
              <h2>Knowledge Base</h2>
              {!uploadingKB ? (
                <div
                  {...getKBRootProps()}
                  className={`${styles.dropzone} ${
                    isKBActive ? styles.activeDrop : ''
                  }`}
                >
                  <input {...getKBInputProps()} />
                  {isKBActive ? (
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
              {uploadingKB && (
                <div className={styles.uploading}>
                  <h4>Uploading...</h4>
                  <p>
                    Hold tight &ndash; our AI is weaving your data into its
                    knowledge base. Precision takes time.
                  </p>
                </div>
              )}
            </section>
            <h2 style={{ textAlign: 'center', color: 'grey' }}>or</h2>
            <section className={styles.uploadContainer}>
              <h2>Metadata</h2>
              {!uploadingMeta ? (
                <div
                  {...getMetaRootProps()}
                  className={`${styles.dropzone} ${
                    isMetaActive ? styles.activeDrop : ''
                  }`}
                >
                  <input {...getMetaInputProps()} />
                  {isMetaActive ? (
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
              {uploadingMeta && (
                <div className={styles.uploading}>
                  <h4>Uploading...</h4>
                  <p>
                    Hold tight &ndash; our AI is weaving your data into its
                    Metadata. Precision takes time.
                  </p>
                </div>
              )}
            </section>
          </section>
        </section>
      </div>
    </div>
  );
}
