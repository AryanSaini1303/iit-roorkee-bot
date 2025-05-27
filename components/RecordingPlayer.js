import React from 'react';
import styles from './RecordingPlayer.module.css';

const RecordingPlayer = ({ recordingUrl }) => {
  if (!recordingUrl) return null;

  const encodedUrl = encodeURIComponent(recordingUrl);
  const proxyUrl = `https://live-sunbird-select.ngrok-free.app/api/twilio/audio?url=${encodedUrl}`;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Call Recording</h4>
      {proxyUrl ? (
        <audio
          controls
          preload="auto"
          autoPlay
          onError={(e) => {
            console.error('Audio error:', e);
          }}
          className={styles.audio}
        >
          <source src={proxyUrl} />
        </audio>
      ) : (
        <p className={styles.loading}>fetching recording...</p>
      )}
    </div>
  );
};

export default RecordingPlayer;
