'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoaderComponent from '@/components/loader';
import styles from './page.module.css';

const SinglePagePdfRenderer = dynamic(
  () => import('@/components/SinglePagePdfRenderer'),
  { ssr: false },
);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

// same 5-word chunking PagesComponent uses for highlights
function toHighlights(contents) {
  return contents.flatMap((sentence) => {
    const words = String(sentence).split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += 5) {
      chunks.push(words.slice(i, i + 5).join(' '));
    }
    return chunks;
  });
}

export default function ReferencePage() {
  const { token } = useParams();
  const [pdfs, setPdfs] = useState(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null); // { name, page, highlights }
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/refs/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load references: ${res.status}`);
        return res.json();
      })
      .then((data) => setPdfs(data.pdfs))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [token]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setPdfUrl(null);
    fetch(
      `${BACKEND_URL}/getViewUrl?filename=${encodeURIComponent(`${selected.name}.pdf`)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch view URL: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPdfUrl(data.viewUrl);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.name]);

  if (error) {
    return (
      <main className={styles.state}>
        This reference link isn&apos;t valid, or the file couldn&apos;t be
        loaded.
      </main>
    );
  }
  if (!pdfs) {
    return (
      <main className={styles.state}>
        <LoaderComponent />
        <p>Loading references…</p>
      </main>
    );
  }

  if (selected) {
    return (
      <main className={styles.viewer}>
        <header className={styles.viewerBar}>
          <button onClick={() => setSelected(null)}>← Back</button>
          <span>
            {selected.name} · Page {selected.page}
          </span>
        </header>
        <div className={styles.viewerBody}>
          {pdfUrl ? (
            <div className={styles.pdfFrame}>
              <div className={styles.pdfInner}>
                <SinglePagePdfRenderer
                  key={`${selected.name}-${selected.page}`}
                  pdfUrl={pdfUrl}
                  pageNumber={String(selected.page)}
                  highlights={toHighlights(selected.highlights)}
                />
              </div>
            </div>
          ) : (
            <div className={styles.pageLoading}>
              <LoaderComponent />
              <p>Loading page…</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.list}>
      <h1>References</h1>
      {pdfs.length === 0 && <p>No references for this answer.</p>}
      {pdfs.map((pdf) => (
        <section key={pdf.name} className={styles.pdfCard}>
          <h2>{pdf.name}</h2>
          <div className={styles.chips}>
            {pdf.pages.map((p) => (
              <button
                key={p.page}
                className={styles.chip}
                onClick={() =>
                  setSelected({
                    name: pdf.name,
                    page: p.page,
                    highlights: p.highlights,
                  })
                }
              >
                Page {p.page}
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
