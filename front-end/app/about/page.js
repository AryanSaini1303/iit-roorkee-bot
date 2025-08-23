import styles from './page.module.css';

export default function AboutPage() {
  return (
    <main className={`${styles.container} wrapper`}>
      <section className={styles.content}>
        <h1 className={styles.title}>
          About <span>Varuna</span>
        </h1>
        <p className={styles.subtitle}>
          Ensuring dam safety with clarity and compliance.
        </p>

        <div className={styles.block}>
          <h2 className={styles.heading}>Purpose</h2>
          <p className={styles.text}>
            Varuna is designed to simplify and explain the{' '}
            <strong>Dam Safety Act & Regulations</strong>, making them
            accessible and easy to understand for all stakeholders.
          </p>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Research & Development</h2>
          <p className={styles.text}>
            Built as an <strong>ICED product</strong> under the guidance of{' '}
            <strong>Prof. M.L. Sharma</strong> & <strong>Prof. Pillai</strong>.
          </p>
        </div>

        <div className={styles.block}>
          <h2 className={styles.heading}>Developed By</h2>
          <p className={styles.text}>
            <strong>Inventis Labs</strong> <br />
            Team: Aryan, Yograj & Rahul <br />
            Contact:{' '}
            <a href="mailto:info@inventislabs.com" className={styles.link}>
              info@inventislabs.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
