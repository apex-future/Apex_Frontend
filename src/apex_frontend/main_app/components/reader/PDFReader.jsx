import React, { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import { Loader2 } from 'lucide-react';
import BookSkeleton from './BookSkeleton';
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
  numPages,
  goToPage,
  windowSize,
  highlights = [],
  locked = false,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(windowSize?.width || window.innerWidth);

  const customTextRenderer = React.useCallback(
    ({ str }) => {
      if (!highlights || highlights.length === 0) return str;

      const pageHighlights = highlights.filter((h) => h.page === pageNumber);
      if (pageHighlights.length === 0) return str;

      // Sort highlights by length (longest first) to avoid partial matches
      const sortedHighlights = [...pageHighlights].sort((a, b) => b.text.length - a.text.length);

      for (const h of sortedHighlights) {
        const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (str.includes(h.text)) {
          const parts = str.split(new RegExp(`(${escapedText})`, 'gi'));
          return (
            <span>
              {parts.map((part, i) => 
                part.toLowerCase() === h.text.toLowerCase() ? (
                  <mark key={i} style={{ backgroundColor: h.color, color: 'black', borderRadius: '2px', padding: '0 1px' }}>
                    {part}
                  </mark>
                ) : (
                  part
                )
              )}
            </span>
          );
        }
      }

      return str;
    },
    [highlights, pageNumber]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isDesktop = containerWidth > 1024;

  // Edge-to-edge on mobile, margin on desktop
  const pdfWidth = isDesktop
    ? Math.min(containerWidth - 120, 1100)
    : containerWidth;

  // Swipe handlers — only meaningful on touch devices (mobile/tablet < md)
  const handleSwipedLeft = () => {
    if (locked) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        // Check if we are at the right edge (within a small buffer)
        const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 20;
        if (!isAtRightEdge) return;
      }
    }
    onNextPage?.();
  };

  const handleSwipedRight = () => {
    if (locked) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        // Check if we are at the left edge (within a small buffer)
        const isAtLeftEdge = el.scrollLeft <= 20;
        if (!isAtLeftEdge) return;
      }
    }
    onPrevPage?.();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipedLeft,
    onSwipedRight: handleSwipedRight,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
    swipeDuration: 500,
  });

  return (
    <div
      ref={containerRef}
      {...swipeHandlers}
      className={`flex-1 flex flex-col items-center justify-center lg:justify-start h-full max-h-full ${isDesktop ? 'p-4' : 'p-0 w-full'} relative ${locked ? 'overflow-hidden' : 'overflow-auto touch-auto'}`}
      id="pdf-container"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoad}
        onLoadError={(err) => console.error('PDF load error:', err)}
        loading={<BookSkeleton message="Rendering document..." />}
        className="flex flex-col items-start lg:items-center justify-center lg:justify-start min-h-full w-full mx-auto"
      >
        <div
          className="rounded-sm bg-white mx-auto mb-8 lg:mb-0"
          style={{
            transition: 'transform 0.25s ease-out',
          }}
        >
          <Page
            pageNumber={pageNumber}
            rotate={rotation}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            customTextRenderer={customTextRenderer}
            className="bg-white"
            width={pdfWidth}
            loading={
                <div className="flex flex-col items-center justify-center bg-white" style={{ width: pdfWidth, height: pdfWidth * 1.41 }}>
                     <div className="w-full h-full p-8 space-y-4 animate-pulse">
                        <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
                        <div className="space-y-4">
                            <div className="h-2 w-full bg-slate-50 rounded-full" />
                            <div className="h-2 w-full bg-slate-50 rounded-full" />
                            <div className="h-2 w-2/3 bg-slate-50 rounded-full" />
                        </div>
                     </div>
                </div>
            }
          />
        </div>
      </Document>
    </div>
  );
};

export default PDFReader;
