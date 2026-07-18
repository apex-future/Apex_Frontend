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
 * Normalize ligatures and special characters for robust text matching.
 * PDF text layers often contain ligature glyphs (ﬁ, ﬀ, ﬂ, etc.) that the browser
 * expands to individual characters during text selection, causing mismatches.
 */
const LIGATURE_MAP = {
  '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl',
  '\uFB03': 'ffi', '\uFB04': 'ffl', '\uFB05': 'st', '\uFB06': 'st',
};
const LIGATURE_REGEX = /[\uFB00-\uFB06]/g;

// Broader strip regex: whitespace (incl. non-breaking, thin, zero-width),
// hyphens, soft hyphens, en/em dashes, and zero-width joiners/chars
const STRIP_REGEX = /[\s\u00A0\u00AD\u2000-\u200F\u2028\u2029\u202F\u205F\u2060\uFEFF\-\u2010-\u2015]/;
const STRIP_REGEX_G = /[\s\u00A0\u00AD\u2000-\u200F\u2028\u2029\u202F\u205F\u2060\uFEFF\-\u2010-\u2015]/g;

function normalizeLigatures(text) {
  return text.replace(LIGATURE_REGEX, (ch) => LIGATURE_MAP[ch] || ch);
}

/**
 * Scans all text nodes inside `container`, finds `searchText`, and returns an array of Range objects.
 * Handles ligatures, soft hyphens, zero-width chars, and various dash types for robust matching.
 */
function getHighlightRanges(container, searchText, targetStartOffset) {
  if (!container || !searchText) return [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  if (textNodes.length === 0) return [];

  // Build full text with space separators between nodes
  // We track each node's character range in the concatenated string
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

  // Normalize ligatures in the full text for matching
  // We need to track position mapping because ligature expansion changes string length
  const normalizedChars = [];
  const normalizedToOriginal = []; // normalizedIndex -> originalIndex
  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    const replacement = LIGATURE_MAP[ch];
    if (replacement) {
      for (let j = 0; j < replacement.length; j++) {
        normalizedChars.push(replacement[j]);
        normalizedToOriginal.push(i);
      }
    } else {
      normalizedChars.push(ch);
      normalizedToOriginal.push(i);
    }
  }
  const normalizedFullText = normalizedChars.join('');

  // Strip whitespace/hyphens/dashes for fuzzy matching
  let strippedFullText = '';
  const strippedToNormalized = [];

  for (let i = 0; i < normalizedFullText.length; i++) {
    if (!STRIP_REGEX.test(normalizedFullText[i])) {
      strippedToNormalized.push(i);
      strippedFullText += normalizedFullText[i];
    }
  }

  // Normalize and strip the search text the same way
  const normalizedSearch = normalizeLigatures(searchText);
  const strippedSearch = normalizedSearch.replace(STRIP_REGEX_G, '');
  if (!strippedSearch) return [];

  const searchTarget = strippedSearch.toLowerCase();
  const searchSource = strippedFullText.toLowerCase();

  const ranges = [];
  const matches = [];
  let startIndex = 0;
  while ((startIndex = searchSource.indexOf(searchTarget, startIndex)) !== -1) {
    // Map from stripped space back to original fullText positions
    const normStart = strippedToNormalized[startIndex];
    const normEnd = strippedToNormalized[startIndex + searchTarget.length - 1];
    const originalStart = normalizedToOriginal[normStart];
    const originalEnd = normalizedToOriginal[normEnd] + 1;
    matches.push({ start: originalStart, end: originalEnd });
    startIndex += 1;
  }

  if (matches.length === 0) {
    // Fallback: try without any normalization (exact substring match)
    const directIdx = fullText.toLowerCase().indexOf(searchText.toLowerCase());
    if (directIdx !== -1) {
      matches.push({ start: directIdx, end: directIdx + searchText.length });
    } else {
      return [];
    }
  }

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

  // Create Range objects spanning the matched text across text nodes
  const applyMatch = (m) => {
    for (let i = 0; i < nodeMap.length; i++) {
      const nm = nodeMap[i];
      if (nm.end <= m.start || nm.start >= m.end) continue;
      const overlapStart = Math.max(0, m.start - nm.start);
      const overlapEnd = Math.min(nm.node.textContent.length, m.end - nm.start);
      if (overlapStart >= overlapEnd) continue;
      try {
        const range = document.createRange();
        range.setStart(nm.node, overlapStart);
        range.setEnd(nm.node, overlapEnd);
        ranges.push(range);
      } catch (e) { /* node may have been detached */ }
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
// Uses a two-phase zoom approach to eliminate flicker:
// 1. `committedScale` is the scale the canvas is actually rendered at (full resolution)
// 2. `cssZoomRatio` is a CSS transform applied on top for instant visual feedback
// The old canvas stays visible while re-rendering at a new scale, so no skeleton flash.
const VirtualPage = memo(({ pageNumber, rotation, baseScale, cssZoomRatio, width, onRenderSuccess }) => {
  return (
    <div
      className="relative bg-white mx-auto"
      style={{
        width: width * baseScale * cssZoomRatio,
        height: Math.round(width * 1.41 * baseScale * cssZoomRatio),
        overflow: 'hidden',
      }}
    >
      <div
        className="absolute top-0 left-0 z-10"
        style={{
          transform: `scale(${cssZoomRatio})`,
          transformOrigin: 'top left',
          width: width * baseScale,
          height: Math.round(width * 1.41 * baseScale),
        }}
      >
        <Page
          pageNumber={pageNumber}
          rotate={rotation}
          scale={baseScale}
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
    prev.baseScale === next.baseScale &&
    prev.cssZoomRatio === next.cssZoomRatio &&
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
  swipeLocked = false,
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

  // ── True CSS Zoom: eliminates flicker entirely ──
  // We ALWAYS render the actual canvas at a high resolution (scale=2.5) to keep text crisp.
  // We never change the canvas scale after it mounts, so it never destroys/rebuilds itself.
  // All zooming is handled purely through CSS transforms, making it instant and buttery smooth.
  const BASE_CANVAS_SCALE = 2.5;
  const cssZoomRatio = scale / BASE_CANVAS_SCALE;

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

  // ─── Highlight rendering engine ───
  // Applies highlights, tabs, dictionary markers, and simplification underlines
  // to the PDF text layer DOM. Uses overlay divs positioned relative to each
  // page's .react-pdf__Page element (inside the same transform context as the
  // text layer) to eliminate coordinate mismatches from nested CSS transforms.

  // Ref to hold current highlights for the MutationObserver callback
  const highlightsRef = useRef(highlights);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);

  // Core function: apply highlights to a single page element
  const applyHighlightsToPage = useCallback((pageNum, pageEl, currentHighlights, collectedRanges, useCSSHighlight) => {
    const pageHighlights = currentHighlights.filter(
      (h) => (h.page || h.pageNumber) === pageNum
    );
    if (pageHighlights.length === 0) return;

    const textLayer = pageEl.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;
    // Ensure text layer has actual text content before proceeding
    if (!textLayer.textContent || textLayer.textContent.trim().length === 0) return;

    // Find the .react-pdf__Page element — the stable positioning ancestor
    // This is inside the same transform context as the text layer, so
    // getClientRects() coordinates map correctly to absolute positioning here.
    const pageContainer = pageEl.querySelector('.react-pdf__Page') || pageEl;
    // Ensure it has position:relative so absolute children are positioned correctly
    if (pageContainer !== pageEl && getComputedStyle(pageContainer).position === 'static') {
      pageContainer.style.position = 'relative';
    }

    // Clean up old fallback overlays from this specific page container
    pageContainer.querySelectorAll('.apex-fallback-hl-layer').forEach(el => el.remove());

    let hlLayer = null;
    const createHlLayer = () => {
      const layer = document.createElement('div');
      layer.className = 'apex-fallback-hl-layer';
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '100%';
      layer.style.height = '100%';
      layer.style.pointerEvents = 'none';
      layer.style.zIndex = '10';
      layer.style.mixBlendMode = 'multiply';
      pageContainer.appendChild(layer);
      return layer;
    };

    if (!useCSSHighlight) {
      hlLayer = createHlLayer();
    }

    // Use pageContainer as the coordinate reference — it's in the same transform context
    const anchorRect = pageContainer.getBoundingClientRect();

    // FIX: getBoundingClientRect() returns viewport-space coords (post CSS transforms).
    // Absolute positioning uses layout-space (pre-transform). With scale(cssZoomRatio)
    // and scale(cssScale) applied by ancestors, these spaces differ significantly.
    // Derive the actual scale factor from the DOM to convert between them.
    const scaleX = pageContainer.offsetWidth  > 0 ? anchorRect.width  / pageContainer.offsetWidth  : 1;
    const scaleY = pageContainer.offsetHeight > 0 ? anchorRect.height / pageContainer.offsetHeight : 1;

    for (const h of pageHighlights) {
      const text = h.text || h.highlightedText || '';
      let color = h.color || '#fef08a';
      const isSimplified = h.isSimplified === true;
      const isDictionary = h.isDictionaryWord === true;
      const isTab = h.isTab === true;
      if (!text) continue;

      const displayColor = color.length === 7 && color.startsWith('#') ? color + '66' : color;

      const ranges = getHighlightRanges(textLayer, text, h.startOffset);
      if (ranges.length === 0) continue;

      if (isSimplified || isDictionary || isTab) {
        // Ensure overlay layer exists for interactive markers
        if (!hlLayer) hlLayer = createHlLayer();

        let isFirstRectOverall = true;
        for (const range of ranges) {
          const rects = range.getClientRects();
          for (let ri = 0; ri < rects.length; ri++) {
            const rect = rects[ri];
            if (rect.width === 0 || rect.height === 0) continue;

            const div = document.createElement('div');
            div.className = 'apex-hl-overlay';
            div.style.position = 'absolute';
            div.style.left   = `${(rect.left - anchorRect.left) / scaleX}px`;
            div.style.top    = `${(rect.top  - anchorRect.top)  / scaleY}px`;
            div.style.width  = `${rect.width  / scaleX}px`;
            div.style.height = `${rect.height / scaleY}px`;
            div.style.pointerEvents = 'auto';
            div.style.cursor = 'pointer';
            div.style.boxSizing = 'border-box';

            if (isDictionary) {
              const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 8'><path fill='none' stroke='gray' stroke-width='2' d='M0 4 Q 5 8, 10 4 T 20 4'/></svg>`;
              div.style.background = `url("data:image/svg+xml,${encodeURIComponent(svgStr)}") repeat-x bottom`;
              div.style.backgroundSize = '18px 7px';
              div.style.opacity = '1';
              div.dataset.dictWord = text;
              div.dataset.dictId = h.id;
            } else if (isSimplified) {
              div.style.borderBottom = `2.5px solid ${color}`;
              div.style.opacity = '0.8';
            } else if (isTab) {
              div.style.backgroundColor = color;
              div.style.opacity = '1';
              div.style.borderRadius = '2px';

              // Only add quote icon on the very first rect across ALL ranges
              if (isFirstRectOverall) {
                const quoteIcon = document.createElement('span');
                quoteIcon.innerHTML = '\u201C';
                quoteIcon.style.position = 'absolute';
                quoteIcon.style.left = '2px';
                quoteIcon.style.top = '-4px';
                quoteIcon.style.color = '#a855f7';
                quoteIcon.style.fontSize = '18px';
                quoteIcon.style.fontFamily = 'Georgia, serif';
                quoteIcon.style.fontWeight = 'bold';
                quoteIcon.style.lineHeight = '1';
                quoteIcon.style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
                div.appendChild(quoteIcon);
                isFirstRectOverall = false;
              }
            }

            div.onclick = (e) => {
              e.stopPropagation();
              if (isDictionary) {
                const event = new CustomEvent('apex-dict-click', { detail: { wordObj: h.wordObj, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } } });
                window.dispatchEvent(event);
              } else if (isSimplified) {
                const event = new CustomEvent('apex-simplify-click', { detail: { text: h.text } });
                window.dispatchEvent(event);
              } else if (isTab) {
                const event = new CustomEvent('apex-tab-click', { detail: { tabObj: h.tabObj, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } } });
                window.dispatchEvent(event);
              }
            };

            hlLayer.appendChild(div);
          }
        }
      } else if (useCSSHighlight) {
        if (!collectedRanges[color]) collectedRanges[color] = [];
        collectedRanges[color].push(...ranges);
      } else {
        if (!hlLayer) hlLayer = createHlLayer();
        for (const range of ranges) {
          const rects = range.getClientRects();
          for (let ri = 0; ri < rects.length; ri++) {
            const rect = rects[ri];
            if (rect.width === 0 || rect.height === 0) continue;
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left   = `${(rect.left - anchorRect.left) / scaleX}px`;
            div.style.top    = `${(rect.top  - anchorRect.top)  / scaleY}px`;
            div.style.width  = `${rect.width  / scaleX}px`;
            div.style.height = `${rect.height / scaleY}px`;
            div.style.backgroundColor = displayColor;
            div.style.borderRadius = '2px';
            hlLayer.appendChild(div);
          }
        }
      }
    }
  }, []);

  // Main highlight effect — runs when highlights change, pages render, or zoom changes
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const useCSSHighlight = !isTouchDevice && 'highlights' in CSS;
    const collectedRanges = {};

    const runHighlightPass = () => {
      if (useCSSHighlight) CSS.highlights.clear();

      // Clean up all existing overlay layers first
      container.querySelectorAll('.apex-fallback-hl-layer').forEach(el => el.remove());

      const freshCollectedRanges = {};

      container.querySelectorAll('.pdf-page-wrapper').forEach((wrapper) => {
        const pageNum = parseInt(wrapper.dataset.pageIndex, 10);
        if (!isNaN(pageNum)) {
          applyHighlightsToPage(pageNum, wrapper, highlights, freshCollectedRanges, useCSSHighlight);
        }
      });

      if (useCSSHighlight) {
        let styleText = '';
        for (const [color, ranges] of Object.entries(freshCollectedRanges)) {
          if (ranges.length === 0) continue;
          const displayColor = color.length === 7 && color.startsWith('#') ? color + '66' : color;
          const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
          const highlightName = `apex-hl-${safeColor}`;
          try {
            const highlight = new Highlight(...ranges);
            CSS.highlights.set(highlightName, highlight);
            // Fix: don't set color:transparent — it makes text invisible if ranges misalign
            styleText += `::highlight(${highlightName}) { background-color: ${displayColor}; }\n`;
          } catch (e) {
            // Range may have been detached by virtualizer recycling
          }
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
    };

    // Run immediately via microtask so highlights appear without delay
    const timerId = setTimeout(runHighlightPass, 0);

    // MutationObserver: watch for text layer DOM changes (react-pdf adding spans)
    // This catches pages that render asynchronously after the effect first ran.
    // IMPORTANT: We use a guard flag to prevent infinite loops — runHighlightPass
    // itself adds/removes overlay divs which would trigger the observer again.
    let mutationRafId = null;
    let isApplyingHighlights = false;

    const guardedRunHighlightPass = () => {
      isApplyingHighlights = true;
      runHighlightPass();
      // Reset flag after a microtask to allow the browser to flush all
      // synchronous mutation records triggered by our DOM changes
      queueMicrotask(() => { isApplyingHighlights = false; });
    };

    // Swap the initial run to use the guarded version too
    clearTimeout(timerId);
    const guardedTimerId = setTimeout(guardedRunHighlightPass, 0);

    const observer = new MutationObserver((mutations) => {
      // Skip mutations caused by our own overlay div additions/removals
      if (isApplyingHighlights) return;

      // Only react to mutations inside text layers, not our overlay layers
      const isTextLayerChange = mutations.some(m =>
        m.target.classList?.contains('react-pdf__Page__textContent') ||
        m.target.closest?.('.react-pdf__Page__textContent') ||
        m.target.closest?.('.react-pdf__Page')
      );
      if (!isTextLayerChange) return;

      // Batch mutations with rAF to avoid running on every individual span insertion
      if (mutationRafId) cancelAnimationFrame(mutationRafId);
      mutationRafId = requestAnimationFrame(guardedRunHighlightPass);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      // Only watch for structural changes (new text spans), not attribute/text changes
      attributes: false,
      characterData: false,
    });

    return () => {
      clearTimeout(guardedTimerId);
      if (mutationRafId) cancelAnimationFrame(mutationRafId);
      observer.disconnect();
      if (useCSSHighlight) CSS.highlights.clear();
    };
  }, [highlights, pageNumber, isVertical, pageRendered, scale, applyHighlightsToPage]);

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

  const handleWheel = useCallback((e) => {
    if (isVertical) return;
    if (swipeLocked || window.getSelection()?.toString().trim()) return;

    const now = Date.now();

    // Reset accumulator if it's been a while since last event
    if (now - (window.lastWheelEventTime || 0) > 150) {
      window.wheelDeltaY = 0;
    }
    window.lastWheelEventTime = now;

    window.wheelDeltaY = (window.wheelDeltaY || 0) + e.deltaY;

    // Cooldown between page flips
    if (now - (window.lastWheelFlipTime || 0) < 300) return;

    if (window.wheelDeltaY > 30) {
      window.lastWheelFlipTime = now;
      window.wheelDeltaY = 0;
      onNextPage?.();
    } else if (window.wheelDeltaY < -30) {
      window.lastWheelFlipTime = now;
      window.wheelDeltaY = 0;
      onPrevPage?.();
    }
  }, [isVertical, swipeLocked, onNextPage, onPrevPage]);

  // Swipe handlers — only for horizontal mode
  const handleSwipedLeft = () => {
    if (swipeLocked || isVertical) return;
    // Don't navigate during text selection
    if (window.getSelection()?.toString().trim()) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtRightEdge = el.scrollLeft + el.clientWidth >= el.scrollWidth - 50;
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
    if (swipeLocked || isVertical) return;
    // Don't navigate during text selection
    if (window.getSelection()?.toString().trim()) return;
    if (scale > 1) {
      const el = containerRef.current;
      if (el) {
        const isAtLeftEdge = el.scrollLeft <= 50;
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
      onWheel={!isVertical ? handleWheel : undefined}
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
                      baseScale={BASE_CANVAS_SCALE}
                      cssZoomRatio={cssZoomRatio}
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
                  width: isActive ? `${renderWidth * cssScale * cssZoomRatio}px` : '100%',
                  height: isActive ? `${renderWidth * 1.41 * BASE_CANVAS_SCALE * cssScale * cssZoomRatio}px` : 'auto',
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
                  <div
                    style={{
                      transform: `scale(${cssZoomRatio})`,
                      transformOrigin: 'top left',
                      width: renderWidth * BASE_CANVAS_SCALE,
                      height: Math.round(renderWidth * 1.41 * BASE_CANVAS_SCALE),
                    }}
                  >
                    <Page
                      pageNumber={bufferPageNum}
                      rotate={rotation}
                      scale={BASE_CANVAS_SCALE}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onRenderSuccess={() => {
                        renderedPagesRef.current.add(bufferPageNum);
                        if (isActive) handlePageRenderSuccess();
                      }}
                      width={renderWidth}
                      className="bg-bg-elevated"
                      loading={null}
                    />
                  </div>
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
