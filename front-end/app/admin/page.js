'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import LoaderComponent from '@/components/loader';
import { useRouter } from 'next/navigation';
import FileLoader from '@/components/FileLoader';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const supabase = createClient();
  const router = useRouter();
  const [signOutFlag, setSignOutFlag] = useState(false);

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
      router.push('/');
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/list_users');
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    await fetch('/api/delete_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    fetchUsers();
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    setUploading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/add', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      alert(`Uploaded: ${data.files_processed.join(', ')}`);
    } catch (err) {
      alert('Upload failed.');
      console.log(err);
    }
    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
  });

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
      {users.length !== 0 ? (
        <div className={styles.container}>
          <button className={styles.signOut} onClick={signOut}>
            {signOutFlag ? 'Signing out...' : 'Sign Out'}
          </button>
          <h1>Admin Dashboard</h1>
          <section className={styles.userContainer}>
            <h2>Users</h2>
            <section className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Name</th>
                    <th>Email</th>
                    {/* <th>Created At</th> */}
                    <th>Last Sign In</th>
                    <th>Terminate</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id}>
                      <td>{index + 1}</td>
                      <td>{u.email}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>{formatDate(u.last_sign_in_at)}</td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteUser(u.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="1.2em"
                            height="1.2em"
                          >
                            <g
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            >
                              <path d="M5.47 5.47a.75.75 0 0 1 1.06 0l12 12a.75.75 0 1 1-1.06 1.06l-12-12a.75.75 0 0 1 0-1.06"></path>
                              <path d="M18.53 5.47a.75.75 0 0 1 0 1.06l-12 12a.75.75 0 0 1-1.06-1.06l12-12a.75.75 0 0 1 1.06 0"></path>
                            </g>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>
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
                <h3>Uploading...</h3>
                <p>
                  Hold tight &ndash; our AI is weaving your data into its
                  knowledge base. Precision takes time.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <LoaderComponent
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            scale: '1.5',
          }}
        />
      )}
    </div>
  );
}
