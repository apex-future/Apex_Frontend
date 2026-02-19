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
  locked = false,
}) => {
  // Swipe handlers — only meaningful on touch devices (mobile/tablet < md)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => !locked && onNextPage?.(),
    onSwipedRight: () => !locked && onPrevPage?.(),
    trackMouse: false,       // desktop mouse drags should NOT trigger page turns
    preventScrollOnSwipe: true,
    delta: 50,               // minimum swipe distance in px
    swipeDuration: 500,
  });

  return (
    <div
      {...swipeHandlers}
      className={`flex-1 flex justify-center items-start p-4 relative select-none ${locked ? 'overflow-hidden' : 'overflow-auto touch-pan-y'}`}
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
            width={window.innerWidth > 800 ? 800 : window.innerWidth - 32}
          />
        </div>
      </Document>
    </div>
  );
};

export default PDFReader;
