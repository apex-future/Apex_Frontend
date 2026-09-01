import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkle,
  BookOpen,
  Plus,
  Rocket,
  Trophy,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  X,
  Gear
} from '@phosphor-icons/react';
import useOnboardingStore from '../../store/useOnboardingStore';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * DashboardTour — Native in-app interactive dashboard tour.
 * Features:
 * - Ensures mobile bottom nav bar is visible on the upload slide
 * - Perfectly fitted spotlight cutout around upload buttons (circle on mobile, pill on desktop)
 * - Mobile view: scrolls book card towards the top (~80px) so there's plenty of space below without overlapping
 * - Desktop view: Card positioned at top-right directly beneath upload button
 * - Replay Confirmation Modal shown when user skips the tour from the first screen
 * - Space Grotesk (font-display) and Inter (font-sans) typography
 */
export default function DashboardTour({
  isPersonalizationDone,
  books = [],
  firstBookId,
  isLoading = false
}) {
  const { hasSeenDashboardTour, completeTour } = useOnboardingStore();
  // Steps: 'welcome' | 'upload' | 'book-card' | null
  const [currentStep, setCurrentStep] = useState(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [isBookCardSettled, setIsBookCardSettled] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const hasBooks = books && books.length > 0;

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-start whenever tour is not seen (universal for brand new users & tour replay)
  useEffect(() => {
    if (!hasSeenDashboardTour) {
      setShowSkipModal(false);
      setCurrentStep('welcome');
    } else {
      setCurrentStep(null);
    }
  }, [hasSeenDashboardTour]);

  // Track initial book count to detect newly uploaded books
  const prevBooksCountRef = React.useRef(books ? books.length : 0);

  // Smart Auto-Advance: When a book is added during the upload step, auto-advance as soon as the book card renders in the library
  useEffect(() => {
    if (currentStep === 'upload') {
      const checkAndAdvance = () => {
        if (books && books.length > 0) {
          const selector = firstBookId
            ? `#book-card-${firstBookId}, [data-tour-first-book="true"], [id^="book-card-"]`
            : '[data-tour-first-book="true"], [id^="book-card-"]';
          const el = document.querySelector(selector);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Ensure element is actually mounted with dimensions
            if (rect.width > 0 && rect.height > 0) {
              setCurrentStep('book-card');
              return true;
            }
          }
        }
        return false;
      };

      const currentCount = books ? books.length : 0;
      if (currentCount > prevBooksCountRef.current || (currentCount > 0 && prevBooksCountRef.current === 0)) {
        checkAndAdvance();
      }

      const pollInterval = setInterval(() => {
        if (checkAndAdvance()) {
          clearInterval(pollInterval);
        }
      }, 200);

      return () => clearInterval(pollInterval);
    }
    prevBooksCountRef.current = books ? books.length : 0;
  }, [currentStep, books, firstBookId]);

  // Ensure bottom navbar is forced visible when on the upload step on mobile
  useEffect(() => {
    if (currentStep === 'upload') {
      window.dispatchEvent(new CustomEvent('apex-force-show-bottom-nav'));
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('apex-force-show-bottom-nav'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Complete dashboard tour when user clicks the spotlighted book card
  useEffect(() => {
    if (currentStep === 'book-card') {
      const handleBookCardClick = () => {
        completeTour('Dashboard');
        setCurrentStep(null);
      };
      const selector = firstBookId
        ? `#book-card-${firstBookId}, [data-tour-first-book="true"], [id^="book-card-"]`
        : '[data-tour-first-book="true"], [id^="book-card-"]';
      const el = document.querySelector(selector);
      if (el) {
        el.addEventListener('click', handleBookCardClick);
        return () => el.removeEventListener('click', handleBookCardClick);
      }
    }
  }, [currentStep, firstBookId, completeTour]);

  // When entering book-card step, scroll element into view (towards the top on mobile to avoid card overlap)
  useEffect(() => {
    if (currentStep === 'book-card') {
      setIsBookCardSettled(false);

      const selector = firstBookId
        ? `#book-card-${firstBookId}, [data-tour-first-book="true"], [id^="book-card-"]`
        : '[data-tour-first-book="true"], [id^="book-card-"]';
      const el = document.querySelector(selector);

      if (el) {
        if (window.innerWidth < 768) {
          // On mobile, scroll so the top of the book card is ~75px from top of viewport
          const elRect = el.getBoundingClientRect();
          const targetScrollY = window.scrollY + elRect.top - 75;
          window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Allow scroll animation to finish and settle before revealing the slide directly in place
      const settleTimer = setTimeout(() => {
        setIsBookCardSettled(true);
      }, 350);

      return () => clearTimeout(settleTimer);
    } else {
      setIsBookCardSettled(false);
    }
  }, [currentStep, firstBookId]);

  // Track target element bounding rect for spotlight cutout and anchoring
  useEffect(() => {
    if (!currentStep || currentStep === 'welcome') {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      let selector = null;
      let isCircle = false;

      if (currentStep === 'upload') {
        selector = window.innerWidth < 768 ? '#tour-add-book-mobile' : '#tour-add-book';
        isCircle = window.innerWidth < 768;
      } else if (currentStep === 'book-card') {
        selector = firstBookId
          ? `#book-card-${firstBookId}, [data-tour-first-book="true"], [id^="book-card-"]`
          : '[data-tour-first-book="true"], [id^="book-card-"]';
        isCircle = false;
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
  }, [currentStep, firstBookId, isMobile]);

  // Handle user clicking "Skip Tour" on the first modal -> show replay info modal
  const handlePromptSkip = () => {
    setCurrentStep(null);
    setShowSkipModal(true);
  };

  // Complete tour cleanly
  const handleFinishTour = () => {
    completeTour('Dashboard');
    setCurrentStep(null);
    setShowSkipModal(false);
  };

  if ((hasSeenDashboardTour && !showSkipModal) || (!currentStep && !showSkipModal)) {
    return null;
  }

  const pad = currentStep === 'upload' ? (isMobile ? 5 : 8) : 8;

  // Compute anchored positioning for the book-card slide directly underneath the highlighted book
  const getBookCardSlideStyle = () => {
    if (!targetRect) {
      return {
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100vw - 32px)' : '420px',
      };
    }

    const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const cardHeightEst = 220;
    const spaceBelow = windowH - (targetRect.top + targetRect.height + pad + 16);

    let topPos = targetRect.top + targetRect.height + pad + 16;
    // If not enough room below, place right above the book card (only on desktop if space above is ample)
    if (!isMobile && spaceBelow < cardHeightEst && targetRect.top > cardHeightEst + 20) {
      topPos = targetRect.top - pad - cardHeightEst - 16;
    }

    return {
      top: Math.max(16, Math.min(windowH - cardHeightEst - 16, topPos)),
      left: isMobile
        ? 16
        : Math.max(24, Math.min(windowW - 440, targetRect.left + targetRect.width / 2 - 210)),
      width: isMobile ? 'calc(100vw - 32px)' : '420px',
    };
  };

  return createPortal(
    <>
      {/* ── Spotlight Backdrop Blur Overlay with Cutout ──────────────── */}
      {currentStep && currentStep !== 'welcome' && (
        <>
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-[9980]"
            style={{ width: '100vw', height: '100vh' }}
          >
            <defs>
              <mask id="dashboard-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  targetRect.isCircle ? (
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
                      rx={currentStep === 'upload' ? (targetRect.height + pad * 2) / 2 : 16}
                      fill="black"
                    />
                  )
                )}
              </mask>
            </defs>
          </svg>

          {/* Full Screen Dimmed & Blurred Backdrop with Cutout (no border) */}
          <div
            className="fixed inset-0 z-[9980] bg-black/40 backdrop-blur-[6px] transition-all duration-150 pointer-events-none"
            style={{
              mask: 'url(#dashboard-spotlight-mask)',
              WebkitMask: 'url(#dashboard-spotlight-mask)',
            }}
          />
        </>
      )}

      {/* ── Step 1: Welcome to Apex Modal (uses Modal component) ────────── */}
      <Modal
        isOpen={currentStep === 'welcome'}
        title="Welcome to Apex"
        onClose={handlePromptSkip}
        className="max-w-md"
        actions={[
          {
            label: 'Start Guided Tour',
            variant: 'primary',
            onClick: () => setCurrentStep('upload'),
          },
          {
            label: 'Skip Tour',
            variant: 'ghost',
            onClick: handlePromptSkip,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            Apex is your all-in-one AI learning space. We bring your books, notes, flashcards, and an AI tutor into one seamless platform.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                <BookOpen size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Universal Library</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Read PDFs, EPUBs, and DOCX documents with cloud sync and custom layouts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkle size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Contextual AI Tutor</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Highlight text to summarize, define words, simplify paragraphs, or ask questions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Trophy size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Gamified Study Progress</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Build daily streaks, complete quests, earn XP, and generate smart flashcards & quizzes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Replay Info Modal (Shown when user skips the tour) ─────────── */}
      <Modal
        isOpen={showSkipModal}
        title="Replay Tour Anytime"
        onClose={handleFinishTour}
        className="max-w-md"
        actions={[
          {
            label: 'Got It',
            variant: 'primary',
            onClick: handleFinishTour,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            No worries! You can revisit this guided tour at any time whenever you want a quick walkthrough.
          </p>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-bg-primary/70 border border-black/5 dark:border-white/5 mt-3">
            <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary shrink-0">
              <ArrowCounterClockwise size={20} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-bold font-display text-text-primary">How to Replay</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed font-sans">
                Go to <strong className="text-text-primary">Settings → Preferences</strong> and click <strong className="text-accent-primary">Replay In-App Tour</strong> anytime.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 2: Upload Documents Spotlight Card ───────────────────── */}
      <AnimatePresence>
        {currentStep === 'upload' && (
          <div
            className={`fixed z-[9990] pointer-events-none ${
              isMobile
                ? 'inset-x-0 bottom-24 flex justify-center px-4'
                : 'top-20 right-4 md:right-8 lg:right-12 w-full max-w-sm flex justify-end px-4'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 24 : -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 16 : -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <Plus size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">
                        {hasBooks ? 'Step 1 of 2' : 'Step 1 of 1'}
                      </span>
                      <h3 className="text-sm font-bold font-display text-text-primary">
                        {hasBooks ? 'Add More Documents' : 'Add Your First Book'}
                      </h3>
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
                  {isMobile
                    ? 'Tap the + button directly below in the bottom bar to upload a PDF, EPUB, or DOCX document.'
                    : hasBooks
                    ? 'Click the Upload button in the top menu anytime to add new PDF, EPUB, or DOCX files.'
                    : 'Click the Upload button at the top right of your screen to add your first document.'}
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  {hasBooks ? (
                    <Button
                      variant="primary"
                      onClick={() => setCurrentStep('book-card')}
                      className="w-full !py-2.5 text-xs font-bold font-display"
                    >
                      Next: Explore Library
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleFinishTour}
                      className="w-full !py-2.5 text-xs font-bold font-display"
                    >
                      Got It
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Book Shelf Spotlight Card (Directly underneath the book) ───── */}
      <AnimatePresence>
        {currentStep === 'book-card' && isBookCardSettled && targetRect && (
          <div
            className="fixed z-[9990] pointer-events-none"
            style={getBookCardSlideStyle()}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <BookOpen size={20} weight="fill" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 2 of 2</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Open Any Book</h3>
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
                  Click on any document in your library to enter the Reader Screen and explore AI reading tools, highlights, flashcards, and quizzes.
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep('upload')}
                    className="!py-2 !px-3 text-xs font-display"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinishTour}
                    className="!py-2 !px-4 text-xs font-bold font-display"
                  >
                    Got It, Let's Read
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
