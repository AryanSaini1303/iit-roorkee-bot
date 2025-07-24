'use client';
import { useEffect, useRef } from 'react';
import styles from './ChatListModal.module.css';

export default function ChatListModal({
  chats,
  onClose,
  onNewChat,
  onSelectChat,
}) {
  const modalRef = useRef(null);
  // console.log(chats);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className={styles.overlay} key={chats}>
      <div className={styles.modal} ref={modalRef}>
        <button className={styles.newChatBtn} onClick={onNewChat}>
          + New Chat
        </button>
        <div className={styles.chatList}>
          {chats.length === 0 ? (
            <p className={styles.empty}>No chats yet.</p>
          ) : (
            chats.map((chat, index) => (
              <div
                key={index}
                className={styles.chatItem}
                onClick={() => onSelectChat(chat.id)}
              >
                <h3>
                  {`${chat.name}${chat.name.length >= 5 ? '...' : ''}` ||
                    `Chat ${index + 1}`}{' '}
                </h3>
                <p>
                  {new Date(chat.updated_at).toLocaleString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
