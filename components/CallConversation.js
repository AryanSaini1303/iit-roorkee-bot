'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CallConversation.module.css';

export default function CallConversation({ messages, recordingUrls }) {
  const [audioIsReady, setAudioIsReady] = useState(false);
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

  return (
    <div ref={scrollRef} className={styles.container}>
      <AnimatePresence>
        {(() => {
          let userMsgIndex = 0; // Local counter for user messages

          return messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const audioUrl = isUser
              ? recordingUrls[recordingUrls.length - 1 - userMsgIndex++]
              : null;

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
              >
                {audioIsReady ? (
                  <>
                    {msg.content}
                    {isUser && audioUrl && (
                      <audio
                        controls
                        preload="auto"
                        onError={(e) => {
                          console.error('Audio error:', e);
                        }}
                      >
                        <source src={audioUrl} />
                      </audio>
                    )}
                  </>
                ) : (
                  'Loading...'
                )}
              </motion.div>
            );
          });
        })()}
      </AnimatePresence>
    </div>
  );
}
