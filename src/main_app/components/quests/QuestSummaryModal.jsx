import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
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
  Scroll,
} from '@phosphor-icons/react';
import useQuestStore from '../../store/useQuestStore';
import useThemeStore from '../../store/themeStore';

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
  `;
  document.head.appendChild(style);
}

// ─── Subcategory icon map (mirrors QuestCard) ─────────────────────────────────
const SUBCATEGORY_ICONS = {
  reading:       Book,
  annotation:    Highlighter,
  dictionary:    MagnifyingGlass,
  ai_engagement: Sparkle,
  consistency:   Clock,
  flashcard:     Cards,
  recall:        Brain,
  book_space:    Folders,
  simplify:      MagicWand,
  reflection:    ChartBar,
};

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ from, to }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, to, { duration: 1.2, ease: 'easeOut' });
    return animation.stop;
  }, [to, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ─── Progress bar with entrance animation ─────────────────────────────────────
function QuestProgressBar({ progress, target, completed, delay = 0 }) {
  const fillPercent = Math.min((progress / Math.max(target, 1)) * 100, 100);

  return (
    <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden shadow-inner">
      <motion.div
        className={`h-full rounded-full ${
          completed
            ? 'bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc]'
            : 'bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] quest-shimmer'
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${fillPercent}%` }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary mix-blend-overlay dark:text-white dark:mix-blend-normal">
        {completed ? 'Complete' : `${progress} / ${target}`}
      </span>
    </div>
  );
}

// ─── Single quest row ─────────────────────────────────────────────────────────
function QuestRow({ quest, index }) {
  if (!quest) return null;

  const { copy, progress = 0, target = 1, completed = false, subcategory } = quest;
  const Icon = SUBCATEGORY_ICONS[subcategory] || Book;
  const delay = 0.3 + index * 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col gap-2"
    >
      {/* Icon + copy */}
      <div className="flex items-center gap-2.5">
        <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
          completed
            ? 'bg-purple-500/15 dark:bg-purple-400/20'
            : 'bg-black/5 dark:bg-white/10'
        }`}>
          <Icon
            size={14}
            weight={completed ? 'fill' : 'regular'}
            className={completed ? 'text-purple-500 dark:text-purple-400' : 'text-text-tertiary'}
          />
        </div>
        <span className={`text-[13px] font-semibold leading-tight ${
          completed ? 'text-text-secondary line-through' : 'text-text-primary'
        }`}>
          {copy}
        </span>
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: delay + 0.4 }}
            className="ml-auto shrink-0"
          >
            <CheckCircle size={18} weight="fill" className="text-purple-400" />
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <QuestProgressBar
        progress={progress}
        target={target}
        completed={completed}
        delay={delay + 0.15}
      />
    </motion.div>
  );
}

/**
 * QuestSummaryModal
 * 
 * Display-only modal that shows current quest progress after a reading session.
 * Does NOT call reportAction — reads state from useQuestStore, which was already
 * updated by real-time wiring during the session.
 * 
 * Props:
 *   onDone — fn to close modal and navigate to dashboard
 */
export default function QuestSummaryModal({ onDone }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const quest_1 = useQuestStore(s => s.quest_1);
  const quest_2 = useQuestStore(s => s.quest_2);
  const quest_3 = useQuestStore(s => s.quest_3);

  const quests = [quest_1, quest_2, quest_3].filter(Boolean);
  const completedCount = quests.filter(q => q.completed).length;
  const allDone = completedCount === quests.length && quests.length > 0;

  // Heading text based on progress
  const heading = allDone
    ? 'All Quests Complete! 🏆'
    : completedCount > 0
      ? 'Quest Progress'
      : 'Quest Progress';

  const subtext = allDone
    ? 'You crushed it today.'
    : completedCount > 0
      ? `${completedCount} of ${quests.length} completed`
      : 'Keep going — you\'re making progress.';

  // Radial gradient backgrounds (consistent with SessionSummaryModal)
  const lightGradient = 'bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]';
  const darkGradient = 'bg-[#0D0D0F] [background:radial-gradient(125%_125%_at_50%_10%,#141416_40%,#3b0764_100%)]';
  const bgGradient = isDark ? darkGradient : lightGradient;

  const content = (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center font-sans ${bgGradient} sm:bg-transparent sm:backdrop-blur-sm`}>
      {/* Desktop backdrop */}
      <div className="hidden sm:block fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 w-full h-full ${bgGradient} sm:h-auto sm:max-w-md sm:rounded-2xl sm:shadow-aura-lg flex flex-col items-center justify-center p-8 sm:p-10 text-center`}
      >
        <div className="w-full flex flex-col items-center max-w-sm mx-auto">

          {/* Quest scroll icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
            className="mb-4"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              allDone
                ? 'bg-amber-500/15 dark:bg-amber-400/20'
                : 'bg-purple-500/15 dark:bg-purple-400/20'
            }`}>
              <Scroll
                size={28}
                weight="fill"
                className={allDone ? 'text-amber-500' : 'text-purple-400'}
              />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1 font-sans"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="text-text-tertiary font-semibold mb-8 text-sm font-sans"
          >
            {subtext}
          </motion.p>

          {/* Quest rows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`w-full rounded-xl p-5 space-y-5 mb-8 ${
              isDark
                ? 'bg-white/5 border border-white/10'
                : 'bg-black/5 border border-black/5'
            }`}
          >
            {quests.length > 0 ? (
              quests.map((quest, i) => (
                <QuestRow key={quest.id || i} quest={quest} index={i} />
              ))
            ) : (
              <p className="text-text-tertiary text-sm py-4">No quests loaded for today.</p>
            )}
          </motion.div>

          {/* All complete bonus message */}
          {allDone && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, 1, 0.85, 1], scale: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="text-amber-500 font-semibold mb-4 text-xs"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Today is a golden day 🔥
            </motion.p>
          )}

          {/* Done button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand hover:bg-brand-light active:bg-brand-mid text-white font-bold text-base font-sans transition-colors duration-200 shadow-sm"
            >
              Done
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
}
