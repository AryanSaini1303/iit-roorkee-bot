import styles from './WeatherCard.module.css';

const getWeatherEmoji = (main) => {
  switch (main.toLowerCase()) {
    case 'clouds':
      return '☁️';
    case 'rain':
    case 'drizzle':
      return '🌧️';
    case 'thunderstorm':
      return '⛈️';
    case 'snow':
      return '❄️';
    case 'clear':
      return '☀️';
    case 'mist':
    case 'fog':
      return '🌫️';
    default:
      return '🌡️';
  }
};

const WeatherCard = ({ weatherData }) => {
  if (!weatherData) return null;

  const { name, main, weather } = weatherData;
  const condition = weather[0]?.main || '';
  const emoji = getWeatherEmoji(condition);

  return (
    <div className={styles.card}>
      <div className={styles.header}>Current Weather</div>
        <div className={styles.emoji}>{emoji}</div>
      <div className={styles.body}>
        <div className={styles.info}>
          <div className={styles.row}>
            <span className={styles.label}>City:</span>
            <span className={styles.value}>{name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Temperature:</span>
            <span className={styles.value}>{Math.round(main.temp)}°C</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Condition:</span>
            <span className={styles.value}>{condition}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
