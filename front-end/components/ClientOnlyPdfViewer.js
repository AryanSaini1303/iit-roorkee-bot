'use client';

import dynamic from 'next/dynamic';

// ⛔ Prevent SSR to avoid DOMMatrix error
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
});

export default PdfViewer;
