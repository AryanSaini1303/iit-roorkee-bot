'use client';
import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/utils/supabase/client';
import ZenaLoading from '@/components/ZenaLoading';
import LoaderComponent from '@/components/loader';
import { scale } from 'framer-motion';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const supabase = createClient();

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
    return 'Unauthenticated';
  }

  return (
    <div className="wrapper">
      {users.length !== 0 ? (
        <div className={styles.container}>
          <h1>Admin Dashboard</h1>
          <h2>Users</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Created</th>
                <th>Last Sign In</th>
                <th>Terminate</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>{formatDate(u.last_sign_in_at)}</td>
                  <td style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteUser(u.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.5em"
                        height="1.5em"
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
          <h2>Append PDFs to Database</h2>
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
          {uploading && <p className={styles.uploading}>Uploading...</p>}
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
