import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkle,
  BookOpen,
  Brain,
  Stack,
  MagicWand,
  PaintBrush,
  ArrowRight,
  Check,
  X,
  Highlighter,
  Notebook,
  ArrowLeft,
  Gear,
  BookmarkSimple,
  DotsThreeVertical,
  TextAa,
  LockKey,
  CornersOut,
  List,
  MagnifyingGlassPlus,
  ArrowCounterClockwise,
  Lightning
} from '@phosphor-icons/react';
import useOnboardingStore from '../../store/useOnboardingStore';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * ReaderTour — Native in-app interactive reader tour.
 * Flow:
 * 1. Welcome Modal: Overview of reading features
 * 2. Highlight Prompt: Wait for user to select text
 * 3. Highlight Menu Spotlight: Blurs background, spotlights floating menu, explains Ask AI / Simplify / Colors
 * 4. Menu Button Spotlight: Blurs background, spotlights persistent top center Menu button
 * 5. Primary Nav Bar Modal: Concise list of icons and their specific functions
 * 6. Dots Button Spotlight: Blurs background, spotlights three vertical stacked dots (•••)
 * 7. Extended Tools Modal: Concise list of secondary tools (TOC, Zoom, Flashcards, Quizzes)
 */
export default function ReaderTour({
  showHighlightMenu,
  navState,
  setNavState,
  isLoading
}) {
  const { hasSeenReaderTour, completeTour } = useOnboardingStore();
  // Steps: 'welcome' | 'highlight-prompt' | 'highlight-menu' | 'menu-button' | 'first-nav-modal' | 'dots-button' | 'second-nav-modal' | null
  const [currentStep, setCurrentStep] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize tour ONLY after document text or canvas is genuinely mounted and rendered in the DOM
  useEffect(() => {
    if (!hasSeenReaderTour && !isLoading) {
      const checkContentRendered = () => {
        // Look for rendered PDF page canvas, text layer or reader container
        const pageEl = document.querySelector(
          '.react-pdf__Page__canvas, .react-pdf__Page__textContent, .pdf-page-wrapper, .epub-container, .docx-viewer'
        );
        if (pageEl) {
          setCurrentStep('welcome');
          return true;
        }
        return false;
      };

      if (!checkContentRendered()) {
        const interval = setInterval(() => {
          if (checkContentRendered()) {
            clearInterval(interval);
          }
        }, 150);
        return () => clearInterval(interval);
      }
    } else if (hasSeenReaderTour) {
      setCurrentStep(null);
    }
  }, [isLoading, hasSeenReaderTour]);

  // Keep first nav open during first-nav-modal and dots-button steps
  useEffect(() => {
    if (currentStep === 'first-nav-modal' || currentStep === 'dots-button') {
      setNavState?.('first');
    } else if (currentStep === 'second-nav-modal') {
      setNavState?.('second');
    } else if (currentStep === 'streak-info') {
      setNavState?.('none');
    }
  }, [currentStep, setNavState]);

  // When user highlights text during the prompt step, advance to 'highlight-menu'
  useEffect(() => {
    if (currentStep === 'highlight-prompt' && showHighlightMenu) {
      setCurrentStep('highlight-menu');
    }
  }, [currentStep, showHighlightMenu]);

  // Auto-advance and listen for clicks on the persistent menu button
  useEffect(() => {
    if (currentStep === 'menu-button') {
      const handleMenuClick = (e) => {
        e?.stopPropagation();
        setNavState?.('first');
        setCurrentStep('first-nav-modal');
      };
      const btn = document.querySelector('#tour-reader-menu-btn');
      if (btn) {
        btn.addEventListener('click', handleMenuClick, true);
        return () => btn.removeEventListener('click', handleMenuClick, true);
      }
    }
  }, [currentStep, setNavState]);

  // Auto-advance and listen for clicks on the dots button
  useEffect(() => {
    if (currentStep === 'dots-button') {
      const handleDotsClick = () => {
        setNavState?.('second');
        setCurrentStep('second-nav-modal');
      };
      const btn = document.querySelector('#tour-reader-dots');
      if (btn) {
        btn.addEventListener('click', handleDotsClick);
        return () => btn.removeEventListener('click', handleDotsClick);
      }
    }
  }, [currentStep, setNavState]);

  // Auto-advance if user or code opens nav during 'menu-button' step
  useEffect(() => {
    if (currentStep === 'menu-button' && navState === 'first') {
      setCurrentStep('first-nav-modal');
    }
  }, [currentStep, navState]);

  // Auto-advance if user or code clicks dots during 'dots-button' step
  useEffect(() => {
    if (currentStep === 'dots-button' && navState === 'second') {
      setCurrentStep('second-nav-modal');
    }
  }, [currentStep, navState]);

  const lastSelRectRef = React.useRef(null);

  // Clear cached selection rect when leaving highlight steps
  useEffect(() => {
    if (currentStep !== 'highlight-prompt' && currentStep !== 'highlight-menu') {
      lastSelRectRef.current = null;
    }
  }, [currentStep]);

  // Track bounding rect of target elements for spotlight cutout
  useEffect(() => {
    const spotlightSteps = ['highlight-menu', 'menu-button', 'dots-button'];
    if (!currentStep || !spotlightSteps.includes(currentStep)) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      if (currentStep === 'highlight-menu') {
        const menuEl = document.querySelector('#tour-highlight-menu, .highlight-menu-container');
        let menuRect = null;
        if (menuEl) {
          const r = menuEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            menuRect = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
          }
        }

        let selRect = null;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          try {
            const range = sel.getRangeAt(0);
            const r = range.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              selRect = { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
              lastSelRectRef.current = selRect;
            }
          } catch {
            // Ignore selection error
          }
        }

        if (!selRect && lastSelRectRef.current) {
          selRect = lastSelRectRef.current;
        }

        if (menuRect || selRect) {
          const top = Math.min(menuRect ? menuRect.top : Infinity, selRect ? selRect.top : Infinity);
          const left = Math.min(menuRect ? menuRect.left : Infinity, selRect ? selRect.left : Infinity);
          const bottom = Math.max(menuRect ? menuRect.bottom : -Infinity, selRect ? selRect.bottom : -Infinity);
          const right = Math.max(menuRect ? menuRect.right : -Infinity, selRect ? selRect.right : -Infinity);

          setTargetRect({
            top,
            left,
            width: right - left,
            height: bottom - top,
            isCircle: false,
            radius: 16,
            menuRect,
            selRect,
          });
          return;
        }
      } else {
        let selector = null;
        let isCircle = false;

        if (currentStep === 'menu-button') {
          selector = '#tour-reader-menu-btn';
          isCircle = true;
        } else if (currentStep === 'dots-button') {
          selector = '#tour-reader-dots';
          isCircle = true;
        }

        if (selector) {
          const el = document.querySelector(selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                isCircle,
                radius: isCircle ? Math.max(rect.width, rect.height) / 2 + 4 : 16,
              });
              return;
            }
          }
        }
      }

      setTargetRect(null);
    };

    updateRect();
    const interval = setInterval(updateRect, 100);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep]);

  // Complete tour handler
  const handleFinishTour = () => {
    completeTour('Reader');
    setCurrentStep(null);
  };

  if (hasSeenReaderTour || !currentStep) {
    return null;
  }

  const pad = currentStep === 'highlight-menu' ? 8 : 6;
  const isSpotlightActive = ['highlight-menu', 'menu-button', 'dots-button'].includes(currentStep);

  // Smart dynamic card positioning for the highlight-menu step
  const getHighlightMenuCardStyle = () => {
    const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = windowW < 768;
    const cardHeightEst = 220;

    if (!targetRect) {
      return {
        bottom: 24,
        left: isMobile ? 16 : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: isMobile ? 'calc(100vw - 32px)' : '420px',
      };
    }

    const topBound = targetRect.selRect && targetRect.menuRect
      ? Math.min(targetRect.menuRect.top, targetRect.selRect.top)
      : targetRect.top;
    const bottomBound = targetRect.selRect && targetRect.menuRect
      ? Math.max(targetRect.menuRect.bottom, targetRect.selRect.bottom)
      : targetRect.top + targetRect.height;

    const spaceAbove = topBound;
    const spaceBelow = windowH - bottomBound;

    let style = {
      width: isMobile ? 'calc(100vw - 32px)' : '420px',
      left: isMobile ? 16 : '50%',
      transform: isMobile ? 'none' : 'translateX(-50%)',
    };

    // If ample space below, place below
    if (spaceBelow >= cardHeightEst + 24) {
      style.top = Math.max(16, bottomBound + 16);
    } else if (spaceAbove >= cardHeightEst + 24) {
      // If ample space above, place above
      style.top = Math.max(16, topBound - cardHeightEst - 16);
    } else if (spaceAbove >= spaceBelow) {
      // Tighter space, more room above: place above
      style.top = Math.max(16, topBound - cardHeightEst - 8);
    } else {
      // Tighter space, more room below: place below
      style.top = Math.min(windowH - cardHeightEst - 16, bottomBound + 8);
    }

    return style;
  };

  return createPortal(
    <>
      {/* ── Spotlight Backdrop Blur Overlay with Cutout ──────────────── */}
      {isSpotlightActive && (
        <>
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-[9980]"
            style={{ width: '100vw', height: '100vh' }}
          >
            <defs>
              <mask id="reader-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  targetRect.selRect && targetRect.menuRect ? (
                    <>
                      {/* Highlighted text spotlight cutout — preserves native blue selection marker */}
                      <rect
                        x={targetRect.selRect.left - 6}
                        y={targetRect.selRect.top - 4}
                        width={targetRect.selRect.width + 12}
                        height={targetRect.selRect.height + 8}
                        rx={8}
                        fill="black"
                      />
                      {/* Floating highlight menu spotlight cutout */}
                      <rect
                        x={targetRect.menuRect.left - pad}
                        y={targetRect.menuRect.top - pad}
                        width={targetRect.menuRect.width + pad * 2}
                        height={targetRect.menuRect.height + pad * 2}
                        rx={16}
                        fill="black"
                      />
                    </>
                  ) : targetRect.isCircle ? (
                    <circle
                      cx={targetRect.left + targetRect.width / 2}
                      cy={targetRect.top + targetRect.height / 2}
                      r={Math.max(targetRect.width, targetRect.height) / 2 + 5}
                      fill="black"
                    />
                  ) : (
                    <rect
                      x={targetRect.left - pad}
                      y={targetRect.top - pad}
                      width={targetRect.width + pad * 2}
                      height={targetRect.height + pad * 2}
                      rx={targetRect.radius}
                      fill="black"
                    />
                  )
                )}
              </mask>
            </defs>
          </svg>

          {/* Full Screen Dimmed & Blurred Backdrop */}
          <div
            className="fixed inset-0 z-[9980] bg-black/40 backdrop-blur-[6px] transition-all duration-150 pointer-events-none"
            style={{
              mask: 'url(#reader-spotlight-mask)',
              WebkitMask: 'url(#reader-spotlight-mask)',
            }}
          />
        </>
      )}

      {/* ── Step 1: Welcome Modal ────────────────────────────────────── */}
      <Modal
        isOpen={currentStep === 'welcome'}
        title="Welcome to the Reader"
        onClose={handleFinishTour}
        className="max-w-md"
        actions={[
          {
            label: "Let's Explore",
            variant: 'primary',
            onClick: () => setCurrentStep('highlight-prompt'),
          },
          {
            label: 'Skip Tour',
            variant: 'ghost',
            onClick: handleFinishTour,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            Apex brings your books to life with contextual AI assistance, quick highlights, and smart study generation.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                <Sparkle size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Interactive AI Toolkit</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Select any text to get instant explanations, simplify jargon, or translate concepts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <PaintBrush size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Highlights & Notes</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Color-code critical passages and automatically sync them to your Notebook.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Brain size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Flashcards & Quizzes</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Turn reading pages into active-recall flashcards and practice quizzes anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 2: Interactive Highlight Prompt Card (Advances upon selection) ── */}
      <AnimatePresence>
        {currentStep === 'highlight-prompt' && (
          <div className="fixed inset-x-0 bottom-6 flex justify-center px-4 z-[9990] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <Highlighter size={20} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 1 of 4</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Highlight Any Text</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-3 font-sans">
                  Click and drag your cursor (or tap and drag on touch) across any sentence or paragraph on the page to reveal the AI reading menu.
                </p>

                {/* Waiting for selection status indicator */}
                <div className="flex items-center justify-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-bg-primary/70 border border-black/5 dark:border-white/5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
                  </span>
                  <span className="text-xs font-semibold text-text-secondary font-sans tracking-wide">
                    Waiting for text selection on page...
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Highlight Menu Spotlight Card (Focused with Background Blur) ── */}
      <AnimatePresence>
        {currentStep === 'highlight-menu' && (
          <div
            className="fixed z-[9990] pointer-events-none transition-all duration-200"
            style={getHighlightMenuCardStyle()}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 2 of 4</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">AI Reading Toolkit</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  The floating menu above your selection lets you <strong className="text-text-primary">Ask AI</strong> questions with book context, <strong className="text-text-primary">Simplify</strong> complex terms, or <strong className="text-text-primary">Color-code</strong> highlights that sync to your Notebook.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="primary"
                    onClick={() => {
                      window.getSelection()?.removeAllRanges();
                      setCurrentStep('menu-button');
                    }}
                    className="w-full !py-2.5 text-xs font-bold font-display"
                  >
                    Next: Navigation Menu
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 4: Top Center Persistent Menu Button Spotlight ────────── */}
      <AnimatePresence>
        {currentStep === 'menu-button' && (
          <div className="fixed top-14 inset-x-0 flex justify-center px-4 z-[9990] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <BookOpen size={20} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 3 of 4</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Open Navigation Toolbar</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  Click the persistent <strong className="text-text-primary">Menu</strong> button at the top center of your screen anytime to reveal reading controls and toolbars.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setNavState?.('first');
                      setCurrentStep('first-nav-modal');
                    }}
                    className="w-full !py-2.5 text-xs font-bold font-display"
                  >
                    Open Toolbar
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 5: Primary Navigation Bar Overview Modal ─────────────── */}
      <Modal
        isOpen={currentStep === 'first-nav-modal'}
        title="Primary Reading Toolbar"
        hideOverlay={true}
        onClose={handleFinishTour}
        className="max-w-lg"
        actions={[
          {
            label: 'Next: Extended Tools',
            variant: 'primary',
            onClick: () => {
              setNavState?.('first');
              setCurrentStep('dots-button');
            },
          },
          {
            label: 'Skip',
            variant: 'ghost',
            onClick: handleFinishTour,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-xs leading-relaxed">
            Here is a breakdown of the primary tools in your reader navigation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Back */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-text-primary shrink-0">
                <ArrowLeft size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Back to Library</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Return to dashboard</p>
              </div>
            </div>

            {/* Gear / Settings */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-text-primary shrink-0">
                <Gear size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Reading Settings</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Fonts, themes & scroll modes</p>
              </div>
            </div>

            {/* Bookmark */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-accent-primary shrink-0">
                <BookmarkSimple size={16} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Page Bookmark</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Save current reading spot</p>
              </div>
            </div>

            {/* Cleo AI */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                <Sparkle size={16} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Cleo AI Tutor</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Ask questions on document</p>
              </div>
            </div>

            {/* Dictionary */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <TextAa size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Dictionary</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Definitions & phonetics</p>
              </div>
            </div>

            {/* Notebook */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Notebook size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Notebook</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">All book notes & highlights</p>
              </div>
            </div>

            {/* Pan Lock */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <LockKey size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Pan Lock</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Lock scroll during reading</p>
              </div>
            </div>

            {/* Fullscreen */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-text-primary shrink-0">
                <CornersOut size={16} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Fit / Fullscreen</p>
                <p className="text-[11px] text-text-tertiary truncate font-sans">Reset zoom or full screen</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 6: Three Vertical Dots (•••) Spotlight Card ──────────── */}
      <AnimatePresence>
        {currentStep === 'dots-button' && (
          <div className="fixed top-16 inset-x-0 md:inset-x-auto md:right-8 z-[9990] flex justify-center md:justify-end px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <DotsThreeVertical size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 4 of 4</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Extended Tools</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  Click the <strong className="text-text-primary">three vertical dots</strong> at the top right to access chapter table of contents, precision zoom, and study generators.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setNavState?.('second');
                      setCurrentStep('second-nav-modal');
                    }}
                    className="w-full !py-2.5 text-xs font-bold font-display"
                  >
                    Open Extended Tools
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 7: Secondary Navigation Bar Overview Modal ───────────── */}
      <Modal
        isOpen={currentStep === 'second-nav-modal'}
        title="Extended Reading Tools"
        hideOverlay={true}
        onClose={handleFinishTour}
        className="max-w-lg"
        actions={[
          {
            label: "Next: Daily Streak",
            variant: 'primary',
            onClick: () => {
              setNavState?.('none');
              setCurrentStep('streak-info');
            },
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-xs leading-relaxed">
            The extended toolbar gives you advanced study utilities and document controls:
          </p>

          <div className="space-y-2 pt-1">
            {/* Table of Contents */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-text-primary shrink-0">
                <List size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Table of Contents & Highlights</p>
                <p className="text-[11px] text-text-tertiary font-sans">
                  Browse document chapters, search full text, and review all saved color highlights.
                </p>
              </div>
            </div>

            {/* Zoom & Rotation */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-bg-subtle dark:bg-bg-elevated text-text-primary shrink-0">
                <MagnifyingGlassPlus size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Zoom & Rotate</p>
                <p className="text-[11px] text-text-tertiary font-sans">
                  Scale document magnification with precision percentage controls and rotate orientation.
                </p>
              </div>
            </div>

            {/* Flashcards */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                <Stack size={18} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">Smart Flashcards Generator</p>
                <p className="text-[11px] text-text-tertiary font-sans">
                  Automatically generate active-recall study flashcards from the current reading section.
                </p>
              </div>
            </div>

            {/* Quiz */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Brain size={18} weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-display text-text-primary">AI Practice Quiz Generator</p>
                <p className="text-[11px] text-text-tertiary font-sans">
                  Test your comprehension with custom quizzes generated directly from the pages read.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 8: Daily Reading Streak Modal ────────────────────────── */}
      <Modal
        isOpen={currentStep === 'streak-info'}
        title="Daily Reading Streak"
        hideOverlay={true}
        onClose={handleFinishTour}
        className="max-w-md"
        actions={[
          {
            label: "Got It, Let's Keep a Streak",
            variant: 'primary',
            onClick: handleFinishTour,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            Read for just <strong className="text-text-primary">2 minutes</strong> to earn your <strong className="text-accent-primary">1-day reading streak</strong> and unlock daily study rewards.
          </p>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5 mt-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Lightning size={22} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold font-display text-text-primary">2 Minutes = 1 Day Streak</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed font-sans">
                Your streak timer starts the moment you begin reading. Keep reading daily to build your habit!
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>,
    document.body
  );
}
