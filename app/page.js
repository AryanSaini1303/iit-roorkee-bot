'use client';

import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: [
          // added the scope to send email through user's email and read his/her google calender
          'https://www.googleapis.com/auth/calendar.readonly',
          "https://www.googleapis.com/auth/gmail.readonly",
          'https://www.googleapis.com/auth/gmail.send',
          'openid',
          'email',
          'profile',
        ],
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: window.location.href + `${'/home'}`, // here we mentioned to redirect to the same link which was opened, post authentication.
      },
    });
    if (error) {
      console.log(error);
      return;
    }
  };

  return (
    <div className={`wrapper ${styles.container}`}>
      <div className={styles.imageContainer}>
        <img
          src="/images/loginImage.jpg"
          alt="ai-assistant"
          className={styles.image}
        />
      </div>
      <section className={styles.loginSection}>
        <div className={styles.holder}>
          <h1>Eva</h1>
        </div>
        <div className={styles.holder}>
          <div className={styles.infoContainer}>
            <p>Your personal AI assistant</p>
            <img src="/images/rocket.gif" alt="rocket" />
          </div>
        </div>
        <div className={styles.holder}>
          <button className={styles.signInBtn} onClick={signIn}>
            <img src="/images/googleLogo.png" alt="google logo" />
            <h3>Sign in with Google</h3>
          </button>
        </div>
      </section>
    </div>
  );
}
