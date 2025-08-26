'use client';

import { useEffect, useRef } from 'react';
import { getDocument } from 'pdfjs-dist';
import setPdfWorker from '@/components/pdfWorker';

export default function SinglePagePdfRenderer({ pdfUrl, pageNumber, key }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // to store the current render task

  useEffect(() => {
    setPdfWorker();

    let cancelled = false;

    const renderPage = async () => {
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      if (cancelled) {
        pdf.destroy(); // cleanup if cancelled
        return;
      }

      const page = await pdf.getPage(pageNumber);

      if (cancelled) {
        pdf.destroy();
        return;
      }

      const scale = 2;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      // clear previous canvas content
      context.clearRect(0, 0, canvas.width, canvas.height);

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport,
      });

      try {
        await renderTaskRef.current.promise;
      } catch (err) {
        if (err?.name === 'RenderingCancelledException') {
          // ignore cancellation errors
        } else {
          console.error(err);
        }
      } finally {
        pdf.destroy();
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel(); // cancel ongoing render
      }
    };
  }, [pdfUrl, pageNumber]);

  return <canvas ref={canvasRef} style={{ height: '100%', width: '100%', scale: '1.15' }} key={key} />;
}
