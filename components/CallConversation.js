'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CallConversation.module.css';

export default function CallConversation({ messages }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <div ref={scrollRef} className={styles.container}>
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`${styles.message} ${
              msg.role === 'user' ? styles.user : styles.system
            }`}
          >
            {msg.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
