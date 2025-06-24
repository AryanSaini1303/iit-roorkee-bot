import styles from './notFound.module.css';

export default function MaintenancePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🚫 Deployment Inactive</h1>
        <p className={styles.message}>
          This project’s hosting and services has expired.
        </p>
        <p className={styles.subMessage}>
          If you are the site owner, please verify your deployment status on
          Vercel or contact your developer.
        </p>
        <div className={styles.code}>
          <code>ERR_DEPLOYMENT_NOT_FOUND</code>
        </div>
      </div>
    </div>
  );
}
