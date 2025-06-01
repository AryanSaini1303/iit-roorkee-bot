import styles from './UpcomingEvents.module.css';

export default function UpcomingEvents({ events, lang }) {
  return (
    <div className={styles.card}>
      <div className={styles.heading}>{lang === 'English' ? 'Upcoming' : 'Akan datang'}</div>
      {events.map((event, index) => (
        <div key={index} className={styles.event}>
          <div className={styles.ribbon}></div>
          <div className={styles.details}>
            <div className={styles.title}>{event.summary}</div>
            <div className={styles.time}>
              {new Date(event.start.dateTime || event.start.date).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
