'use client';

import MaintenancePage from '@/components/notFound';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SessionLoader from '@/components/SessionLoader';

export default function Home() {
  const supabase = createClient('DSA');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: ['openid', 'profile'],
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

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      if (data?.session) {
        router.push('/DSA/home');
      }
      // console.log(data?.session);
      setLoading(false);
      if (error) {
        console.error('Session fetch error:', error.message);
      }
    };
    getSession();
  }, []);

  // if(true){
  //   return <MaintenancePage/>
  // }

  return (
    <div className={`wrapper ${styles.container}`}>
      {loading ? (
        <SessionLoader />
      ) : (
        !session && (
          <>
            <div className={styles.imageContainer}>
              <img
                src="/images/loginImage.jpg"
                alt="ai-assistant"
                className={styles.image}
              />
            </div>
            <section className={styles.loginSection}>
              <div className={styles.holder}>
                <h1>DamChat</h1>
              </div>
              <div className={styles.holder}>
                <div className={styles.infoContainer}>
                  {/* <p>&ndash; by ICED, IIT Roorkee</p> */}
                  <img src="/images/icedLogo.png" alt="rocket" />
                </div>
              </div>
              <div className={styles.holder}>
                <button className={styles.signInBtn} onClick={signIn}>
                  <img src="/images/googleLogo.png" alt="google logo" />
                  <h3>Sign in with Google</h3>
                </button>
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}
