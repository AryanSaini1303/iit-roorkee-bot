import { useState } from 'react';
import styles from './PagesList.module.css';

export default function PagesList({ idx, pagesData, func, setClickIndex }) {
  const [visible, setVisible] = useState(true);

  if (!pagesData || !pagesData[idx] || !visible) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Referenced Pages</h3>
        {pagesData.length - 1 !== idx && (
          <em
            onClick={(e) => {
              setVisible(false);
              e.stopPropagation();
              setClickIndex(-1);
            }}
            className={styles.hideBtn}
            title="Hide references"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              width="1.25em"
              height="1.25em"
            >
              <path
                fill="currentColor"
                d="m12.81 4.36-1.77 1.78a4 4 0 0 0-4.9 4.9l-2.76 2.75C2.06 12.79.96 11.49.2 10a11 11 0 0 1 12.6-5.64zm3.8 1.85c1.33 1 2.43 2.3 3.2 3.79a11 11 0 0 1-12.62 5.64l1.77-1.78a4 4 0 0 0 4.9-4.9l2.76-2.75zm-.25-3.99l1.42 1.42L3.64 17.78l-1.42-1.42z"
              ></path>
            </svg>
          </em>
        )}
      </div>

      <ol className={styles.list}>
        {Object.keys(pagesData[idx]).map((pdf, index) => (
          <li key={index} className={styles.listItem}>
            <span className={styles.pdfName}>{pdf}</span>
            <ul className={styles.pageList}>
              {pagesData[idx][pdf].map((pageNum, i) => (
                <li
                  key={i}
                  className={styles.pageBadge}
                  onClick={() =>
                    func({ name: pdf, pageNum: pagesData[idx][pdf][i] })
                  }
                >
                  {pageNum}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
