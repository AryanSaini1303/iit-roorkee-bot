'use client';

import MaintenancePage from '@/components/notFound';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const supabase = createClient();
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: [
          'openid',
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

  // if(true){
  //   return <MaintenancePage/>
  // }

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
          <h1>Varuna</h1>
        </div>
        <div className={styles.holder}>
          <div className={styles.infoContainer}>
            <p>&ndash; by ICED, IIT Roorkee</p>
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
