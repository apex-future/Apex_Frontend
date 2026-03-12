import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import { Loader2 } from 'lucide-react';
import BookSkeleton from './BookSkeleton';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker — static path so the service worker can precache it
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

/**
 * Scans all text nodes inside `container`, concatenates them, finds `searchText`,
 * then wraps the matching character range across text nodes with <mark> elements.
 */
function applyHighlightToDOM(container, searchText, color) {
  if (!container || !searchText) return;

  // Collect all text nodes via TreeWalker
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    // Skip nodes already inside a <mark> we created
    if (node.parentElement?.classList?.contains('apex-hl')) continue;
    textNodes.push(node);
  }

  // Build a concatenated string with character offset mapping
  let fullText = '';
  const nodeMap = []; // { node, start, end }
  for (const tn of textNodes) {
    const start = fullText.length;
    fullText += tn.textContent;
    nodeMap.push({ node: tn, start, end: fullText.length });
  }

  // Find the highlight text (case-insensitive) in the concatenated string
  const lowerFull = fullText.toLowerCase();
  const lowerSearch = searchText.toLowerCase();
  let idx = lowerFull.indexOf(lowerSearch);

  while (idx !== -1) {
    const matchStart = idx;
    const matchEnd = idx + lowerSearch.length;

    // Find which text nodes overlap with [matchStart, matchEnd)
    for (let i = 0; i < nodeMap.length; i++) {
      const nm = nodeMap[i];
      if (nm.end <= matchStart || nm.start >= matchEnd) continue;

      // This text node overlaps with the match
      const overlapStart = Math.max(0, matchStart - nm.start);
      const overlapEnd = Math.min(nm.node.textContent.length, matchEnd - nm.start);

      try {
        const range = document.createRange();
        range.setStart(nm.node, overlapStart);
        range.setEnd(nm.node, overlapEnd);

        const mark = document.createElement('mark');
        mark.className = 'apex-hl';
        mark.style.backgroundColor = color;
        mark.style.color = 'inherit';
        mark.style.borderRadius = '2px';
        mark.style.padding = '0';
        range.surroundContents(mark);

        // After wrapping, the nodeMap is stale — break and re-search won't work
        // for the same highlight, but that's fine since we found the match
      } catch (e) {
        // If surroundContents fails (cross-element), skip this node portion
      }
    }

    // Search for next occurrence after this one
    idx = lowerFull.indexOf(lowerSearch, matchEnd);
  }
}

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
  const [pageRendered, setPageRendered] = useState(0);

  // Called when react-pdf finishes rendering a page
  const handlePageRenderSuccess = useCallback(() => {
    setPageRendered(prev => prev + 1);
  }, []);

  // Post-render: apply highlights to the text layer DOM
  // This handles multi-span highlights that customTextRenderer can't match
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const pageHighlights = highlights.filter(
      (h) => (h.page || h.pageNumber) === pageNumber
    );
    if (pageHighlights.length === 0) return;

    // Wait a tick for the text layer to be fully in the DOM
    const timer = setTimeout(() => {
      const textLayer = container.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) return;

      // Remove any previously applied highlight marks to avoid duplicates
      textLayer.querySelectorAll('mark.apex-hl').forEach((m) => {
        const parent = m.parentNode;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
      });

      // Apply each highlight
      for (const h of pageHighlights) {
        const text = h.text || h.highlightedText || '';
        if (text) applyHighlightToDOM(textLayer, text, h.color || '#fef08a');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [highlights, pageNumber, pageRendered]);

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
          className="rounded-sm bg-bg-elevated mx-auto mb-8 lg:mb-0"
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
            onRenderSuccess={handlePageRenderSuccess}
            className="bg-bg-elevated"
            width={pdfWidth}
            loading={
                <div className="flex flex-col items-center justify-center bg-bg-elevated" style={{ width: pdfWidth, height: pdfWidth * 1.41 }}>
                     <div className="w-full h-full p-8 space-y-4 animate-pulse">
                        <div className="h-4 w-1/3 bg-bg-subtle rounded-full" />
                        <div className="space-y-4">
                            <div className="h-2 w-full bg-bg-subtle rounded-full" />
                            <div className="h-2 w-full bg-bg-subtle rounded-full" />
                            <div className="h-2 w-2/3 bg-bg-subtle rounded-full" />
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
