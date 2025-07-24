'use client';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Or any preferred theme
import styles from './ChatResponse.module.css';
import { useEffect, useRef } from 'react';
import ZenaLoading from './ZenaLoading';

export default function ChatResponse({
  conversation,
  pages,
  func,
  isProcessing,
}) {
  const bottomRef = useRef(null);
  const width = (() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className={styles.container}>
      {conversation.map((message, index) => (
        <div
          key={index}
          className={
            message.role === 'user' ? styles.userMessage : styles.botMessage
          }
        >
          <ReactMarkdown rehypePlugins={[rehypeHighlight]} key={index}>
            {message.content}
          </ReactMarkdown>
        </div>
      ))}
      <section className={styles.pagesInfo} onClick={() => func(true)}>
        {pages?.length !== 0 && !isProcessing && (
          <p>
            <em>
              Referenced pages: {width < 900 ? 'Click here!' : pages.join(', ')}
            </em>
          </p>
        )}
        <div ref={bottomRef}></div>
      </section>
      {isProcessing && <ZenaLoading />}
    </div>
  );
}
