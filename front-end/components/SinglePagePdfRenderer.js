'use client';

import { useEffect, useRef } from 'react';
import { getDocument } from 'pdfjs-dist';
import setPdfWorker from '@/components/pdfWorker'; // adjust path as needed

export default function SinglePagePdfRenderer({ pdfUrl, pageNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    setPdfWorker();

    const renderPage = async () => {
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);

      const scale = 2;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pdfUrl, pageNumber]);

  return <canvas ref={canvasRef} style={{ height: '100%', width: '100%', scale:"1.15"}} />;
}
