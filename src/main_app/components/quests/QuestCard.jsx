import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Book,
  Highlighter,
  MagnifyingGlass,
  Sparkle,
  Clock,
  Cards,
  Brain,
  Folders,
  MagicWand,
  ChartBar,
  CheckCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import ListItem from '../ui/ListItem';
import soundManager from '../../utils/soundManager';

// ─── Subcategory icon map ─────────────────────────────────────────────────────
const SUBCATEGORY_ICONS = {
  reading:      Book,
  annotation:   Highlighter,
  dictionary:   MagnifyingGlass,
  ai_engagement:Sparkle,
  consistency:  Clock,
  flashcard:    Cards,
  recall:       Brain,
  book_space:   Folders,
  simplify:     MagicWand,
  reflection:   ChartBar,
};

// ─── Shimmer CSS (injected once) ─────────────────────────────────────────────
const SHIMMER_STYLE_ID = 'quest-shimmer-style';
if (!document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SHIMMER_STYLE_ID;
  style.textContent = `
    @keyframes quest-shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    .quest-shimmer {
      background: linear-gradient(90deg, #7C3AED, #C084FC, #7C3AED);
      background-size: 200% 100%;
      animation: quest-shimmer 1.5s infinite linear;
    }
    .quest-strikethrough {
      position: relative;
      display: inline;
    }
    .quest-strikethrough::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      height: 1.5px;
      background: currentColor;
      width: var(--strike-width, 0%);
      transition: width 0.5s ease;
      transform: translateY(-50%);
    }
    .quest-strikethrough.striking::after {
      --strike-width: 100%;
    }
    @keyframes quest-bar-flash {
      0%   { opacity: 0; }
      20%  { opacity: 0.6; }
      100% { opacity: 0; }
    }
    .quest-bar-flash-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,255,255,0.8) 50%,
        transparent 100%
      );
      border-radius: 9999px;
      pointer-events: none;
      animation: quest-bar-flash 0.45s ease-out forwards;
    }
    @keyframes quest-complete-text-in {
      0%   { transform: scale(0.6); opacity: 0; }
      70%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1.0); opacity: 1; }
    }
    .quest-complete-text {
      animation: quest-complete-text-in 0.25s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

// ─── Chest SVGs ──────────────────────────────────────────────────────────────
const ChestClosed = ({ className, color }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    {/* Lid */}
    <path d="M2 11 Q2 5 12 5 Q22 5 22 11Z" fill={color} opacity="0.85" />
    {/* Latch */}
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.6" />
    {/* Hinge line */}
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const ChestOpen = ({ className, color }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    {/* Lid raised — rotated up */}
    <path d="M2 11 Q2 4 12 2 Q22 4 22 11Z" fill={color} opacity="0.6" />
    {/* Latch */}
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.4" />
    {/* Opening glow line */}
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.25" />
  </svg>
);


/**
 * QuestCard
 * Props:
 *   quest            — { id, copy, action, target, unit, type, progress, completed, subcategory }
 *   chestClaimed     — boolean
 *   onChestClick     — function
 *   onProgressUpdate — (questId, action, increment) => Promise<responseData>
 */
export default function QuestCard({ quest, chestClaimed, onChestClick, onProgressUpdate, onRefreshQuest, isRefreshing }) {
  const checkmarkRef = useRef(null);
  const particleContainerRef = useRef(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [localQuest, setLocalQuest] = useState(quest);
  const prevCompletedRef = useRef(false);
  const [showBarFlash, setShowBarFlash] = useState(false);

  // Sync external prop changes
  useEffect(() => {
    setLocalQuest(quest);
  }, [quest]);

  // Detect quest completion transition — fires animation + sound
  useEffect(() => {
    const isNowCompleted = quest?.completed ?? false;
    const wasCompleted = prevCompletedRef.current;

    if (!wasCompleted && isNowCompleted) {
      // Sound fires immediately — no delay
      soundManager.play('quest_complete');
      // Animation sequence
      runCompletionAnimation();
    }

    prevCompletedRef.current = isNowCompleted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest?.completed]);

  const { id, copy, action, target, unit, subcategory } = localQuest;
  const progress = localQuest.progress ?? 0;
  const completed = localQuest.completed ?? false;

  const Icon = SUBCATEGORY_ICONS[subcategory] || Book;
  const fillPercent = Math.min((progress / Math.max(target, 1)) * 100, 100);
  const inProgress = progress > 0 && !completed;

  // ─── Completion animation sequence ─────────────────────────────────────────
  const runCompletionAnimation = () => {
    if (import.meta.env.DEV) {
      console.log('[Quest Card] Completion animation started:', id);
    }

    // t=0ms — strikethrough + bar flash
    setJustCompleted(true);
    setShowBarFlash(true);

    // Clear bar flash after animation completes
    setTimeout(() => setShowBarFlash(false), 500);

    // t=350ms — particle burst (12 particles, 360°, purple + gold)
    setTimeout(() => {
      if (!particleContainerRef.current) return;
      const container = particleContainerRef.current;
      const rect = container.getBoundingClientRect();

      const COLORS = [
        '#A855F7', '#7C3AED', '#C084FC', '#DDD6FE',
        '#F59E0B', '#FCD34D', '#E9D5FF', '#8B5CF6',
        '#F59E0B', '#A855F7', '#7C3AED', '#FCD34D',
      ];
      const PARTICLE_COUNT = 12;
      const originX = rect.right - 20;
      const originY = rect.top + rect.height / 2;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const dot = document.createElement('div');
        const size = i % 3 === 0 ? 5 : 3;
        dot.style.cssText = `
          position: fixed;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${COLORS[i]};
          pointer-events: none;
          z-index: 9999;
          left: ${originX}px;
          top: ${originY}px;
        `;
        document.body.appendChild(dot);

        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        // Varied distances — inner and outer ring
        const distance = i % 2 === 0
          ? 28 + Math.random() * 20
          : 45 + Math.random() * 30;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        gsap.to(dot, {
          x: tx,
          y: ty,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          delay: Math.random() * 0.08,
          onComplete: () => dot.remove(),
        });
      }
    }, 350);
  };

  return (
    <div ref={particleContainerRef} className="w-full">
      <ListItem
        icon={Icon}
        label={
          <span className={`quest-strikethrough ${completed && justCompleted ? 'striking' : completed ? 'striking' : ''} ${completed ? 'text-text-secondary' : 'text-text-primary'}`}>
            {copy}
          </span>
        }
        subComponent={
          <div className="flex flex-row items-center gap-2 w-full mt-1.5">
            {/* Refresh button — left end of progress row, only shown when incomplete */}
            {!completed && onRefreshQuest && (
              <button
                onClick={onRefreshQuest}
                disabled={isRefreshing}
                title="Refresh Quest (1 Token)"
                className={`p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-tertiary hover:text-accent-primary transition-all flex items-center justify-center shrink-0 ${isRefreshing ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              >
                <ArrowsClockwise size={14} weight="bold" className={isRefreshing ? 'animate-spin text-purple-600 dark:text-purple-400' : ''} />
              </button>
            )}

            {/* Progress bar */}
            <div className="flex-1 h-4 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden shadow-inner">
              {/* Base grey text — hidden when completed */}
              {!completed && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                  {progress} / {target}{unit ? ` ${unit}` : ''}
                </div>
              )}

              {/* Clipped fill layer */}
              <div
                className="absolute inset-0 transition-all [transition-duration:400ms] ease-out"
                style={{
                  clipPath: `inset(0 ${100 - fillPercent}% 0 0 round 9999px)`,
                }}
              >
                {/* Gradient fill */}
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] ${inProgress && !completed ? 'quest-shimmer' : ''}`} />

                {/* Completion flash overlay */}
                {showBarFlash && (
                  <div className="quest-bar-flash-overlay" />
                )}

                {/* Progress text — or completion label */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                  {completed ? (
                    <span className="quest-complete-text flex items-center gap-0.5">
                      Complete ✓
                    </span>
                  ) : (
                    `${progress} / ${target}${unit ? ` ${unit}` : ''}`
                  )}
                </div>
              </div>
            </div>
            
            {/* Chest — right end */}
            <div className="shrink-0 flex items-center justify-center">
              {completed && !chestClaimed && (
                <motion.div
                  className="cursor-pointer"
                  onClick={onChestClick}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.25, 0.9, 1.05, 1],
                    opacity: 1,
                    rotate: justCompleted
                      ? [0, 0, 0, 0, 0]
                      : [0, -8, 8, -8, 8, -4, 4, 0],
                  }}
                  transition={justCompleted ? {
                    scale: {
                      duration: 0.5,
                      ease: 'easeOut',
                      times: [0, 0.4, 0.6, 0.8, 1],
                    },
                    opacity: { duration: 0.15 },
                    rotate: { duration: 0 },
                  } : {
                    scale: { duration: 0 },
                    opacity: { duration: 0 },
                    rotate: {
                      duration: 0.6,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                    },
                  }}
                >
                  <ChestClosed
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                    color="#7C3AED"
                  />
                </motion.div>
              )}
              {completed && chestClaimed && (
                <div className="opacity-50 pointer-events-none">
                  <ChestOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" color="rgb(var(--text-placeholder))" />
                </div>
              )}
              {!completed && (
                <div className="opacity-40 pointer-events-none shrink-0">
                  <ChestClosed className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" color="rgb(var(--text-placeholder))" />
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
