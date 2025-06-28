import { GlobalWorkerOptions } from 'pdfjs-dist';

const setPdfWorker = () => {
  GlobalWorkerOptions.workerSrc = `/pdf.worker.js`; // Will serve from public/
};

export default setPdfWorker;
