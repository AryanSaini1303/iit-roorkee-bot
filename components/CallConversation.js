'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import styles from './CallConversation.module.css';

export default function CallConversation({ messages, recordingUrls }) {
  const [audioIsReady, setAudioIsReady] = useState(false);
  const audioRefs = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    const checkAudioIsReady = async (url) => {
      try {
        let res;
        while (true) {
          res = await fetch(url);
          if (res.ok) break;
          await new Promise((r) => setTimeout(r, 1000));
        }
        return true;
      } catch (err) {
        console.error('Audio readiness check failed:', err);
        return false;
      }
    };

    (async () => {
      if (recordingUrls.length > 0) {
        const isReady = await checkAudioIsReady(recordingUrls.at(-1));
        setAudioIsReady(isReady);
      }
    })();
  }, [recordingUrls]);

  const userMsgIndices = messages.reduce((acc, msg, idx) => {
    if (msg.role === 'user') acc.push(idx);
    return acc;
  }, []);

  useEffect(() => {
    // Stop and reset all previous audio refs
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Create new audio instances
    audioRefs.current = userMsgIndices.map(
      (_, i) => new Audio(recordingUrls[recordingUrls.length - 1 - i]),
    );
  }, [recordingUrls, messages]);

  const stopAllAudio = () => {
    audioRefs.current.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  return (
    <div ref={scrollRef} className={styles.container}>
      <AnimatePresence>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const userAudioIndex = userMsgIndices.indexOf(index);

          const handlePlay = () => {
            const audio = audioRefs.current[userAudioIndex];
            if (audio) {
              stopAllAudio();
              audio.play();
            }
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`${styles.message} ${
                isUser ? styles.user : styles.system
              }`}
              style={{
                position: 'relative',
                cursor: isUser ? 'pointer' : 'default',
                padding: isUser ? '0.75rem 1rem 0.75rem 3rem' : '0.75rem 1rem',
              }}
            >
              {audioIsReady ? (
                <>
                  {msg.content}
                  {isUser && (
                    <PlayCircle
                      size={28}
                      className={styles.playIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay();
                      }}
                    />
                  )}
                </>
              ) : (
                'Loading...'
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
