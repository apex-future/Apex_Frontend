import React, { useRef, useState, useEffect, useCallback } from 'react';
import ePub from 'epubjs';
import { useSwipeable } from 'react-swipeable';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import BookSkeleton from './BookSkeleton';

function EPUBReader({
  fileUrl,
  book,
  pageNumber = 1,
  onDocumentLoad,
  onPageChange,
  scrollOrientation = 'horizontal',
  scale = 1.0,
  locked = false,
  swipeLocked = false,
  onNextPage,
  onPrevPage,
  goToPage,
  highlights = [],
  tocOutline,
  setTocOutline,
  onCloseNav,
  onTextSelected,
  onClearSelection,
}) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const bookInstanceRef = useRef(null);
  const renditionRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(pageNumber || 1);
  const [totalPages, setTotalPages] = useState(book?.totalPages || 1);

  // Teleport overlay state for smooth page jumps (matching PDFReader optimization)
  const [jumpOverlayVisible, setJumpOverlayVisible] = useState(false);
  const [jumpOverlayFading, setJumpOverlayFading] = useState(false);
  const jumpOverlayTimer = useRef(null);

  const isInternalNav = useRef(false);
  const lastReportedPage = useRef(pageNumber || 1);
  const initialPageRef = useRef(pageNumber || 1);
  const isVertical = scrollOrientation === 'vertical';

  // Keep callback refs stable to prevent unneeded re-renders or teardowns
  const onCloseNavRef = useRef(onCloseNav);
  const onTextSelectedRef = useRef(onTextSelected);
  const onClearSelectionRef = useRef(onClearSelection);
  const onDocumentLoadRef = useRef(onDocumentLoad);
  const onPageChangeRef = useRef(onPageChange);
  const setTocOutlineRef = useRef(setTocOutline);
  const swipeLockedRef = useRef(swipeLocked);

  useEffect(() => { onCloseNavRef.current = onCloseNav; }, [onCloseNav]);
  useEffect(() => { onTextSelectedRef.current = onTextSelected; }, [onTextSelected]);
  useEffect(() => { onClearSelectionRef.current = onClearSelection; }, [onClearSelection]);
  useEffect(() => { onDocumentLoadRef.current = onDocumentLoad; }, [onDocumentLoad]);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);
  useEffect(() => { setTocOutlineRef.current = setTocOutline; }, [setTocOutline]);
  useEffect(() => { swipeLockedRef.current = swipeLocked; }, [swipeLocked]);

  // Helper to extract selection info and viewport coordinates using exact iframe target
  const triggerSelectionFromWin = useCallback((win, cfi = null) => {
    if (!win) return;
    const sel = win.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || sel.rangeCount === 0) return;

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      // In multi-chapter continuous mode, win.frameElement refers to the exact chapter iframe
      const iframe = win.frameElement || viewerRef.current?.querySelector('iframe');
      const iframeRect = iframe ? iframe.getBoundingClientRect() : { left: 0, top: 0 };

      const selData = {
        text,
        x: iframeRect.left + rect.left + rect.width / 2,
        y: iframeRect.top + rect.top,
        bottom: iframeRect.top + rect.bottom,
        startOffset: null,
        pageNumber: lastReportedPage.current || 1,
        cfiRange: cfi || null,
      };

      onTextSelectedRef.current?.(selData);
    } catch (err) {
      console.warn('[Apex EPUB] Selection capture error:', err);
    }
  }, []);

  const triggerSelectionRef = useRef(triggerSelectionFromWin);
  useEffect(() => { triggerSelectionRef.current = triggerSelectionFromWin; }, [triggerSelectionFromWin]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (locked) return;
    if (renditionRef.current) {
      if (isVertical) {
        const container = viewerRef.current?.querySelector('.epub-container');
        if (container) {
          container.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        } else {
          renditionRef.current.prev();
        }
      } else {
        renditionRef.current.prev();
      }
    }
  }, [locked, isVertical]);

  const handleNext = useCallback(() => {
    if (locked) return;
    if (renditionRef.current) {
      if (isVertical) {
        const container = viewerRef.current?.querySelector('.epub-container');
        if (container) {
          container.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
          if (container.scrollTop + container.clientHeight >= container.scrollHeight - 400) {
            const manager = renditionRef.current.manager;
            if (manager && typeof manager.check === 'function') {
              manager.check(0, 500);
            }
          }
        } else {
          renditionRef.current.next();
        }
      } else {
        renditionRef.current.next();
      }
    }
  }, [locked, isVertical]);

  // Horizontal mouse wheel navigation
  const handleWheel = useCallback((e) => {
    if (isVertical || locked || swipeLockedRef.current) return;
    if (window.getSelection()?.toString().trim()) return;

    const now = Date.now();
    if (now - (window.lastWheelFlipTime || 0) < 300) return;

    if (!window.wheelDelta) window.wheelDelta = 0;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    window.wheelDelta += delta;

    if (window.wheelDelta > 150) {
      window.lastWheelFlipTime = now;
      window.wheelDelta = 0;
      handleNext();
    } else if (window.wheelDelta < -150) {
      window.lastWheelFlipTime = now;
      window.wheelDelta = 0;
      handlePrev();
    }
  }, [isVertical, locked, handleNext, handlePrev]);

  // Outer container wheel handler (supports both vertical continuous check and horizontal flips)
  const handleOuterWheel = useCallback((e) => {
    if (!isVertical) {
      handleWheel(e);
      return;
    }
    const container = viewerRef.current?.querySelector('.epub-container');
    if (container) {
      if (e.deltaY > 0 && container.scrollTop + container.clientHeight >= container.scrollHeight - 350) {
        const manager = renditionRef.current?.manager;
        if (manager && typeof manager.check === 'function') {
          manager.check(0, 500);
        }
      }
    }
  }, [isVertical, handleWheel]);

  // Main lifecycle: initializes book, spine, locations, and first page completely before dismissing loader
  useEffect(() => {
    const input = book?.file || book?.fileBlob || fileUrl;
    if (!input || !viewerRef.current) return;

    setLoading(true);
    setError(null);

    let isMounted = true;

    try {
      const bookInstance = ePub(input);
      bookInstanceRef.current = bookInstance;

      // Create rendition with continuous flow for vertical mode and paginated for horizontal
      const rendition = bookInstance.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        flow: isVertical ? 'scrolled' : 'paginated',
        manager: isVertical ? 'continuous' : 'default',
        axis: isVertical ? 'vertical' : 'horizontal',
        overflow: isVertical ? 'auto' : 'hidden',
        spread: 'none',
        allowScriptedContent: true, // Prevents "Blocked script execution"
        allowPopups: false,
      });
      renditionRef.current = rendition;

      // In vertical continuous mode:
      // 1. Disable epubjs aggressive trimming so previously rendered chapters stay in the DOM.
      //    This prevents destructive prepend/counter cycles that snap upward scrolling back down.
      // 2. Guard counter() against unwanted scroll pushes when already near top.
      if (isVertical && rendition.manager) {
        rendition.manager.trim = () => Promise.resolve();
        const origCounter = rendition.manager.counter?.bind(rendition.manager);
        if (origCounter) {
          rendition.manager.counter = function (bounds) {
            const scroller = rendition.manager.container;
            if (scroller && bounds && bounds.heightDelta > 0 && scroller.scrollTop > 50) {
              origCounter(bounds);
            }
          };
        }
      }

      // Theme styling matching Apex reader aesthetics
      const applyTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        rendition.themes.default({
          body: {
            color: isDark ? '#cbd5e1' : '#334155',
            background: 'transparent',
            'font-family': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            'line-height': '1.85',
            padding: isVertical ? '24px 32px' : '32px 48px',
            'box-sizing': 'border-box',
          },
          'p, span, div, li': {
            color: isDark ? '#cbd5e1' : '#334155',
            'font-size': '1.05rem',
            'line-height': '1.85',
          },
          'h1, h2, h3, h4, h5, h6': {
            color: isDark ? '#f8fafc' : '#0f172a',
            'font-family': 'ui-sans-serif, system-ui, sans-serif',
            'font-weight': '700',
            'margin-top': '1.5em',
            'margin-bottom': '0.6em',
          },
          a: {
            color: '#8b5cf6',
            'text-decoration': 'underline',
          },
          img: {
            'max-width': '100%',
            height: 'auto',
            display: 'block',
            margin: '1.2em auto',
            'border-radius': '8px',
          },
        });
        rendition.themes.fontSize(`${Math.round(scale * 100)}%`);
      };

      applyTheme();

      // Register content hooks for click-to-close, touch gestures, wheel and text selection inside iframes
      rendition.hooks.content.register((contents) => {
        if (!isMounted) return;

        const doc = contents.document;
        const win = contents.window;
        if (!doc || !win) return;

        // Click handler to close nav bars when user taps on the text
        doc.addEventListener('click', (e) => {
          if (e.target?.closest?.('.highlight-menu-container') || e.target?.classList?.contains('apex-hl-overlay')) return;
          const sel = win.getSelection();
          if (sel && sel.toString().trim().length > 0) return;
          onCloseNavRef.current?.();
        });

        // Mouseup & Touchend to trigger highlight menu on text selection
        doc.addEventListener('mouseup', () => {
          setTimeout(() => triggerSelectionRef.current?.(win), 80);
        });

        // Touch swipe handling inside iframe for horizontal mode
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        doc.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches[0]) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
          }
        }, { passive: true });

        doc.addEventListener('touchend', (e) => {
          setTimeout(() => triggerSelectionRef.current?.(win), 120);

          if (isVertical || swipeLockedRef.current) return;
          const sel = win.getSelection();
          if (sel && sel.toString().trim().length > 0) return;

          if (e.changedTouches && e.changedTouches[0]) {
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;

            if (deltaTime < 500 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
              if (deltaX < 0) {
                handleNext();
              } else {
                handlePrev();
              }
            }
          }
        }, { passive: true });

        // In vertical mode, only trigger manager.check near bottom when scrolling down
        win.addEventListener('wheel', (e) => {
          if (isVertical) {
            if (e.deltaY > 0) {
              const container = viewerRef.current?.querySelector('.epub-container');
              if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 350) {
                const manager = renditionRef.current?.manager;
                if (manager && typeof manager.check === 'function') {
                  manager.check(0, 500);
                }
              }
            }
          } else {
            handleWheel(e);
          }
        }, { passive: true });

        // Hide highlight menu if selection is cleared
        doc.addEventListener('selectionchange', () => {
          const sel = win.getSelection();
          const text = sel ? sel.toString().trim() : '';
          if (!text) {
            onClearSelectionRef.current?.();
          }
        });

        // Prevent native context menu on mobile so Apex HighlightMenu is used
        doc.addEventListener('contextmenu', (e) => {
          const sel = win.getSelection();
          if (sel && sel.toString().trim().length > 0) {
            e.preventDefault();
          }
        }, { passive: false });
      });

      // Rendition selected event
      rendition.on('selected', (cfiRange, contents) => {
        if (!isMounted) return;
        const targetContents = contents || renditionRef.current?.getContents()?.[0];
        if (targetContents?.window) {
          triggerSelectionRef.current?.(targetContents.window, cfiRange);
        }
      });

      // Rendition click event
      rendition.on('click', () => {
        if (!isMounted) return;
        const sel = renditionRef.current?.getContents()?.[0]?.window?.getSelection();
        if (sel && sel.toString().trim().length > 0) return;
        onCloseNavRef.current?.();
      });

      // Handle relocation / continuous scrolling page updates
      let relocateRafId = null;
      rendition.on('relocated', (location) => {
        if (!isMounted || !location?.start) return;
        if (relocateRafId) cancelAnimationFrame(relocateRafId);

        relocateRafId = requestAnimationFrame(() => {
          try {
            const cfi = location.start.cfi;
            const locations = bookInstance.locations;
            let calculatedPage = 1;

            if (locations && locations.total > 0) {
              const locIndex = locations.locationFromCfi(cfi);
              if (locIndex >= 0) {
                calculatedPage = locIndex + 1;
              } else if (location.start.percentage != null) {
                calculatedPage = Math.max(1, Math.round(location.start.percentage * locations.total));
              } else if (location.start.index != null && bookInstance.spine?.length > 0) {
                calculatedPage = Math.max(1, Math.round((location.start.index / bookInstance.spine.length) * locations.total));
              }
            } else if (location.start.displayed?.page) {
              calculatedPage = location.start.displayed.page;
            } else if (location.start.index != null) {
              calculatedPage = location.start.index + 1;
            }

            if (calculatedPage !== lastReportedPage.current) {
              lastReportedPage.current = calculatedPage;
              initialPageRef.current = calculatedPage;
              isInternalNav.current = true;
              setCurrentPage(calculatedPage);
              onPageChangeRef.current?.(calculatedPage);
            }
          } catch (e) {
            console.warn('[Apex EPUB] Relocated error:', e);
          }
        });
      });

      // ─── SEQUENTIAL INITIALIZATION PIPELINE ───
      const initializeReader = async () => {
        try {
          await bookInstance.ready;
          if (!isMounted) return;

          // 1. Extract Navigation & Table of Contents
          bookInstance.loaded.navigation.then((nav) => {
            if (!isMounted || !nav?.toc) return;
            const outline = nav.toc.map((item, idx) => ({
              title: item.label?.trim() || `Chapter ${idx + 1}`,
              dest: item.href,
              pageNumber: idx + 1,
            }));
            setTocOutlineRef.current?.(outline);
          }).catch(() => {});

          // 2. Await spine loading & enable linear layout for all sections
          await bookInstance.loaded.spine;
          if (!isMounted) return;

          if (bookInstance.spine && bookInstance.spine.each) {
            bookInstance.spine.each((section) => {
              section.linear = true;
            });
          }

          if (bookInstance.locations) {
            bookInstance.locations.pause = 0;
          }

          try {
            await bookInstance.locations.generate(1500);
          } catch (locErr) {
            console.warn('[Apex EPUB] locations.generate notice:', locErr);
          }

          if (!isMounted) return;

          const locTotal = bookInstance.locations?.total || 0;
          const spineCount = bookInstance.spine?.length || 0;
          const calculatedTotal = Math.max(locTotal, spineCount, 1);

          setTotalPages(calculatedTotal);
          onDocumentLoadRef.current?.({ numPages: calculatedTotal });

          // 3. Resolve target page / CFI (always resolves accurately even for page 1)
          const targetPage = initialPageRef.current || book?.currentPage || 1;
          let targetLocation = book?.currentCfi || undefined;

          if (!targetLocation && bookInstance.locations?.total > 0) {
            const locIdx = Math.max(0, Math.min(targetPage - 1, bookInstance.locations.total - 1));
            targetLocation = bookInstance.locations.cfiFromLocation(locIdx);
          }

          // 4. Render target location into viewer
          await rendition.display(targetLocation);

          if (!isMounted) return;

          lastReportedPage.current = targetPage;
          initialPageRef.current = targetPage;
          setCurrentPage(targetPage);

          // 5. In vertical continuous mode, ensure adjacent sections are pre-filled
          // so the user is never trapped on a short cover/title page with no scrollbar
          if (isVertical && rendition.manager) {
            setTimeout(() => {
              if (!isMounted) return;
              try {
                const manager = rendition.manager;
                const container = viewerRef.current?.querySelector('.epub-container') || manager.container;
                if (container && container.scrollHeight <= container.clientHeight * 1.5) {
                  const last = manager.views?.last?.();
                  const next = last?.section?.next?.();
                  if (next) {
                    const newView = manager.append(next);
                    newView?.display?.(manager.request)?.then(() => {
                      manager.update?.();
                    });
                  }
                }
              } catch (_) {}
            }, 120);
          }

          // 6. Dismiss skeleton once browser paints
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 120);

        } catch (initErr) {
          console.error('[Apex EPUB] Initialization pipeline error:', initErr);
          if (isMounted) {
            rendition.display().finally(() => {
              if (isMounted) setLoading(false);
            });
          }
        }
      };

      initializeReader();

    } catch (err) {
      console.error('[Apex EPUB] Fatal error:', err);
      if (isMounted) {
        setError(err.message || 'Failed to open EPUB file');
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (renditionRef.current) {
        try { renditionRef.current.destroy(); } catch (_) {}
      }
      if (bookInstanceRef.current) {
        try { bookInstanceRef.current.destroy(); } catch (_) {}
      }
    };
  }, [fileUrl, isVertical]); // Re-init when fileUrl or layout orientation changes

  // ResizeObserver: re-flow rendition when reader container resizes (e.g. side panels open/close)
  useEffect(() => {
    if (!viewerRef.current) return;
    let resizeTimer;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (renditionRef.current && entries[0]?.contentRect) {
          const { width, height } = entries[0].contentRect;
          if (width > 0 && height > 0) {
            try {
              renditionRef.current.resize(width, height);
            } catch (_) {}
          }
        }
      }, 120);
    });
    observer.observe(viewerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, []);

  // Programmatic page jump when pageNumber prop changes from ReaderView
  useEffect(() => {
    if (loading || !renditionRef.current || !bookInstanceRef.current) return;
    if (pageNumber === lastReportedPage.current) return;
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const isLargeJump = Math.abs(pageNumber - lastReportedPage.current) > 2;
    if (isLargeJump) {
      setJumpOverlayVisible(true);
      setJumpOverlayFading(false);
    }

    lastReportedPage.current = pageNumber;
    initialPageRef.current = pageNumber;

    const dismissOverlay = () => {
      if (isLargeJump) {
        if (jumpOverlayTimer.current) clearTimeout(jumpOverlayTimer.current);
        jumpOverlayTimer.current = setTimeout(() => {
          setJumpOverlayFading(true);
          setTimeout(() => {
            setJumpOverlayVisible(false);
            setJumpOverlayFading(false);
          }, 300);
        }, 150);
      }
    };

    try {
      const locations = bookInstanceRef.current.locations;
      if (locations && locations.total > 0) {
        const targetIndex = Math.max(0, Math.min(pageNumber - 1, locations.total - 1));
        const cfi = locations.cfiFromLocation(targetIndex);
        if (cfi) {
          renditionRef.current.display(cfi).then(dismissOverlay).catch((err) => {
            console.warn('[Apex EPUB] Display cfi error:', err);
            setJumpOverlayVisible(false);
          });
          return;
        }
      }

      // Direct page or section jump fallback
      if (pageNumber > 0) {
        renditionRef.current.display(pageNumber).then(dismissOverlay).catch(() => {
          setJumpOverlayVisible(false);
        });
      }
    } catch (err) {
      console.warn('[Apex EPUB] Programmatic jump failed:', err);
      setJumpOverlayVisible(false);
    }
  }, [pageNumber, loading]);

  // Dynamic font scaling
  useEffect(() => {
    if (renditionRef.current) {
      try {
        renditionRef.current.themes.fontSize(`${Math.round(scale * 100)}%`);
      } catch (_) {}
    }
  }, [scale]);

  // Render highlights onto rendition annotations
  useEffect(() => {
    if (!renditionRef.current || !highlights || highlights.length === 0) return;
    highlights.forEach((h) => {
      if (h.cfiRange) {
        try {
          renditionRef.current.annotations.add(
            'highlight',
            h.cfiRange,
            {},
            undefined,
            'apex-epub-highlight',
            { fill: h.color || '#fde047', 'fill-opacity': '0.35' }
          );
        } catch (_) {}
      }
    });
  }, [highlights]);

  // Keyboard navigation (Arrow keys, PageUp/Down, Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (locked) return;
      if (isVertical) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          handleNext();
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          handlePrev();
        }
      } else {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          handleNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          handlePrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, isVertical, handleNext, handlePrev]);

  // Swipe gestures via react-swipeable for container outer area
  const handleSwipedLeft = () => {
    if (swipeLockedRef.current || isVertical) return;
    if (window.getSelection()?.toString().trim()) return;
    handleNext();
  };

  const handleSwipedRight = () => {
    if (swipeLockedRef.current || isVertical) return;
    if (window.getSelection()?.toString().trim()) return;
    handlePrev();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: !isVertical ? handleSwipedLeft : undefined,
    onSwipedRight: !isVertical ? handleSwipedRight : undefined,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
    swipeDuration: 500,
  });

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
      onWheel={handleOuterWheel}
      className="flex-1 flex flex-col items-center h-full max-h-full w-full relative overflow-hidden select-text epub-container"
      id="epub-container"
    >
      {/* Scoped CSS ensuring epub.js container handles scrolling seamlessly without anchor jumps */}
      <style>{`
        #epub-container,
        #epub-container .epub-container,
        #epub-container .epub-view {
          overflow-anchor: none !important;
        }
        #epub-container .epub-container {
          width: 100% !important;
          height: 100% !important;
          overflow-y: ${isVertical ? 'auto' : 'hidden'} !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
        }
        #epub-container .epub-view {
          width: 100% !important;
          margin: 0 auto;
        }
        #epub-container .epub-view > iframe {
          width: 100% !important;
          border: none !important;
          display: block;
        }
      `}</style>

      {/* Initial Loading Skeleton Overlay */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center bg-bg-primary transition-opacity duration-300 ${
          loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <BookSkeleton message="Preparing book..." />
      </div>

      {/* Teleport / Jump Skeleton Overlay for large page jumps */}
      <div
        className={`absolute inset-0 z-20 flex items-center justify-center bg-bg-primary transition-opacity duration-300 ${
          jumpOverlayVisible ? (jumpOverlayFading ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto') : 'hidden'
        }`}
      >
        <BookSkeleton message="Jumping to page..." />
      </div>

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-6 text-center bg-bg-primary">
          <p className="text-rose-500 font-bold text-lg">Error opening EPUB</p>
          <p className="text-text-secondary text-sm max-w-md">{error}</p>
        </div>
      )}

      {/* EPUB Viewport: overflow-hidden so the inner .epub-container manages continuous scrolling */}
      <div
        ref={viewerRef}
        className="flex-1 w-full h-full relative overflow-hidden"
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
      />

      {/* Floating Prev/Next Buttons (for horizontal paginated mode) */}
      {!isVertical && !loading && !error && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            disabled={currentPage <= 1}
            className="md:flex hidden absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-bg-elevated hover:bg-gray-50 text-text-secondary hover:text-accent-primary transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 dark:border-white/10"
            title="Previous page"
          >
            <CaretLeft size={28} strokeWidth={2.5} className="-ml-1" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={currentPage >= totalPages}
            className="md:flex hidden absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-bg-elevated hover:bg-gray-50 text-text-secondary hover:text-accent-primary transition-all duration-300 active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 dark:border-white/10"
            title="Next page"
          >
            <CaretRight size={28} strokeWidth={2.5} className="ml-1" />
          </button>
        </>
      )}
    </div>
  );
}

export default EPUBReader;


