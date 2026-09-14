'use client';
import styles from './PagesComponent.module.css';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const SinglePagePdfRenderer = dynamic(
  () => import('@/components/SinglePagePdfRenderer'),
  {
    ssr: false,
  },
);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PagesComponent({ pages, func, pageData, context }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUrlError, setPdfUrlError] = useState(false);

  const pdfContext = context
    .filter(
      (item) =>
        item.pdf_name === pageData.name &&
        item.page_num === Number(pageData.pageNum.split(' ')[1]),
    )
    .flatMap((item) => item.content)
    .flatMap((sentence) => {
      const words = sentence.split(/\s+/);
      const chunks = [];
      for (let i = 0; i < words.length; i += 5) {
        chunks.push(words.slice(i, i + 5).join(' '));
      }
      return chunks;
    });

  useEffect(() => {
    let cancelled = false;
    setPdfUrl(null);
    setPdfUrlError(false);

    fetch(
      `${BACKEND_URL}/getViewUrl?filename=${encodeURIComponent(`${pageData.name}.pdf`)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch view URL: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPdfUrl(data.viewUrl);
      })
      .catch((err) => {
        console.error('Error fetching presigned PDF URL:', err);
        if (!cancelled) setPdfUrlError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pageData.name]);

  return (
    <section className={styles.pagesSection}>
      <section className={styles.buttonContainer}>
        <button className={styles.crossBtn} onClick={() => func(false)}>
          {/* ...svg unchanged... */}
        </button>
        <section className={styles.pageControlContainer}>
          <section className={styles.pageControl}>
            <strong>{pageData.pageNum.split(' ')[1]}</strong>
          </section>
          <p style={{ textAlign: 'center' }}>{pageData.name}</p>
        </section>
      </section>
      <section className={styles.pagesContainer}>
        {pdfUrlError && (
          <p style={{ textAlign: 'center' }}>Couldn't load this document.</p>
        )}
        {!pdfUrlError && !pdfUrl && (
          <p style={{ textAlign: 'center' }}>Loading page...</p>
        )}
        {pdfUrl && (
          <SinglePagePdfRenderer
            key={`${pageData.name}-${pageData.pageNum.split(' ')[1]}`}
            pdfUrl={pdfUrl}
            pageNumber={pageData.pageNum.split(' ')[1]}
            highlights={pdfContext}
          />
        )}
      </section>
    </section>
  );
}