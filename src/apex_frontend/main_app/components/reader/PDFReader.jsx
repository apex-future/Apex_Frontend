import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDFReader = ({
  fileUrl,
  pageNumber,
  scale,
  rotation,
  onDocumentLoad,
  onNextPage,
  onPrevPage,
  windowSize,
  locked = false,
}) => {
  const currentWidth = windowSize?.width || window.innerWidth;
  const isDesktop = currentWidth > 1024;

  // Edge-to-edge on mobile (0 padding), small margin on desktop
  const pdfWidth = isDesktop
    ? Math.min(currentWidth - 120, 1100)
    : currentWidth;

  // Swipe handlers — only meaningful on touch devices (mobile/tablet < md)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => !locked && onNextPage?.(),
    onSwipedRight: () => !locked && onPrevPage?.(),
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 50,
    swipeDuration: 500,
  });

  return (
    <div
      {...swipeHandlers}
      className={`flex-1 flex justify-center items-start ${isDesktop ? 'p-4' : 'p-0'} relative ${locked ? 'overflow-hidden' : 'overflow-auto touch-pan-y'}`}
      id="pdf-container"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoad}
        onLoadError={(err) => console.error('PDF load error:', err)}
        loading={
          <div className="flex items-center justify-center h-full w-full min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary opacity-60" />
          </div>
        }
        className="flex flex-col items-center"
      >
        <div
          className="shadow-2xl rounded-sm overflow-hidden"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.25s ease-out',
          }}
        >
          <Page
            pageNumber={pageNumber}
            rotate={rotation}
            scale={1}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="bg-white"
            width={pdfWidth}
          />
        </div>
      </Document>
    </div>
  );
};

export default PDFReader;
