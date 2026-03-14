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
  scrollOrientation = 'vertical',
  onPageChange,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(windowSize?.width || window.innerWidth);
  const [pageRendered, setPageRendered] = useState(0);
  const [maxPagesToRender, setMaxPagesToRender] = useState(3);
  const isVertical = scrollOrientation === 'vertical';

  const isJumping = useRef(false);
  const lastReportedPage = useRef(pageNumber);
  const pendingJump = useRef(null);

  // Sync internal state when pageNumber prop changes programmatically
  useEffect(() => {
    if (pageNumber !== lastReportedPage.current) {
      pendingJump.current = pageNumber;
    }
  }, [pageNumber]);

  // Timed lazy loading for vertical mode
  useEffect(() => {
    if (!isVertical || !numPages) return;
    
    // Reset if book or numPages changes
    setMaxPagesToRender(3);

    const timer = setTimeout(() => {
      setMaxPagesToRender(numPages);
    }, 3000); // Load the rest after 3 seconds

    return () => clearTimeout(timer);
  }, [isVertical, numPages, fileUrl]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  // IntersectionObserver to track which page is current in vertical mode
  useEffect(() => {
    if (!isVertical || !numPages) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: '0px 0px -90% 0px', 
      threshold: [0, 0.01, 0.1, 0.5, 1.0],
    };

    const observerCallback = (entries) => {
      // Ignore scroll updates if we're in the middle of a jump
      if (isJumping.current || pendingJump.current !== null) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length === 0) return;

      let bestPage = -1;
      let minTopDiff = Infinity;

      visibleEntries.forEach((entry) => {
          const rect = entry.target.getBoundingClientRect();
          const topDiff = Math.abs(rect.top - containerRect.top);
          if (topDiff < minTopDiff) {
              minTopDiff = topDiff;
              bestPage = parseInt(entry.target.dataset.pageIndex, 10);
          }
      });

      if (bestPage !== -1 && bestPage !== pageNumber) {
        lastReportedPage.current = bestPage;
        onPageChangeRef.current?.(bestPage);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const pageElements = containerRef.current?.querySelectorAll('.pdf-page-wrapper');
    pageElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isVertical, numPages, pageRendered, maxPagesToRender, pageNumber]);

  // Handle programmatic scroll for goToPage in vertical mode
  useEffect(() => {
    if (isVertical && containerRef.current && pendingJump.current !== null) {
        const targetPageNumber = pendingJump.current;

        // If we're jumping to a page not yet rendered, force render all pages immediately
        if (targetPageNumber > maxPagesToRender) {
            setMaxPagesToRender(numPages);
            // The effect will re-run when maxPagesToRender updates
            return;
        }

        const targetPage = containerRef.current.querySelector(`[data-page-index="${targetPageNumber}"]`);
        
        if (targetPage) {
            isJumping.current = true;
            targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Sync refs and clear pending jump
            lastReportedPage.current = targetPageNumber;
            pendingJump.current = null;

            const timeout = setTimeout(() => {
                isJumping.current = false;
            }, 1000); 
            
            return () => clearTimeout(timeout);
        }
    }
  }, [pageNumber, isVertical, maxPagesToRender, numPages]);

  // Called when react-pdf finishes rendering a page
  const handlePageRenderSuccess = useCallback(() => {
    setPageRendered(prev => prev + 1);
  }, []);

  // Post-render: apply highlights to the text layer DOM
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const applyToPage = (pageNum, pageEl) => {
        const pageHighlights = highlights.filter(
            (h) => (h.page || h.pageNumber) === pageNum
        );
        if (pageHighlights.length === 0) return;

        const textLayer = pageEl.querySelector('.react-pdf__Page__textContent');
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
    };

    const timer = setTimeout(() => {
        if (isVertical) {
            container.querySelectorAll('.pdf-page-wrapper').forEach((wrapper) => {
                const pageNum = parseInt(wrapper.dataset.pageIndex, 10);
                applyToPage(pageNum, wrapper);
            });
        } else {
            const pageEl = container.querySelector('.react-pdf__Page');
            if (pageEl) applyToPage(pageNumber, container);
        }
    }, 400);

    return () => clearTimeout(timer);
  }, [highlights, pageNumber, pageRendered, isVertical]);

  const customTextRenderer = React.useCallback(
    ({ str, itemIndex, pageIndex }) => {
      // Note: react-pdf might not pass pageIndex here easily, but we can infer or filter
      // For now, we'll keep the existing logic which was single-page focused.
      // In vertical mode, we might need a more robust way to match highlights to pages.
      // However, the post-render highlight application (above) is more reliable for multi-span.
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

  const lastEdgeHit = useRef({ left: 0, right: 0 });

  // Swipe handlers — only for horizontal mode
  const handleSwipedLeft = () => {
    if (locked || isVertical) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 20;
        if (!isAtRightEdge) return;

        // Implementation of double-swipe confirmation for zoomed edges
        const now = Date.now();
        if (now - lastEdgeHit.current.right > 2000) {
            lastEdgeHit.current.right = now;
            // Maybe show a subtle hint here in the future
            return;
        }
        // If we reach here, it's the second swipe within 2s
        lastEdgeHit.current.right = 0;
      }
    }
    onNextPage?.();
  };

  const handleSwipedRight = () => {
    if (locked || isVertical) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtLeftEdge = el.scrollLeft <= 20;
        if (!isAtLeftEdge) return;

        // Implementation of double-swipe confirmation for zoomed edges
        const now = Date.now();
        if (now - lastEdgeHit.current.left > 2000) {
            lastEdgeHit.current.left = now;
            return;
        }
        // If we reach here, it's the second swipe within 2s
        lastEdgeHit.current.left = 0;
      }
    }
    onPrevPage?.();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: !isVertical ? handleSwipedLeft : undefined,
    onSwipedRight: !isVertical ? handleSwipedRight : undefined,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
    swipeDuration: 500,
  });

  return (
    <div
      ref={containerRef}
      {...swipeHandlers}
      className={`flex-1 flex flex-col items-center h-full max-h-full ${isDesktop ? 'p-4' : 'p-0 w-full'} relative ${locked ? 'overflow-hidden' : 'overflow-auto touch-auto custom-scrollbar'}`}
      id="pdf-container"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoad}
        onLoadError={(err) => console.error('PDF load error:', err)}
        loading={<BookSkeleton message="Rendering document..." />}
        className="flex flex-col items-center sm:items-start justify-start min-h-full w-full mx-auto"
      >
        {isVertical ? (
          // Render all pages for vertical flow with lazy loading
          Array.from({ length: numPages || 0 }, (_, i) => {
            const pageIdx = i + 1;
            const shouldRender = pageIdx <= maxPagesToRender;
            
            return (
              <div 
                  key={i} 
                  className="pdf-page-wrapper mx-auto flex flex-col items-center justify-center min-h-full w-full bg-bg-elevated relative" 
                  style={{ minHeight: isVertical ? '100%' : (pdfWidth * 1.41 * scale) }}
                  data-page-index={pageIdx}
              >
                {shouldRender ? (
                  <Page
                    pageNumber={pageIdx}
                    rotate={rotation}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={handlePageRenderSuccess}
                    width={pdfWidth}
                    className="!shadow-none" 
                    loading={
                        <div className="flex flex-col items-center justify-center bg-bg-elevated" style={{ width: pdfWidth, height: pdfWidth * 1.41 * scale }}>
                             <div className="w-full h-full p-8 space-y-4 animate-pulse text-center">
                                <div className="h-4 w-1/3 bg-bg-subtle rounded-full mx-auto" />
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-bg-subtle rounded-full" />
                                    <div className="h-2 w-full bg-bg-subtle rounded-full" />
                                    <div className="h-2 w-2/3 bg-bg-subtle rounded-full mx-auto" />
                                </div>
                             </div>
                        </div>
                    }
                  />
                ) : (
                  // Placeholder for lazy loading
                  <div className="flex flex-col items-center justify-center bg-bg-elevated/20" style={{ width: pdfWidth, height: pdfWidth * 1.41 * scale }}>
                     <p className="text-text-tertiary text-xs font-black uppercase tracking-widest opacity-20">Page {pageIdx}</p>
                  </div>
                )}
                {/* Visual Divider - Absolute to ensure it's on top of page content */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/60 dark:bg-white/20 z-20 pointer-events-none" />
              </div>
            );
          })
        ) : (
          // Single page for horizontal mode
          <div
            className="rounded-sm bg-bg-elevated mx-auto mb-8 lg:mb-0"
            style={{ transition: 'transform 0.25s ease-out' }}
          >
            <Page
              pageNumber={pageNumber}
              rotate={rotation}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onRenderSuccess={handlePageRenderSuccess}
              width={pdfWidth}
              className="bg-bg-elevated"
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
        )}
      </Document>
    </div>
  );
};

export default PDFReader;
