import styles from './notFound.module.css';

export default function MaintenancePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🚫 Deployment Inactive</h1>
        <p className={styles.message}>
          This project’s hosting has expired or the deployment is no longer active.
        </p>
        <p className={styles.subMessage}>
          If you are the site owner, please verify your deployment status on Vercel or contact your hosting provider.
        </p>
        <div className={styles.code}>
          <code>ERR_DEPLOYMENT_NOT_FOUND</code>
        </div>
      </div>
    </div>
  );
}
