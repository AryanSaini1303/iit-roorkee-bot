'use client';

import { useEffect, useRef } from 'react';
import { getDocument } from 'pdfjs-dist';
import setPdfWorker from '@/components/pdfWorker';

export default function SinglePagePdfRenderer({
  pdfUrl,
  pageNumber,
  key,
  highlights = [],
}) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // to store the current render task

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  useEffect(() => {
    setPdfWorker();

    let cancelled = false;

    const renderPage = async () => {
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      // console.log(pdf);

      if (cancelled) {
        pdf.destroy(); // cleanup if cancelled
        return;
      }

      const page = await pdf.getPage(parseInt(pageNumber));

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

      const textContent = await page.getTextContent();
      const highlightRegexes = highlights.map(
        (h) => new RegExp(escapeRegex(h.toLowerCase()), 'gi'),
      );

      try {
        await renderTaskRef.current.promise;
        textContent.items.forEach((item) => {
          const itemText = item.str;
          const [a, b, c, d, e, f] = item.transform;
          const x = e * scale;
          const y = viewport.height - f * scale;
          const width = item.width * scale;
          const height = (item.height || 10) * scale;

          highlightRegexes.forEach((regex) => {
            if (regex.test(itemText.toLowerCase())) {
              // console.log(itemText);
              context.fillStyle = 'rgba(255, 242, 0, 0.25)'; // yellow highlight
              context.fillRect(x, y - height, width, height);
            }
          });
        });
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

  return (
    <canvas
      ref={canvasRef}
      style={{ height: '100%', width: '100%', transform: 'scale(1.15)' }}
      key={key}
    />
  );
}
