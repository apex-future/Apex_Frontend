import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CaretLeft, CaretRight, Sparkle, ShareNetwork } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import StudyWrapLoader from './StudyWrapLoader';

import StudyWrapOpener from './StudyWrapOpener';
import StudyWrapCard from './StudyWrapCard';
import StudyWrapClosing from './StudyWrapClosing';
import studyWrapDummy from '../../data/studyWrapDummy';
import Modal from '../ui/Modal';
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

export default function StudyWrap({ isOpen, onClose, daysLeft }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const direction = useRef(1);
  const lastTransitionTime = useRef(0);
  const hasFiredConfetti = useRef(false);

  // Swipe tracking
  const touchStartX = useRef(0);

  // Simulate data load when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCurrentCard(0);
      setShowExitConfirm(false);
      hasFiredConfetti.current = false;
      console.log('[StudyWrap] Opened — starting data load simulation');

      // Preload all card images to ensure they show instantly
      const imagesToPreload = [card1Img, card2Img, card3Img, card4Img, card5Img, card6Img];
      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [isOpen]);

  const handleLoadComplete = () => {
    setIsLoading(false);
    setCurrentCard(0);
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

  const data = studyWrapDummy;

  // Render the correct card by index
  const renderCard = () => {
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
            supporting={data.courseCoverage.supporting}
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
            supporting={data.timeSpent.supporting}
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
            supporting={data.quizPerformance.supporting}
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
            supporting={data.studyConsistency.supporting}
          />
        );
      case 5:
        return (
          <StudyWrapClosing
            key={5}
            direction={direction.current}
            image={card6Img}
            wrapData={data}
            onClose={handleFinalClose}
          />
        );
      default:
        return null;
    }
  };

  // Story-style top progress bar with Share button on left and Close button on right
  const renderStoryProgress = () => {
    return (
      <div
        className="flex items-center gap-2.5 px-4 pt-3.5 pb-1 z-30 flex-shrink-0 bg-transparent border-0 shadow-none"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        {/* Share Button on Top Left — transparent, no background */}
        <button
          className="p-1 text-white/70 hover:text-white transition-colors flex-shrink-0 bg-transparent"
          onClick={() =>
            console.log(
              `[StudyWrap] Share tapped — card step: ${currentCard}`
            )
          }
          title="Share"
        >
          <ShareNetwork size={18} weight="bold" />
        </button>

        {/* Center Story Indicator Bars */}
        <div className="flex-1 flex items-center gap-1.5">
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

        {/* Close Button on Top Right — transparent, no background */}
        <button
          className="p-1 text-white/70 hover:text-white transition-colors flex-shrink-0 bg-transparent cursor-pointer"
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
          <StudyWrapLoader onComplete={handleLoadComplete} studyDays={data.studyDays} />
        ) : (
          <div
            className="flex-1 w-full h-full overflow-y-auto study-wrap-no-scrollbar pt-[60px] pb-14 relative z-10"
            style={{
              perspective: 1000,
              perspectiveOrigin: '50% 50%',
              transformStyle: 'preserve-3d',
            }}
          >
            <AnimatePresence initial={false} custom={direction.current} mode="popLayout">
              <motion.div
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
                className="absolute left-0 top-16 bottom-0 w-16 z-20 cursor-pointer hidden md:flex items-center justify-start pl-2 group"
                onClick={goPrev}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                  <CaretLeft size={20} weight="bold" />
                </div>
              </div>
            )}
            {currentCard < TOTAL_CARDS - 1 && (
              <div
                className="absolute right-0 top-16 bottom-0 w-16 z-20 cursor-pointer hidden md:flex items-center justify-end pr-2 group"
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

