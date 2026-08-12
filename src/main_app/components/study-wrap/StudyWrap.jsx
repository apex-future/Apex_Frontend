import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CaretLeft, CaretRight, Sparkle, ShareNetwork } from '@phosphor-icons/react';
import StudyWrapLoader from './StudyWrapLoader';

import StudyWrapOpener from './StudyWrapOpener';
import StudyWrapCard from './StudyWrapCard';
import StudyWrapClosing from './StudyWrapClosing';
import studyWrapDummy from '../../data/studyWrapDummy';
import LightRays from '../ui/LightRays';
import './studyWrap.css';

// Image imports from src/assets/Exam_Day_Asset/
import card1Img from '../../../assets/Exam_Day_Asset/card1.png';
import card2Img from '../../../assets/Exam_Day_Asset/card2.png';
import card3Img from '../../../assets/Exam_Day_Asset/card3.png';
import card4Img from '../../../assets/Exam_Day_Asset/card4.png';
import card5Img from '../../../assets/Exam_Day_Asset/card5.png';
import card6Img from '../../../assets/Exam_Day_Asset/card6.png';

const TOTAL_CARDS = 6;
const SWIPE_THRESHOLD = 50;

// Curated vibrant dark gradients tailored for each card step (No white bottom fade)
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1E1B4B 0%, #311042 50%, #0F0C20 100%)', // Card 0: Opener (Deep Cosmic Indigo)
  'linear-gradient(135deg, #064E3B 0%, #022C22 50%, #0F172A 100%)', // Card 1: Coverage (Neon Emerald)
  'linear-gradient(135deg, #4C1D95 0%, #3B0764 50%, #0F0C20 100%)', // Card 2: Time Spent (Sunset Violet)
  'linear-gradient(135deg, #1E3A8A 0%, #172554 50%, #0B132B 100%)', // Card 3: Quiz Performance (Sapphire Blue)
  'linear-gradient(135deg, #581C87 0%, #3B0764 50%, #111827 100%)', // Card 4: Study Consistency (Cyber Purple)
  'linear-gradient(135deg, #451A03 0%, #2A0800 50%, #0A0A0A 100%)', // Card 5: Closing (Obsidian Gold)
];

const CARD_RAY_COLORS = [
  '#A78BFA', // Card 0 / Loader: Cosmic Violet
  '#34D399', // Card 1: Emerald Green
  '#C084FC', // Card 2: Sunset Purple
  '#60A5FA', // Card 3: Sapphire Blue
  '#F0ABFC', // Card 4: Cyber Magenta
  '#FBBF24', // Card 5: Obsidian Gold
];

const CARD_TOPIC_LABELS = [
  "OVERVIEW",
  "COURSE COVERAGE",
  "TIME SPENT",
  "QUIZ PERFORMANCE",
  "STUDY CONSISTENCY",
  "WRAP SUMMARY"
];



export default function StudyWrap({ isOpen, onClose, daysLeft }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Swipe tracking
  const touchStartX = useRef(0);

  // Simulate data load when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCurrentCard(0);
      console.log('[StudyWrap] Opened — starting data load simulation');

      const timer = setTimeout(() => {
        setIsLoading(false);
        setCurrentCard(0);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentCard < TOTAL_CARDS - 1) {
      console.log(`[StudyWrap] Card ${currentCard} → ${currentCard + 1}`);
      setCurrentCard((prev) => prev + 1);
    }
  }, [currentCard]);

  const goPrev = useCallback(() => {
    if (currentCard > 0) {
      setCurrentCard((prev) => prev - 1);
    }
  }, [currentCard]);

  // Close handler
  const handleClose = useCallback(() => {
    setCurrentCard(0);
    setIsLoading(true);
    onClose?.();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || isLoading) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, goNext, goPrev, handleClose]);

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
            userName={data.userName}
            examName={data.examName}
            image={card1Img}
          />
        );
      case 1:
        return (
          <StudyWrapCard
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
            topicLabel="Quiz Performance"
            image={card4Img}
            headline={data.quizPerformance.headline}
            achievementTitle={data.quizPerformance.achievement.title}
            achievementWhy={data.quizPerformance.achievement.why}
            supporting={data.quizPerformance.supporting}
          />
        );
      case 4:
        return (
          <StudyWrapCard
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
            image={card6Img}
            wrapData={data}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  // Story-style top progress bar with Share button on left and Close button on right
  const renderStoryProgress = () => {
    return (
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-1 z-30 flex-shrink-0">
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
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: i < currentCard ? '100%' : i === currentCard ? '100%' : '0%',
                  opacity: i === currentCard ? 1 : i < currentCard ? 0.7 : 0.3,
                }}
              />
            </div>
          ))}
        </div>

        {/* Close Button on Top Right — transparent, no background */}
        <button
          className="p-1 text-white/70 hover:text-white transition-colors flex-shrink-0 bg-transparent"
          onClick={handleClose}
          title="Close"
        >
          <X size={18} weight="bold" />
        </button>
      </div>
    );
  };


  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md hidden md:block transition-opacity"
        onClick={handleClose}
      />

      {/* Main Surface */}
      <div
        className="
          relative z-10
          w-full h-full
          md:w-[420px] md:h-[680px] md:rounded-[24px]
          overflow-hidden flex flex-col
          shadow-2xl border border-white/10
          transition-all duration-700 ease-in-out
        "
        style={{
          background: CARD_GRADIENTS[currentCard] || CARD_GRADIENTS[0],
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Light Rays WebGL Background — Bright, Crisp & Clear */}
        <LightRays
          raysOrigin="top-center"
          raysColor={CARD_RAY_COLORS[currentCard] || '#A78BFA'}
          raysSpeed={1.8}
          lightSpread={1.2}
          rayLength={2.2}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.04}
          distortion={0.05}
          saturation={1.3}
        />

        {/* Top Header: Story Progress Bar & Close Button */}
        {!isLoading && renderStoryProgress()}

        {/* Centered Topic Pill (No Sparkle, Reduced Size) */}
        {!isLoading && (
          <div className="flex items-center justify-center w-full px-4 pt-1 pb-1 z-30">
            <div className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-extrabold text-amber-200 uppercase tracking-[0.16em] shadow-sm text-center">
              <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {CARD_TOPIC_LABELS[currentCard] || "STUDY WRAP"}
              </span>
            </div>
          </div>
        )}

        {/* Content Container (Lifted upwards, not touching bottom) */}
        {isLoading ? (
          <StudyWrapLoader />
        ) : (
          <div className="flex-1 flex flex-col justify-center overflow-hidden relative z-10 pb-6">
            {/* Card Content */}
            <div className="flex-1 flex flex-col justify-center overflow-y-auto">{renderCard()}</div>
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
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

