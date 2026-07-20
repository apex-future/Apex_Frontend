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
import QuestCompleteModal from './QuestCompleteModal';

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

// ─── Chest SVGs ──────────────────────────────────────────────────────────────
const ChestClosed = ({ size = 20, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    <path d="M2 11 Q2 5 12 5 Q22 5 22 11Z" fill={color} opacity="0.85" />
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.6" />
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const ChestOpen = ({ size = 20, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    <path d="M2 11 Q2 4 12 2 Q22 4 22 11Z" fill={color} opacity="0.6" />
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.4" />
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.25" />
  </svg>
);

import ListItem from '../ui/ListItem';

// ─── Single quest row ─────────────────────────────────────────────────────────
function QuestRow({ quest, index, questKey, chestClaimed, onChestClick }) {
  if (!quest) return null;

  const { copy, progress = 0, target = 1, completed = false, subcategory, unit } = quest;
  const Icon = SUBCATEGORY_ICONS[subcategory] || Book;
  const delay = 0.3 + index * 0.15;
  const fillPercent = Math.min((progress / Math.max(target, 1)) * 100, 100);
  const inProgress = progress > 0 && !completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <ListItem
        icon={Icon}
        label={
          <span className={`quest-strikethrough ${completed ? 'striking text-text-secondary' : 'text-text-primary'}`}>
            {copy}
          </span>
        }
        className="text-left bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5"
        subComponent={
          <div className="flex flex-row items-center gap-3 w-full mt-1.5">
            <div className="flex-1 h-4 rounded-full bg-black/5 dark:bg-white/10 relative overflow-hidden shadow-inner">
              {/* Base grey text */}
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                {progress} / {target}{unit ? ` ${unit}` : ''}
              </div>

              {/* Clipped Fill Layer */}
              <motion.div 
                className="absolute inset-0 overflow-hidden"
                initial={{ clipPath: `inset(0 100% 0 0 round 9999px)` }}
                animate={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0 round 9999px)` }}
                transition={{ duration: 0.8, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-900 via-purple-600 to-[#c084fc] ${inProgress ? 'quest-shimmer' : ''}`} />
                
                {/* White text */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm">
                  {progress} / {target}{unit ? ` ${unit}` : ''}
                </div>
              </motion.div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center">
              {completed && !chestClaimed && (
                <motion.div
                  className="cursor-pointer"
                  onClick={() => onChestClick(questKey)}
                  animate={{ rotate: [0, -8, 8, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
                >
                  <ChestClosed className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" color="#7C3AED" />
                </motion.div>
              )}
              {completed && chestClaimed && (
                <div className="opacity-50 pointer-events-none">
                  <ChestOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" color="rgb(var(--text-placeholder))" />
                </div>
              )}
              {!completed && (
                <div className="opacity-40 pointer-events-none">
                  <ChestClosed className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" color="rgb(var(--text-placeholder))" />
                </div>
              )}
            </div>
          </div>
        }
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

  const [showRewardModal, setShowRewardModal] = React.useState(false);
  const [modalData, setModalData] = React.useState(null);
  const activeChestQuestKey = React.useRef(null);

  const quest_1 = useQuestStore(s => s.quest_1);
  const quest_2 = useQuestStore(s => s.quest_2);
  const quest_3 = useQuestStore(s => s.quest_3);

  const chest_1_claimed = useQuestStore(s => s.chest_1_claimed);
  const chest_2_claimed = useQuestStore(s => s.chest_2_claimed);
  const chest_3_claimed = useQuestStore(s => s.chest_3_claimed);

  const quests = [quest_1, quest_2, quest_3].filter(Boolean);
  const completedCount = quests.filter(q => q.completed).length;
  const allDone = completedCount === quests.length && quests.length > 0;

  const handleChestClick = (questKey, quest) => {
    setModalData({
      questCopy: quest.copy,
      xpAwarded: 20, // Default UI fallback since we don't fetch xp_awarded in this modal yet
      reward: null,
      allCompleted: allDone
    });
    activeChestQuestKey.current = questKey;
    setShowRewardModal(true);
  };

  const handleRewardModalClose = () => {
    setShowRewardModal(false);
    if (activeChestQuestKey.current) {
      useQuestStore.getState().claimChest(activeChestQuestKey.current);
      activeChestQuestKey.current = null;
    }
  };

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
                <QuestRow
                  key={quest.id || i}
                  questKey={quest === quest_1 ? 'quest_1' : quest === quest_2 ? 'quest_2' : 'quest_3'}
                  quest={quest}
                  index={i}
                  chestClaimed={quest === quest_1 ? chest_1_claimed : quest === quest_2 ? chest_2_claimed : chest_3_claimed}
                  onChestClick={(questKey) => handleChestClick(questKey, quest)}
                />
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

      {/* The Reward Modal, mounted conditionally above this modal */}
      <QuestCompleteModal
        isOpen={showRewardModal}
        onClose={handleRewardModalClose}
        questCopy={modalData?.questCopy}
        xpAwarded={modalData?.xpAwarded}
        reward={modalData?.reward}
        allCompleted={modalData?.allCompleted}
      />
    </div>
  );

  return createPortal(content, document.body);
}
