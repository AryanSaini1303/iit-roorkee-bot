import styles from './admin.module.css';

export default function SourceBadge({ source }) {
  const isWhatsapp = source === 'whatsapp';
  return (
    <span
      className={`${styles.badge} ${isWhatsapp ? styles.badgeWhatsapp : styles.badgeWeb}`}
    >
      {isWhatsapp ? 'WhatsApp' : 'Web'}
    </span>
  );
}
