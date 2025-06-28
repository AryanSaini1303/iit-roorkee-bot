'use client';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Or any preferred theme
import styles from './ChatResponse.module.css';

export default function ChatResponse({ content }) {
  return (
    <div className={styles.container}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}