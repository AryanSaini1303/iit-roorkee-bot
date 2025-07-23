'use client';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Or any preferred theme
import styles from './ChatResponse.module.css';

export default function ChatResponse({ content, pages, func }) {
  return (
    <div className={styles.container}>
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
      <section className={styles.pagesInfo} onClick={() => func(true)}>
        {pages?.length!==0 && (
          <p>
            <em>Referenced pages: {pages.join(', ')}</em>
          </p>
        )}
        {/* <button onClick={() => func(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.4em"
            height="1.4em"
          >
            <path
              fill="currentColor"
              d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm11-3v8h-2V6.413l-7.793 7.794l-1.414-1.414L17.585 5H13V3z"
            ></path>
          </svg>
        </button> */}
      </section>
    </div>
  );
}
