import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import BookSkeleton from './BookSkeleton';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker - using Vite's native URL asset handling
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Scans all text nodes inside `container`, finds `searchText`, and returns an array of Range objects.
 * Adds spaces between text nodes to match browser selection behavior across PDF text spans.
 */
function getHighlightRanges(container, searchText) {
  if (!container || !searchText) return [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Build full text with space separators between nodes
  // PDF text layer spans are positioned separately; browsers add whitespace between them in selections
  let fullText = '';
  const nodeMap = [];
  for (let i = 0; i < textNodes.length; i++) {
    const tn = textNodes[i];
    // Add a space between nodes if previous doesn't end with space and current doesn't start with one
    if (i > 0 && fullText.length > 0 && !fullText.endsWith(' ') && !tn.textContent.startsWith(' ')) {
      fullText += ' ';
    }
    const start = fullText.length;
    fullText += tn.textContent;
    nodeMap.push({ node: tn, start, end: fullText.length });
  }

  // Normalize whitespace in search text to match the way we built fullText
  const normalizedSearch = searchText.replace(/\s+/g, ' ').trim();

  const lowerFull = fullText.toLowerCase();
  const lowerSearch = normalizedSearch.toLowerCase();
  let idx = lowerFull.indexOf(lowerSearch);
  const ranges = [];

  while (idx !== -1) {
    const matchStart = idx;
    const matchEnd = idx + lowerSearch.length;
    for (let i = 0; i < nodeMap.length; i++) {
        const nm = nodeMap[i];
        if (nm.end <= matchStart || nm.start >= matchEnd) continue;
        const overlapStart = Math.max(0, matchStart - nm.start);
        const overlapEnd = Math.min(nm.node.textContent.length, matchEnd - nm.start);
        try {
            const range = document.createRange();
            range.setStart(nm.node, overlapStart);
            range.setEnd(nm.node, overlapEnd);
            ranges.push(range);
        } catch (e) {}
    }
    idx = lowerFull.indexOf(lowerSearch, matchEnd);
  }
  return ranges;
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
  const isDesktop = containerWidth > 1024;
  const pdfWidth = isDesktop ? Math.min(containerWidth - 120, 1100) : containerWidth;
  const [pageRendered, setPageRendered] = useState(0);
  const [renderedPages, setRenderedPages] = useState(new Set());
  const [displayedPage, setDisplayedPage] = useState(pageNumber);
  const [isFading, setIsFading] = useState(false);
  const isVertical = scrollOrientation === 'vertical';

  const rowVirtualizer = useVirtualizer({
    count: numPages || 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => Math.round(pdfWidth * 1.41 * scale),
    overscan: 2,
  });

  console.log('[PDFReader] virtualizer items in view:', rowVirtualizer.getVirtualItems().length, '/', numPages);

  const isJumping = useRef(false);
  const lastReportedPage = useRef(pageNumber);
  const pendingJump = useRef(null);

  // Sync internal state when pageNumber prop changes programmatically
  useEffect(() => {
    if (pageNumber !== lastReportedPage.current) {
      pendingJump.current = pageNumber;
    }
  }, [pageNumber]);

  // Horizontal crossfade on page change
  useEffect(() => {
    if (isVertical) return;
    if (pageNumber === displayedPage) return;

    console.log('[PDFReader] horizontal crossfade from', displayedPage, 'to', pageNumber);
    setIsFading(true);

    const timer = setTimeout(() => {
      setDisplayedPage(pageNumber);
      setIsFading(false);
    }, 150); // 150ms fade-out, then swap

    return () => clearTimeout(timer);
  }, [pageNumber, isVertical]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  // Scroll handler for vertical mode — detects which page is at the top
  const handleVerticalScroll = useCallback(() => {
    if (!isVertical || !numPages) return;
    if (isJumping.current) return;

    const container = containerRef.current;
    if (!container) return;

    const pageElements = container.querySelectorAll('.pdf-page-wrapper');
    if (!pageElements.length) return;

    const containerTop = container.getBoundingClientRect().top;
    let bestPage = -1;
    let minTopDiff = Infinity;

    pageElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const topDiff = Math.abs(rect.top - containerTop);
      if (topDiff < minTopDiff) {
        minTopDiff = topDiff;
        bestPage = parseInt(el.dataset.pageIndex, 10);
      }
    });

    if (bestPage !== -1 && bestPage !== lastReportedPage.current) {
      lastReportedPage.current = bestPage;
      onPageChangeRef.current?.(bestPage);
    }
  }, [isVertical, numPages]);

  // Handle programmatic scroll for goToPage in vertical mode
  useEffect(() => {
    if (!isVertical || !rowVirtualizer || !numPages) return;
    if (pageNumber === lastReportedPage.current) return;
    console.log('[PDFReader] jumping to page via virtualizer:', pageNumber);
    rowVirtualizer.scrollToIndex(pageNumber - 1, { align: 'start', behavior: 'smooth' });
    lastReportedPage.current = pageNumber;
  }, [pageNumber, isVertical, numPages]);

  // Called when react-pdf finishes rendering a page
  const handlePageRenderSuccess = useCallback(() => {
    setPageRendered(prev => prev + 1);
  }, []);

  // Post-render: apply highlights to the text layer DOM safely without breaking React Node hierarchy
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const collectedRanges = {}; // { "#fef08a": [range1, range2] }
    // Force fallback overlay on mobile — CSS Highlight API doesn't render colors correctly on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const useCSSHighlight = !isTouchDevice && 'highlights' in CSS;

    const applyToPage = (pageNum, pageEl) => {
        const pageHighlights = highlights.filter(
            (h) => (h.page || h.pageNumber) === pageNum
        );
        if (pageHighlights.length === 0) return;

        const textLayer = pageEl.querySelector('.react-pdf__Page__textContent');
        if (!textLayer) return;

        // Clean up old fallback overlays
        pageEl.querySelectorAll('.apex-fallback-hl-layer').forEach(el => el.remove());

        let hlLayer = null;
        if (!useCSSHighlight) {
            hlLayer = document.createElement('div');
            hlLayer.className = 'apex-fallback-hl-layer';
            // Overlay absolutely on the page wrapper
            hlLayer.style.position = 'absolute';
            hlLayer.style.top = '0';
            hlLayer.style.left = '0';
            hlLayer.style.width = '100%';
            hlLayer.style.height = '100%';
            hlLayer.style.pointerEvents = 'none';
            hlLayer.style.zIndex = '10'; // Above text layer so multiply blend works well
            hlLayer.style.mixBlendMode = 'multiply';
            pageEl.appendChild(hlLayer);
        }

        const pageRect = pageEl.getBoundingClientRect();

        for (const h of pageHighlights) {
            const text = h.text || h.highlightedText || '';
            let color = h.color || '#fef08a';
            if (!text) continue;

            // Make solid hex colors partially transparent (approx 40% opacity = '66')
            const displayColor = color.length === 7 && color.startsWith('#') ? color + '66' : color;

            const ranges = getHighlightRanges(textLayer, text);
            if (ranges.length === 0) continue;

            if (useCSSHighlight) {
                if (!collectedRanges[color]) collectedRanges[color] = [];
                collectedRanges[color].push(...ranges);
            } else if (hlLayer) {
                for (const range of ranges) {
                    const rects = range.getClientRects();
                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        const div = document.createElement('div');
                        div.style.position = 'absolute';
                        div.style.left = `${rect.left - pageRect.left}px`;
                        div.style.top = `${rect.top - pageRect.top}px`;
                        div.style.width = `${rect.width}px`;
                        div.style.height = `${rect.height}px`;
                        div.style.backgroundColor = displayColor;
                        div.style.borderRadius = '2px';
                        hlLayer.appendChild(div);
                    }
                }
            }
        }
    };

    const timer = setTimeout(() => {
        if (useCSSHighlight) CSS.highlights.clear();

        container.querySelectorAll('.pdf-page-wrapper').forEach((wrapper) => {
            const pageNum = parseInt(wrapper.dataset.pageIndex, 10);
            if (!isNaN(pageNum)) applyToPage(pageNum, wrapper);
        });

        if (useCSSHighlight) {
            let styleText = '';
            for (const [color, ranges] of Object.entries(collectedRanges)) {
                if (ranges.length === 0) continue;
                const displayColor = color.length === 7 && color.startsWith('#') ? color + '66' : color;
                const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
                const highlightName = `apex-hl-${safeColor}`;
                const highlight = new Highlight(...ranges);
                CSS.highlights.set(highlightName, highlight);
                styleText += `::highlight(${highlightName}) { background-color: ${displayColor}; color: transparent; }\n`;
            }
            let styleEl = document.getElementById('apex-css-highlights');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'apex-css-highlights';
                document.head.appendChild(styleEl);
            }
            if (styleEl.textContent !== styleText) {
                styleEl.textContent = styleText;
            }
        }
    }, 400);

    return () => {
        clearTimeout(timer);
        if (useCSSHighlight) CSS.highlights.clear();
    };
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

  // Merge our containerRef with the swipeHandlers ref
  const mergedRef = useCallback((node) => {
    containerRef.current = node;
    if (swipeHandlers.ref) {
      if (typeof swipeHandlers.ref === 'function') {
        swipeHandlers.ref(node);
      } else {
        swipeHandlers.ref.current = node;
      }
    }
  }, [swipeHandlers.ref]);

  return (
    <div
      {...swipeHandlers}
      ref={mergedRef}
      onScroll={isVertical ? handleVerticalScroll : undefined}
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
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const pageIdx = virtualRow.index + 1;
              return (
                <div
                  key={virtualRow.index}
                  className="pdf-page-wrapper absolute left-0 w-full flex flex-col items-center bg-bg-elevated"
                  data-page-index={pageIdx}
                  style={{
                    top: `${virtualRow.start}px`,
                    height: `${virtualRow.size}px`,
                  }}
                >
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
                      <div
                        className="flex flex-col items-center justify-center bg-bg-elevated animate-pulse"
                        style={{ width: pdfWidth, height: Math.round(pdfWidth * 1.41 * scale) }}
                      >
                        <div className="w-full h-full p-8 space-y-4">
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
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/50 dark:bg-black/70 z-20 pointer-events-none" />
                </div>
              );
            })}
          </div>
        ) : (
          /* Pre-render buffer for horizontal mode */
          [-1, 0, 1].map((offset) => {
            const bufferPageNum = displayedPage + offset;
            if (bufferPageNum < 1 || bufferPageNum > numPages) return null;
            const isActive = offset === 0;

            return (
              <div
                key={bufferPageNum}
                className="pdf-page-wrapper rounded-sm bg-bg-elevated mx-auto mb-8 lg:mb-0 relative"
                data-page-index={bufferPageNum}
                style={{
                  position: isActive ? 'relative' : 'absolute',
                  opacity: isActive ? (isFading ? 0 : 1) : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: isActive ? 'opacity 150ms ease-in-out' : 'none',
                  top: isActive ? 'auto' : 0,
                  left: isActive ? 'auto' : 0,
                  width: isActive ? 'auto' : '100%',
                  zIndex: isActive ? 1 : 0,
                }}
              >
                <Page
                  pageNumber={bufferPageNum}
                  rotate={rotation}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderSuccess={() => {
                    console.log('[PDFReader] pre-rendered page:', bufferPageNum);
                    setRenderedPages(prev => new Set(prev).add(bufferPageNum));
                    if (isActive) handlePageRenderSuccess();
                  }}
                  width={pdfWidth}
                  className="bg-bg-elevated"
                  loading={
                    isActive ? (
                      <div
                        className="flex flex-col items-center justify-center bg-bg-elevated animate-pulse"
                        style={{ width: pdfWidth, height: pdfWidth * 1.41 }}
                      >
                        <div className="w-full h-full p-8 space-y-4">
                          <div className="h-4 w-1/3 bg-bg-subtle rounded-full" />
                          <div className="space-y-4">
                            <div className="h-2 w-full bg-bg-subtle rounded-full" />
                            <div className="h-2 w-full bg-bg-subtle rounded-full" />
                            <div className="h-2 w-2/3 bg-bg-subtle rounded-full" />
                          </div>
                        </div>
                      </div>
                    ) : null
                  }
                />
              </div>
            );
          })
        )}
      </Document>
    </div>
  );
};

export default PDFReader;
