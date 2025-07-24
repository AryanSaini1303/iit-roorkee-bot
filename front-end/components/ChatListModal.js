'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './ChatListModal.module.css';
import LoaderComponent from './loader';

export default function ChatListModal({
  chats,
  onClose,
  onNewChat,
  onSelectChat,
}) {
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectId, setSelectId] = useState('');

  const deleteChat = async (conversationId) => {
    try {
      const res = await fetch('/api/deleteChat', {
        method: 'DELETE',
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return res;
    } catch (err) {
      console.error('Failed to delete chat:', err.message);
    }
  };

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
            chats.map((chat, index) =>
              loading && selectId === chat.id ? (
                <div
                  className={styles.chatItem}
                  key={index}
                  style={{ justifyContent: 'center' }}
                >
                  <LoaderComponent />
                </div>
              ) : (
                <div
                  key={index}
                  className={styles.chatItem}
                  onClick={() => {
                    onSelectChat(chat.id);
                    setLoading(true);
                    setSelectId(chat.id);
                  }}
                >
                  <section className={styles.textSection}>
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
                  </section>
                  <section className={styles.buttonContainer}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.2rem"
                        height="1.2rem"
                      >
                        <path
                          fill="black"
                          d="m16.757 2.997l-7.466 7.466l.008 4.247l4.238-.008L21 7.24v12.758a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1zm3.728-.9L21.9 3.511l-9.193 9.193l-1.412.002l-.002-1.416z"
                        ></path>
                      </svg>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            'Are you sure you want to delete this chat?',
                          )
                        ) {
                          setLoading(true);
                          const response = await deleteChat(chat.id);
                          if (response.ok) {
                            setLoading(false);
                            onNewChat();
                          } else {
                            setLoading(false);
                            alert(
                              'Failed to delete chat: ' + response.statusText,
                            );
                          }
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="1.2rem"
                        height="1.2rem"
                      >
                        <path
                          fill="red"
                          fillRule="evenodd"
                          d="M9.774 5L3.758 3.94l.174-.986a.5.5 0 0 1 .58-.405L18.411 5h.088h-.087l1.855.327a.5.5 0 0 1 .406.58l-.174.984l-2.09-.368l-.8 13.594A2 2 0 0 1 15.615 22H8.386a2 2 0 0 1-1.997-1.883L5.59 6.5h12.69zH5.5zM9 9l.5 9H11l-.4-9zm4.5 0l-.5 9h1.5l.5-9zm-2.646-7.871l3.94.694a.5.5 0 0 1 .405.58l-.174.984l-4.924-.868l.174-.985a.5.5 0 0 1 .58-.405z"
                        ></path>
                      </svg>
                    </button>
                  </section>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
