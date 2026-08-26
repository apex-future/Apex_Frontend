import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CaretLeft, CaretRight, Sparkle, ShareNetwork, WifiSlash, ArrowClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import { showToastGlobal } from '../../hooks/useToast';
import StudyWrapLoader from './StudyWrapLoader';
import StudyWrapOpener from './StudyWrapOpener';
import StudyWrapCard from './StudyWrapCard';
import StudyWrapClosing from './StudyWrapClosing';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import apiClient from '../../services/apiClient';
import './studyWrap.css';

// Image imports from src/assets/Exam_Day_Asset/
import card1Img from '../../../assets/Exam_Day_Asset/card1.png';
import cardBgImg from '../../../assets/Exam_Day_Asset/card_background.png';
import logoImg from '../../../assets/logo/logo-dark-removebg-preview.png';
import card2Img from '../../../assets/Exam_Day_Asset/card2.png';
import card3Img from '../../../assets/Exam_Day_Asset/card3.png';
import card4Img from '../../../assets/Exam_Day_Asset/card4.png';
import card5Img from '../../../assets/Exam_Day_Asset/card5.png';
import card6Img from '../../../assets/Exam_Day_Asset/card6.png';

const TOTAL_CARDS = 6;
const SWIPE_THRESHOLD = 50;

const CARD_TOPIC_LABELS = [
  "OVERVIEW",
  "COURSE COVERAGE",
  "TIME SPENT",
  "QUIZ PERFORMANCE",
  "STUDY CONSISTENCY",
  "WRAP SUMMARY"
];

const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

const cardVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    rotateY: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: '0%',
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: SPRING_OPTIONS,
  },
  exit: (dir) => ({
    x: dir > 0 ? '-100%' : '100%',
    rotateY: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.92,
    transition: SPRING_OPTIONS,
  }),
};

export default function StudyWrap({ isOpen, onClose, daysLeft, bookSpaceId }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wrapData, setWrapData] = useState(null);
  const [wrapError, setWrapError] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const direction = useRef(1);
  const lastTransitionTime = useRef(0);
  const hasFiredConfetti = useRef(false);

  const modalCardRef = useRef(null);
  const cardSurfaceRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const cardEnteredAtRef = useRef(Date.now());
  const cardBlobCacheRef = useRef({});

  // Fetch wrap data from backend
  const fetchWrapData = useCallback(async (spaceId) => {
    if (!navigator.onLine) {
      console.warn('[StudyWrap] Offline detected — cannot generate study wrap');
      setWrapError(true);
      return;
    }

    try {
      const spaceTarget = spaceId || 'default';
      console.log('[StudyWrap] Prefetching wrap data from /api/wrap/' + spaceTarget);
      const promise = apiClient.get(`/api/wrap/${spaceTarget}`);
      fetchPromiseRef.current = promise;
      const response = await promise;
      setWrapData(response.data);
      console.log('[StudyWrap] Data prefetched and ready in state');
      return response.data;
    } catch (err) {
      console.error('[StudyWrap] Failed to prefetch wrap data:', err);
      setWrapError(true);
    }
  }, []);

  // Run when modal is opened
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setCurrentCard(0);
    setWrapData(null);
    setWrapError(false);
    setShowExitConfirm(false);
    hasFiredConfetti.current = false;
    cardEnteredAtRef.current = Date.now();
    cardBlobCacheRef.current = {};
    console.log('[StudyWrap] Opened — starting instant prefetch in background');

    // Prefetch wrap data immediately while user sees loader / hold countdown
    fetchWrapData(bookSpaceId);

    // Preload all card images to ensure they show instantly
    const imagesToPreload = [card1Img, card2Img, card3Img, card4Img, card5Img, card6Img];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen, bookSpaceId, fetchWrapData]);

  // Track when each card transition begins & pre-cache active card blob in background
  useEffect(() => {
    cardEnteredAtRef.current = Date.now();

    if (isLoading || !wrapData) return;

    // Pre-cache current card blob after entrance animation settles so click share is 100% synchronous
    const timer = setTimeout(async () => {
      const el = getCardElement();
      if (el) {
        try {
          const blob = await captureCardBlob(el);
          if (blob) {
            cardBlobCacheRef.current[currentCard] = blob;
            console.log(`[StudyWrap] Card ${currentCard} pre-cached for instant 0ms share`);
          }
        } catch (e) {
          // ignore background cache failure
        }
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, [currentCard, isLoading, wrapData]);

  const handleLoadComplete = async () => {
    if (fetchPromiseRef.current) {
      try {
        await fetchPromiseRef.current;
      } catch (err) {
        // Error already handled
      }
    }
    setIsLoading(false);
    setCurrentCard(0);
    cardEnteredAtRef.current = Date.now();
  };

  // Request close triggers confirmation modal
  const handleRequestClose = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  // Confirmed close
  const handleFinalClose = useCallback(() => {
    setShowExitConfirm(false);
    setCurrentCard(0);
    setIsLoading(true);
    onClose?.();
  }, [onClose]);

  // Helper to reliably find the entire styled card modal surface
  const getCardElement = () => {
    return (
      modalCardRef.current ||
      document.getElementById('study-wrap-modal-card') ||
      cardSurfaceRef.current ||
      document.getElementById('study-wrap-active-card')
    );
  };

  // Robust capture utility using html-to-image (with html2canvas fallback)
  const captureCardBlob = async (element) => {
    const el = element || getCardElement();
    if (!el) {
      console.error('[StudyWrap] No element found to capture');
      return null;
    }

    try {
      const rect = el.getBoundingClientRect();
      const targetWidth = rect.width || 420;
      const targetHeight = rect.height || 680;

      const blob = await htmlToImage.toBlob(el, {
        pixelRatio: 2,
        width: targetWidth,
        height: targetHeight,
        canvasWidth: targetWidth * 2,
        canvasHeight: targetHeight * 2,
        backgroundColor: '#000000',
        skipFonts: true,
        cacheBust: false,
        filter: (node) => {
          if (node.classList && node.classList.contains('study-wrap-nav-ignore')) {
            return false;
          }
          return true;
        },
      });
      if (blob) return blob;
    } catch (err) {
      console.warn('[StudyWrap] html-to-image failed, trying html2canvas fallback:', err);
    }

    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        ignoreElements: (targetEl) => {
          return targetEl.classList?.contains('study-wrap-nav-ignore');
        },
      });
      return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    } catch (hErr) {
      console.error('[StudyWrap] Both capture methods failed:', hErr);
      showToastGlobal("Failed to capture card", "error");
      return null;
    }
  };

  // Individual card share (top left share button)
  const handleIndividualShare = async () => {
    console.log('[StudyWrap] Individual share tapped — card:', currentCard);

    const shareText = "I just got my Study Wrap. The work was real and the numbers don't lie. Now it's your turn — apexapp.click 🎯";

    // 1. If we have a pre-cached blob for this card, trigger navigator.share SYNCHRONOUSLY on the user gesture tick!
    let blob = cardBlobCacheRef.current[currentCard];
    if (blob) {
      const file = new File([blob], `apex-wrap-card-${currentCard + 1}.png`, { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Apex Study Wrap',
              text: shareText,
              files: [file],
            });
            console.log('[StudyWrap] Instant synchronous native share completed');
            showToastGlobal("Shared successfully! 🎯", "success");
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('[StudyWrap] Native share dismissed by user');
            return;
          }
          console.warn('[StudyWrap] Synchronous native share error:', err);
        }
      }
    }

    // 2. If not cached yet, capture immediately
    showToastGlobal("Opening share...", "info", 1500);

    const element = getCardElement();
    if (!element) {
      console.error('[StudyWrap] No card surface element found');
      showToastGlobal("Could not capture card", "error");
      return;
    }

    if (!blob) {
      blob = await captureCardBlob(element);
      if (blob) {
        cardBlobCacheRef.current[currentCard] = blob;
      }
    }

    if (!blob) {
      showToastGlobal("Could not generate card image", "error");
      return;
    }

    try {
      const file = new File([blob], `apex-wrap-card-${currentCard + 1}.png`, { type: 'image/png' });

      // Trigger native share sheet
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Apex Study Wrap',
              text: shareText,
              files: [file],
            });
            console.log('[StudyWrap] Native share completed');
            showToastGlobal("Shared successfully! 🎯", "success");
            return;
          } else {
            await navigator.share({
              title: 'Apex Study Wrap',
              text: shareText,
              url: window.location.origin,
            });
            console.log('[StudyWrap] Native share completed (url/text)');
            showToastGlobal("Shared successfully! 🎯", "success");
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('[StudyWrap] Native share dismissed by user');
            return;
          }
          console.warn('[StudyWrap] Native share unavailable, falling back to download:', err);
        }
      }

      // Download fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apex-wrap-card-${currentCard + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[StudyWrap] Downloaded card image (fallback)');
      showToastGlobal("Card image saved! 🎯", "success");
    } catch (e) {
      console.error('[StudyWrap] Export error:', e);
      showToastGlobal("Failed to export image", "error");
    }
  };

  // Full wrap share
  const handleFullWrapShare = async () => {
    console.log('[StudyWrap] Full wrap share triggered');

    // Show start toast
    showToastGlobal("Downloading your Study Wrap...", "info");

    const FILE_NAMES = [
      'apex-wrap-1-overview.png',
      'apex-wrap-2-course-coverage.png',
      'apex-wrap-3-time-spent.png',
      'apex-wrap-4-quiz-performance.png',
      'apex-wrap-5-study-consistency.png',
      'apex-wrap-6-summary.png',
    ];

    const shareText = "I just got my Study Wrap. The work was real and the numbers don't lie. Now it's your turn — apexapp.click 🎯";

    const downloadedBlobs = [];

    // Iterate through each card, navigate to it, 
    // wait for render, capture it
    for (let i = 0; i < TOTAL_CARDS; i++) {
      direction.current = 1;
      setCurrentCard(i);

      // Wait for card to fully render and all text/numbers to settle into final state
      await new Promise((resolve) => setTimeout(resolve, 2600));

      const el = getCardElement();
      const blob = await captureCardBlob(el);
      if (blob) {
        downloadedBlobs.push({ blob, name: FILE_NAMES[i] });
      }
    }

    // Download all captured images
    for (const { blob, name } of downloadedBlobs) {
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Small gap between downloads so browser doesn't block
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Success toast
    showToastGlobal("Study Wrap saved! 🎯", "success");

    // Restore to closing card
    setCurrentCard(5);

    // Share closing card via native share
    const closingBlob = downloadedBlobs[5]?.blob;
    if (closingBlob) {
      const file = new File(
        [closingBlob], 
        'apex-wrap-6-summary.png', 
        { type: 'image/png' }
      );
      if (
        navigator.share && 
        navigator.canShare && 
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            text: shareText,
            files: [file],
          });
          console.log('[StudyWrap] Closing card shared via native share');
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('[StudyWrap] Native share failed:', err);
          }
        }
      }
    }

    console.log('[StudyWrap] Full wrap share complete');
  };

  // Navigation with consistent animation debounce
  const goNext = useCallback(() => {
    const now = Date.now();
    if (now - lastTransitionTime.current < 280) return;
    if (currentCard < TOTAL_CARDS - 1) {
      lastTransitionTime.current = now;
      direction.current = 1;
      console.log(`[StudyWrap] Card transition — direction: ${direction.current}`);
      console.log(`[StudyWrap] Card ${currentCard} → ${currentCard + 1}`);
      setCurrentCard((prev) => prev + 1);
    }
  }, [currentCard]);

  const goPrev = useCallback(() => {
    const now = Date.now();
    if (now - lastTransitionTime.current < 280) return;
    if (currentCard > 0) {
      lastTransitionTime.current = now;
      direction.current = -1;
      console.log(`[StudyWrap] Card transition — direction: ${direction.current}`);
      setCurrentCard((prev) => prev - 1);
    }
  }, [currentCard]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || isLoading) return;

    const handleKeyDown = (e) => {
      if (showExitConfirm) {
        if (e.key === 'Escape') {
          setShowExitConfirm(false);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        handleRequestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, showExitConfirm, goNext, goPrev, handleRequestClose]);

  // Touch handlers for mobile swipe
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
          goNext(); // swipe left → next
        } else {
          goPrev(); // swipe right → prev
        }
      }
    },
    [goNext, goPrev]
  );

  if (!isOpen) return null;

  // Render the correct card by index
  const renderCard = () => {
    if (!wrapData) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      return (
        <div className="w-full min-h-full flex flex-col items-center justify-center text-center px-6 py-8 select-none relative z-10 gap-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
            <WifiSlash size={32} weight="bold" />
          </div>

          <div className="flex flex-col gap-2 max-w-[320px]">
            <h3
              className="text-lg font-bold text-white tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {isOffline ? "You're Currently Offline" : "Unable to Generate Study Wrap"}
            </h3>
            <p
              className="text-xs text-white/60 leading-relaxed font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {isOffline
                ? "Study Wrap compiles your latest reading analytics and AI achievements, which requires an active internet connection."
                : "We couldn't compile your Study Wrap analytics and AI achievements. Please check your connection and try again."}
            </p>
          </div>

          <div className="flex flex-col w-full max-w-[260px] gap-2.5 mt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setWrapError(false);
                setIsLoading(true);
                fetchWrapData(bookSpaceId);
              }}
              className="!py-2.5 !text-xs !font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <ArrowClockwise size={16} weight="bold" />
              <span>Try Again</span>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={handleFinalClose}
              className="!py-2.5 !text-xs !font-bold !text-white/80 hover:!text-white !border-white/20 hover:!bg-white/10"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Close
            </Button>
          </div>
        </div>
      );
    }

    const data = wrapData;

    switch (currentCard) {
      case 0:
        return (
          <StudyWrapOpener
            key={0}
            direction={direction.current}
            userName={data.userName}
            examName={data.examName}
            image={card1Img}
            triggerConfetti={!hasFiredConfetti.current}
            onConfettiFired={() => {
              hasFiredConfetti.current = true;
            }}
          />
        );
      case 1:
        return (
          <StudyWrapCard
            key={1}
            direction={direction.current}
            topicLabel="Course Coverage"
            image={card2Img}
            headline={data.courseCoverage.headline}
            achievementTitle={data.courseCoverage.achievement.title}
            achievementWhy={data.courseCoverage.achievement.why}
            stats={data.courseCoverage.stats}
          />
        );
      case 2:
        return (
          <StudyWrapCard
            key={2}
            direction={direction.current}
            topicLabel="Time Spent"
            image={card3Img}
            headline={data.timeSpent.headline}
            achievementTitle={data.timeSpent.achievement.title}
            achievementWhy={data.timeSpent.achievement.why}
            stats={data.timeSpent.stats}
          />
        );
      case 3:
        return (
          <StudyWrapCard
            key={3}
            direction={direction.current}
            topicLabel="Quiz Performance"
            image={card4Img}
            headline={data.quizPerformance.headline}
            achievementTitle={data.quizPerformance.achievement.title}
            achievementWhy={data.quizPerformance.achievement.why}
            stats={data.quizPerformance.stats}
            imageStyle={{ objectPosition: 'center 20%' }}
          />
        );
      case 4:
        return (
          <StudyWrapCard
            key={4}
            direction={direction.current}
            topicLabel="Study Consistency"
            image={card5Img}
            headline={data.studyConsistency.headline}
            achievementTitle={data.studyConsistency.achievement.title}
            achievementWhy={data.studyConsistency.achievement.why}
            stats={data.studyConsistency.stats}
          />
        );
      case 5:
        return (
          <StudyWrapClosing
            key={5}
            direction={direction.current}
            image={card6Img}
            wrapData={wrapData}
            onClose={handleFinalClose}
            onShareAll={handleFullWrapShare}
          />
        );
      default:
        return null;
    }
  };

  // Story-style top progress bar with Share button on the top-left and Close button on the top-right
  const renderStoryProgress = () => {
    return (
      <div
        className="study-wrap-nav-ignore flex items-center gap-2.5 px-4 pt-3.5 pb-1 z-30 flex-shrink-0 bg-transparent border-0 shadow-none"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        {/* Share Button on Top Left Corner */}
        <button
          type="button"
          className="study-wrap-nav-ignore p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 bg-transparent cursor-pointer flex items-center justify-center"
          onClick={handleIndividualShare}
          title="Share this card"
        >
          <ShareNetwork size={18} weight="bold" />
        </button>

        {/* Center Story Indicator Bars */}
        <div className="flex-1 flex items-center gap-1.5 mx-1">
          {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
              onClick={() => setCurrentCard(i)}
            >
              {i === currentCard ? (
                <motion.div
                  key={currentCard}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2.2, ease: 'linear' }}
                  className="h-full w-full bg-white origin-left"
                  style={{
                    opacity: 1,
                    transformOrigin: '0% 50%',
                    willChange: 'transform',
                  }}
                />
              ) : i < currentCard ? (
                <div className="h-full bg-white w-full" style={{ opacity: 0.7 }} />
              ) : (
                <div className="h-full bg-white w-0" style={{ opacity: 0.3 }} />
              )}
            </div>
          ))}
        </div>

        {/* Close Button on Top Right Corner */}
        <button
          type="button"
          className="study-wrap-nav-ignore p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 bg-transparent cursor-pointer flex items-center justify-center"
          onClick={handleRequestClose}
          title="Close"
        >
          <X size={18} weight="bold" />
        </button>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop overlay — non-interactive on desktop to prevent accidental dismiss */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md hidden md:block transition-opacity"
      />

      {/* Main Surface */}
      <div
        ref={modalCardRef}
        id="study-wrap-modal-card"
        className="
          relative z-10
          w-full h-full
          md:w-[420px] md:h-[680px] md:rounded-[24px]
          overflow-hidden flex flex-col
          shadow-2xl border border-white/10
          transition-colors duration-300
        "
        style={{
          background: `linear-gradient(to bottom, #000000 0%, #000000 50%, rgba(0, 0, 0, 0.95) 55%, rgba(0, 0, 0, 0.65) 75%, rgba(0, 0, 0, 0.65) 100%), url(${cardBgImg}) bottom center / 100% auto no-repeat, #000000`,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header: Story Progress Bar, Close Button & Centered Topic Pill (Absolute Overlay) */}
        {!isLoading && (
          <div className="absolute top-0 left-0 right-0 z-40 bg-transparent flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
              {renderStoryProgress()}
            </div>
            {currentCard > 0 && currentCard < TOTAL_CARDS - 1 && (
              <motion.div
                key={`topic-${currentCard}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                className="flex items-center justify-center w-full px-4 pb-1"
              >
                <div className="text-[10px] font-extrabold text-amber-200 uppercase tracking-[0.16em] text-center">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {CARD_TOPIC_LABELS[currentCard] || "STUDY WRAP"}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Content Container (Full-height scrollable area with padding top to make space for top overlay nav bar) */}
        {isLoading ? (
          <StudyWrapLoader
            onComplete={handleLoadComplete}
            isDataReady={Boolean(wrapData || wrapError)}
            studyDays={5}
          />
        ) : (
          <div
            id="study-wrap-card-container"
            className="flex-1 w-full h-full overflow-y-auto study-wrap-no-scrollbar pt-[60px] pb-14 relative z-10"
            style={{
              perspective: 1000,
              perspectiveOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
            }}
          >
            <AnimatePresence initial={false} custom={direction.current} mode="popLayout">
              <motion.div
                ref={cardSurfaceRef}
                id="study-wrap-active-card"
                key={currentCard}
                custom={direction.current}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full flex flex-col"
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  willChange: 'transform, opacity',
                }}
              >
                {renderCard()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Side Click Hotzones for Desktop Navigation */}
        {!isLoading && (
          <>
            {currentCard > 0 && (
              <div
                className="study-wrap-nav-ignore absolute left-0 top-16 bottom-0 w-16 z-20 cursor-pointer hidden md:flex items-center justify-start pl-2 group"
                onClick={goPrev}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                  <CaretLeft size={20} weight="bold" />
                </div>
              </div>
            )}
            {currentCard < TOTAL_CARDS - 1 && (
              <div
                className="study-wrap-nav-ignore absolute right-0 top-16 bottom-0 w-16 z-20 cursor-pointer hidden md:flex items-center justify-end pr-2 group"
                onClick={goNext}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                  <CaretRight size={20} weight="bold" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom branded footer watermark */}
        {!isLoading && (
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between pointer-events-none z-30">
            {/* Left side: Logo + Brand Name */}
            <div className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="Apex Logo"
                className="h-5 w-auto object-contain"
              />
              <span
                className="text-[12px] font-bold text-white uppercase tracking-wider"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Apex
              </span>
            </div>

            {/* Right side: Study Wrap */}
            <span
              className="text-[11px] font-bold text-white uppercase tracking-[0.2em]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Study Wrap
            </span>
          </div>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        title="Exit Study Wrap?"
        message="Are you sure you want to leave? You can revisit your full Study Wrap anytime from your home dashboard."
        onClose={() => setShowExitConfirm(false)}
        actions={[
          {
            label: 'Keep Watching',
            variant: 'ghost',
            onClick: () => setShowExitConfirm(false),
          },
          {
            label: 'Exit Wrap',
            variant: 'danger',
            onClick: handleFinalClose,
          },
        ]}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
