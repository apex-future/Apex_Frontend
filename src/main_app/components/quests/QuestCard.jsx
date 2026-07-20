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
} from '@phosphor-icons/react';
import ListItem from '../ui/ListItem';

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
  `;
  document.head.appendChild(style);
}

// ─── Chest SVGs ──────────────────────────────────────────────────────────────
const ChestClosed = ({ size = 20, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
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

const ChestOpen = ({ size = 20, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
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
export default function QuestCard({ quest, chestClaimed, onChestClick, onProgressUpdate }) {
  const checkmarkRef = useRef(null);
  const particleContainerRef = useRef(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [localQuest, setLocalQuest] = useState(quest);

  // Sync external prop changes
  useEffect(() => {
    setLocalQuest(quest);
  }, [quest]);

  const { id, copy, action, target, unit, subcategory } = localQuest;
  const progress = localQuest.progress ?? 0;
  const completed = localQuest.completed ?? false;

  const Icon = SUBCATEGORY_ICONS[subcategory] || Book;
  const fillPercent = Math.min((progress / Math.max(target, 1)) * 100, 100);
  const inProgress = progress > 0 && !completed;

  // ─── Completion animation sequence ─────────────────────────────────────────
  const runCompletionAnimation = () => {
    console.log('[Quest Card] Completion animation started:', id);

    setTimeout(() => {
      setJustCompleted(true);
    }, 10);

    setTimeout(() => {
      if (!particleContainerRef.current) return;
      const container = particleContainerRef.current;
      const rect = container.getBoundingClientRect();

      const COLORS = ['#A855F7', '#7C3AED', '#C084FC', '#DDD6FE'];
      const PARTICLE_COUNT = 8;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${COLORS[i % COLORS.length]};
          pointer-events: none;
          z-index: 9999;
          left: ${rect.right - 16}px;
          top: ${rect.top + rect.height / 2}px;
        `;
        document.body.appendChild(dot);

        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        const distance = 30 + Math.random() * 25;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        gsap.to(dot, {
          x: tx,
          y: ty,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => dot.remove(),
        });
      }
    }, 650);
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
        right={
          <div className="flex items-center" ref={checkmarkRef}>
            {completed && (
              <AnimatePresence>
                <motion.div
                  key="checkmark"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                >
                  <CheckCircle size={20} weight="fill" className="text-[#c084fc]" />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        }
        subComponent={
          <div className="flex flex-row items-center gap-2 w-full">
            <div className="flex-1 h-3.5 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden shadow-inner">
              {!completed ? (
                <>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] transition-all duration-[400ms] ease-out ${
                      inProgress ? 'quest-shimmer' : ''
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary mix-blend-overlay dark:text-white dark:mix-blend-normal">
                    {progress} / {target}{unit ? ` ${unit}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] w-full" />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                    Complete
                  </span>
                </>
              )}
            </div>
            
            <div className="shrink-0 flex items-center justify-center">
              {completed && !chestClaimed && (
                <motion.div
                  className="cursor-pointer"
                  onClick={onChestClick}
                  animate={{ rotate: [0, -8, 8, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  <ChestClosed size={20} color="#7C3AED" />
                </motion.div>
              )}
              {completed && chestClaimed && (
                <div className="opacity-50 pointer-events-none">
                  <ChestOpen size={20} color="rgb(var(--text-placeholder))" />
                </div>
              )}
              {!completed && (
                <div className="opacity-40 pointer-events-none">
                  <ChestClosed size={20} color="rgb(var(--text-placeholder))" />
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
