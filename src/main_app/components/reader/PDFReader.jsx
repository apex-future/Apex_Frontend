import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Document, Page, pdfjs } from 'react-pdf';
import { useSwipeable } from 'react-swipeable';
import BookSkeleton from './BookSkeleton';
import useSettingsStore from '../../store/settingsStore';
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
function getHighlightRanges(container, searchText, targetStartOffset) {
  if (!container || !searchText) return [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Build full text with space separators between nodes
  let fullText = '';
  const nodeMap = [];
  for (let i = 0; i < textNodes.length; i++) {
    const tn = textNodes[i];
    // Add space between nodes if needed to match browser selection behavior
    if (i > 0 && fullText.length > 0 && !fullText.endsWith(' ') && !tn.textContent.startsWith(' ')) {
      fullText += ' ';
    }
    const start = fullText.length;
    fullText += tn.textContent;
    nodeMap.push({ node: tn, start, end: fullText.length });
  }

  // Escape special regex characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Create a regex that matches the search text while ignoring whitespace differences
  const words = searchText.replace(/\s+/g, ' ').trim().split(' ');
  const regexStr = words.map(word => escapeRegExp(word)).join('\\s+');
  let regex;
  try {
    regex = new RegExp(regexStr, 'gi');
  } catch (e) {
    return [];
  }

  const ranges = [];
  let match;
  let matches = [];

  while ((match = regex.exec(fullText)) !== null) {
    matches.push({ start: match.index, end: regex.lastIndex });
  }

  if (matches.length === 0) return [];

  // If we have a target offset, find the closest match
  let bestMatch = matches[0];
  if (targetStartOffset != null && matches.length > 1) {
    let minDiff = Infinity;
    for (const m of matches) {
      const diff = Math.abs(m.start - targetStartOffset);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = m;
      }
    }
  }

  // Create ranges for the best match (or all matches if no target offset was used, 
  // though target offset is usually provided for specific highlights)
  const applyMatch = (m) => {
    for (let i = 0; i < nodeMap.length; i++) {
      const nm = nodeMap[i];
      if (nm.end <= m.start || nm.start >= m.end) continue;
      const overlapStart = Math.max(0, m.start - nm.start);
      const overlapEnd = Math.min(nm.node.textContent.length, m.end - nm.start);
      try {
        const range = document.createRange();
        range.setStart(nm.node, overlapStart);
        range.setEnd(nm.node, overlapEnd);
        ranges.push(range);
      } catch (e) {}
    }
  };

  if (targetStartOffset != null) {
    applyMatch(bestMatch);
  } else {
    matches.forEach(applyMatch);
  }

  return ranges;
}

// ─── Memoized page component ───
// Manual canvas render removed — react-pdf Page handles canvas internally. Document ref caching on load prevents document recreation which was the original source of the render flash.
const VirtualPage = memo(({ pageNumber, rotation, scale, width, onRenderSuccess }) => {
  return (
    <div 
      className="relative flex flex-col items-center justify-center bg-white mx-auto"
      style={{ width: width * scale, height: Math.round(width * 1.41 * scale) }}
    >
      <div className="relative z-10 w-full h-full">
        <Page
          pageNumber={pageNumber}
          rotate={rotation}
          scale={scale}
          renderMode="canvas"
          renderTextLayer={true}
          renderAnnotationLayer={true}
          width={width}
          className="!shadow-none"
          loading={null}
          onRenderSuccess={onRenderSuccess}
        />
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if these specific props change
  return (
    prev.pageNumber === next.pageNumber &&
    prev.rotation === next.rotation &&
    prev.scale === next.scale &&
    prev.width === next.width
  );
});

VirtualPage.displayName = 'VirtualPage';

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
  highlights = [],
  locked = false,
  scrollOrientation = 'vertical',
  onPageChange,
}) => {
  const containerRef = useRef(null);
  
  // [FIX]: The PDF Document proxy was completely hidden inside react-pdf's Document component and recreated when unmounted.
  // We now cache it in a ref to prevent document recreation which was the original source of the render flash.
  const pdfDocumentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth > 1024;
  
  // The fixed width we render the PDF canvas at
  const renderWidth = isDesktop ? Math.min(windowWidth - 120, 1100) : windowWidth;
  
  // Calculate how much we need to scale it down via CSS if the container shrinks
  // We cap it at 1 so we don't scale up via CSS (which would look blurry)
  const cssScale = containerWidth > 0 ? Math.min(1, containerWidth / renderWidth) : 1;
  const [pageRendered, setPageRendered] = useState(0);
  const renderedPagesRef = useRef(new Set());
  const [displayedPage, setDisplayedPage] = useState(pageNumber);
  const [isFading, setIsFading] = useState(false);
  const isVertical = scrollOrientation === 'vertical';
  const { pageAnimations, scrollAnimation } = useSettingsStore();

  // Stable estimateSize callback — prevents virtualizer from reinitializing size cache
  const estimateSize = useCallback(
    () => Math.round(renderWidth * 1.41 * scale * cssScale),
    [renderWidth, scale, cssScale]
  );

  const rowVirtualizer = useVirtualizer({
    count: numPages || 0,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan: 3, // Increased from 2 for smoother scrolling
  });

  const isJumping = useRef(false);
  const lastReportedPage = useRef(pageNumber);
  const pendingJump = useRef(null);

  // Resize state to prevent scroll jumps
  const isResizing = useRef(false);
  const resizeTimeout = useRef(null);

  // Sync internal state when pageNumber prop changes programmatically
  useEffect(() => {
    if (pageNumber !== lastReportedPage.current) {
      pendingJump.current = pageNumber;
    }
  }, [pageNumber]);

  // Horizontal crossfade/slide on page change
  useEffect(() => {
    if (isVertical) return;
    if (pageNumber === displayedPage) return;

    // No animation — instant switch
    if (!pageAnimations || scrollAnimation === 'none') {
      setDisplayedPage(pageNumber);
      return;
    }

    // Fade or slide — both use opacity transition, slide also uses translateX
    setIsFading(true);

    const timer = setTimeout(() => {
      setDisplayedPage(pageNumber);
      setIsFading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pageNumber, isVertical, pageAnimations, scrollAnimation]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  // RAF-throttled scroll handler for vertical mode — detects which page is at the top
  const rafId = useRef(null);
  const handleVerticalScroll = useCallback(() => {
    if (!isVertical || !numPages) return;
    if (isJumping.current) return;
    if (isResizing.current) return; // Prevent scroll updates during layout shifts
    // Skip scroll processing during active text selection to prevent virtualizer churn
    if (window.getSelection()?.toString().trim()) return;

    // Cancel any pending RAF to avoid stacking
    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
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
    });
  }, [isVertical, numPages]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Handle programmatic scroll for goToPage in vertical mode
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!isVertical || !rowVirtualizer || !numPages) return;

    // On initial load, scroll to the saved page even if pageNumber === lastReportedPage.
    // This is needed because lastReportedPage is initialized to pageNumber (same value),
    // so the guard below would skip the scroll on first load.
    if (!initialScrollDone.current && pageNumber > 1) {
      rowVirtualizer.scrollToIndex(pageNumber - 1, { align: 'start' });
      lastReportedPage.current = pageNumber;
      initialScrollDone.current = true;
      return;
    }
    initialScrollDone.current = true;

    if (pageNumber === lastReportedPage.current) return;
    rowVirtualizer.scrollToIndex(pageNumber - 1, { align: 'start', behavior: 'smooth' });
    lastReportedPage.current = pageNumber;
  }, [pageNumber, isVertical, numPages]);

  // Maintain scroll position when container width changes (e.g. side panels opening)
  const prevCssScale = useRef(cssScale);
  useEffect(() => {
    if (prevCssScale.current !== cssScale) {
      prevCssScale.current = cssScale;
      if (isVertical && rowVirtualizer && numPages) {
        // Use a timeout to ensure virtualizer has updated its internal measurements
        setTimeout(() => {
            rowVirtualizer.scrollToIndex(pageNumber - 1, { align: 'start' });
        }, 10);
      }
    }
  }, [cssScale, isVertical, rowVirtualizer, numPages, pageNumber]);

  // Stable render success handler
  const handlePageRenderSuccess = useCallback(() => {
    setPageRendered(prev => prev + 1);
  }, []);

  // Post-render: apply highlights to the text layer DOM safely without breaking React Node hierarchy
  // Uses requestIdleCallback for non-blocking highlight painting
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const collectedRanges = {};
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
            hlLayer.style.position = 'absolute';
            hlLayer.style.top = '0';
            hlLayer.style.left = '0';
            hlLayer.style.width = '100%';
            hlLayer.style.height = '100%';
            hlLayer.style.pointerEvents = 'none';
            hlLayer.style.zIndex = '10';
            hlLayer.style.mixBlendMode = 'multiply';
            pageEl.appendChild(hlLayer);
        }

        const pageRect = pageEl.getBoundingClientRect();

        for (const h of pageHighlights) {
            const text = h.text || h.highlightedText || '';
            let color = h.color || '#fef08a';
            const isSimplified = h.isSimplified === true;
            if (!text) continue;

            const displayColor = color.length === 7 && color.startsWith('#') ? color + '66' : color;

            const ranges = getHighlightRanges(textLayer, text, h.startOffset);
            if (ranges.length === 0) continue;

            if (isSimplified) {
                // Simplified text: render as underline, not background
                if (useCSSHighlight) {
                    const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
                    const highlightName = `apex-simplified-${safeColor}-${ranges.length}`;
                    const highlight = new Highlight(...ranges);
                    CSS.highlights.set(highlightName, highlight);
                    // CSS Highlight API only supports background-color and color,
                    // so we use a transparent background and render underline via fallback overlay
                }
                // Always use fallback overlay for underline rendering (works on all devices)
                if (!hlLayer) {
                    hlLayer = document.createElement('div');
                    hlLayer.className = 'apex-fallback-hl-layer';
                    hlLayer.style.position = 'absolute';
                    hlLayer.style.top = '0';
                    hlLayer.style.left = '0';
                    hlLayer.style.width = '100%';
                    hlLayer.style.height = '100%';
                    hlLayer.style.pointerEvents = 'none';
                    hlLayer.style.zIndex = '10';
                    pageEl.appendChild(hlLayer);
                }
                for (const range of ranges) {
                    const rects = range.getClientRects();
                    for (let i = 0; i < rects.length; i++) {
                        const rect = rects[i];
                        const div = document.createElement('div');
                        div.style.position = 'absolute';
                        div.style.left = `${rect.left - pageRect.left}px`;
                        div.style.top = `${rect.top - pageRect.top + rect.height - 2}px`;
                        div.style.width = `${rect.width}px`;
                        div.style.height = '2px';
                        div.style.backgroundColor = color;
                        div.style.opacity = '0.6';
                        div.style.borderRadius = '1px';
                        hlLayer.appendChild(div);
                    }
                }
            } else if (useCSSHighlight) {
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

    // Use requestIdleCallback to apply highlights without blocking main thread
    const scheduleHighlights = typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn) => setTimeout(fn, 100);
    const cancelHighlights = typeof cancelIdleCallback === 'function' ? cancelIdleCallback : clearTimeout;

    const idleId = scheduleHighlights(() => {
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
    });

    return () => {
        cancelHighlights(idleId);
        if (useCSSHighlight) CSS.highlights.clear();
    };
  }, [highlights, pageNumber, isVertical]);

  const customTextRenderer = React.useCallback(
    ({ str }) => str,
    []
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      // Set resizing flag to prevent scroll handler from jumping pages
      isResizing.current = true;
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        isResizing.current = false;
      }, 300);

      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, []);

  const lastEdgeHit = useRef({ left: 0, right: 0 });

  // Swipe handlers — only for horizontal mode
  const handleSwipedLeft = () => {
    if (locked || isVertical) return;
    // Don't navigate during text selection
    if (window.getSelection()?.toString().trim()) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 20;
        if (!isAtRightEdge) return;

        const now = Date.now();
        if (now - lastEdgeHit.current.right > 2000) {
            lastEdgeHit.current.right = now;
            return;
        }
        lastEdgeHit.current.right = 0;
      }
    }
    onNextPage?.();
  };

  const handleSwipedRight = () => {
    if (locked || isVertical) return;
    // Don't navigate during text selection
    if (window.getSelection()?.toString().trim()) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtLeftEdge = el.scrollLeft <= 20;
        if (!isAtLeftEdge) return;

        const now = Date.now();
        if (now - lastEdgeHit.current.left > 2000) {
            lastEdgeHit.current.left = now;
            return;
        }
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
        onLoadSuccess={(pdf) => {
          // [FIX]: Store the document proxy in a ref to avoid recreation when the document changes.
          if (pdfDocumentRef.current !== pdf) {
            pdfDocumentRef.current = pdf;
            console.log('[PDF] Document loaded and cached in ref');
          }
          onDocumentLoad(pdf);
        }}
        onLoadError={(err) => console.error('PDF load error:', err)}
        loading={<BookSkeleton message="Rendering document..." />}
        className="flex flex-col items-center justify-center min-h-full w-full mx-auto"
      >
        {isVertical ? (
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const pageIdx = virtualRow.index + 1;
              return (
                <div
                  // [FIX]: virtualRow.index is the absolute row index, which is mostly stable, but passing the explicit pageIdx
                  // explicitly ensures the React key is strictly bound to the page number.
                  key={pageIdx}
                  ref={rowVirtualizer.measureElement}
                  className="pdf-page-wrapper absolute left-0 flex flex-col items-center w-full"
                  data-page-index={pageIdx}
                  data-index={virtualRow.index}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%',
                    height: `${Math.round(renderWidth * 1.41 * scale * cssScale)}px`,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${cssScale})`,
                      transformOrigin: 'top center',
                      width: `${renderWidth}px`,
                      position: 'relative'
                    }}
                    className="flex flex-col items-center bg-bg-elevated shadow-sm mx-auto"
                  >
                    <VirtualPage
                      pageNumber={pageIdx}
                      rotation={rotation}
                      scale={scale}
                      width={renderWidth}
                      onRenderSuccess={handlePageRenderSuccess}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/50 dark:bg-black/70 z-20 pointer-events-none" />
                  </div>
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
                  opacity: isActive
                    ? (isFading && pageAnimations ? 0 : 1)
                    : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  // Slide animation — translateX on exit
                  transform: isActive && isFading && scrollAnimation === 'slide' && pageAnimations
                    ? 'translateX(-8px)'
                    : 'translateX(0)',
                  transition: isActive && pageAnimations
                    ? scrollAnimation === 'fade'
                      ? 'opacity 150ms ease-in-out'
                      : scrollAnimation === 'slide'
                      ? 'opacity 100ms ease-in-out, transform 150ms ease-out'
                      : 'none'
                    : 'none',
                  top: isActive ? 'auto' : 0,
                  left: isActive ? 'auto' : 0,
                  width: isActive ? `${renderWidth * cssScale}px` : '100%',
                  height: isActive ? `${renderWidth * 1.41 * scale * cssScale}px` : 'auto',
                  zIndex: isActive ? 1 : 0,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    transform: `scale(${cssScale})`,
                    transformOrigin: 'top center',
                    width: `${renderWidth}px`,
                  }}
                >
                  <Page
                    pageNumber={bufferPageNum}
                    rotate={rotation}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={() => {
                      renderedPagesRef.current.add(bufferPageNum);
                      if (isActive) handlePageRenderSuccess();
                    }}
                    width={renderWidth}
                    className="bg-bg-elevated"
                    loading={
                      isActive ? (
                        <div
                          className="flex flex-col items-center justify-center bg-bg-elevated animate-pulse"
                          style={{ width: renderWidth, height: renderWidth * 1.41 * scale }}
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
                      ) : <div style={{ width: renderWidth, height: renderWidth * 1.41 * scale }} />
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </Document>
    </div>
  );
};

export default PDFReader;
