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

/**
 * QuestCard
 * Props:
 *   quest            — { id, copy, action, target, unit, type, progress, completed, subcategory }
 *   onProgressUpdate — (questId, action, increment) => Promise<responseData>
 */
export default function QuestCard({ quest, onProgressUpdate }) {
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
    <div ref={particleContainerRef} className="w-full flex flex-col gap-0.5">
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
      />
      
      {/* Progress bar underneath with counter inside */}
      {!completed && (
        <div className="w-full h-3.5 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden shadow-inner">
          <div
            className={`h-full bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] transition-all duration-[400ms] ease-out ${
              inProgress ? 'quest-shimmer' : ''
            }`}
            style={{ width: `${fillPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary mix-blend-overlay dark:text-white dark:mix-blend-normal">
            {progress} / {target}{unit ? ` ${unit}` : ''}
          </span>
        </div>
      )}
      {completed && (
        <div className="w-full h-3.5 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] w-full" />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
            Complete
          </span>
        </div>
      )}
    </div>
  );
}
