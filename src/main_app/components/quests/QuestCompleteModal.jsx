import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Trophy, CheckCircle, X, Snowflake, ArrowCounterClockwise } from '@phosphor-icons/react';
import Button from '../ui/Button';

/**
 * QuestCompleteModal
 * Props:
 *   isOpen      — bool
 *   onClose     — fn
 *   questCopy   — string
 *   xpAwarded   — number
 *   reward      — object | null
 *   allCompleted — bool
 */
export default function QuestCompleteModal({
  isOpen,
  onClose,
  questCopy = '',
  xpAwarded = 20,
  reward = null,
  allCompleted = false,
}) {
  const confettiRef = useRef(null);
  const hasRunConfetti = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasRunConfetti.current = false;
    }
  }, [isOpen]);

  // GSAP confetti scatter on allCompleted
  useEffect(() => {
    if (!isOpen || !allCompleted || hasRunConfetti.current) return;
    if (!confettiRef.current) return;

    hasRunConfetti.current = true;
    const container = confettiRef.current;
    const COLORS = ['#F59E0B', '#A855F7', '#7C3AED', '#FCD34D', '#C084FC'];
    const COUNT = 20;

    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: ${COLORS[i % COLORS.length]};
        left: 50%;
        top: 50%;
        opacity: 1;
        pointer-events: none;
      `;
      container.appendChild(dot);

      const angle = (Math.PI * 2 * i) / COUNT;
      const distance = 60 + Math.random() * 60;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      gsap.to(dot, {
        x: tx,
        y: ty,
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        delay: Math.random() * 0.2,
        onComplete: () => dot.remove(),
      });
    }
  }, [isOpen, allCompleted]);

  console.log('[Quest Modal] Opened for quest:', questCopy, 'reward:', reward);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <AnimatePresence>
        <motion.div
          key="quest-complete-modal"
          className="relative z-10 bg-bg-subtle dark:bg-bg-elevated border-t border-white/10 rounded-[20px] p-6 w-full max-w-sm mx-4 flex flex-col items-center text-center max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti container (absolute, pointer-events none) */}
          {allCompleted && (
            <div
              ref={confettiRef}
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]"
            />
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={16} weight="bold" />
          </button>

          {/* 1. Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="mb-4"
          >
            {allCompleted ? (
              <Trophy size={40} weight="fill" className="text-amber-500" />
            ) : (
              <CheckCircle size={40} weight="fill" className="text-purple-400" />
            )}
          </motion.div>

          {/* 2. Headline */}
          <h2
            className="text-text-primary font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22 }}
          >
            {allCompleted ? 'All Quests Done!' : 'Quest Complete'}
          </h2>

          {/* 3. Quest copy */}
          <p
            className="text-text-secondary italic mb-4 line-clamp-2"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}
          >
            "{questCopy}"
          </p>

          {/* 4. Badges / Reward display */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {/* Streak Freeze item badge */}
            {reward?.item === 'streak_freeze' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-bold shadow-md shadow-sky-500/20"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                }}
              >
                <Snowflake size={17} weight="bold" />
                <span>+1 Streak Freeze</span>
              </motion.div>
            )}

            {/* Refresh Token item badge */}
            {reward?.item === 'refresh_token' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-bold shadow-md shadow-amber-500/20"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  background: 'linear-gradient(135deg, #D97706, #B45309)',
                }}
              >
                <ArrowCounterClockwise size={17} weight="bold" />
                <span>+1 Refresh Token</span>
              </motion.div>
            )}

            {/* XP badge: show if xpAwarded > 0 or if no item reward exists */}
            {(xpAwarded > 0 || !reward?.item) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-white font-bold shadow-md shadow-purple-500/20"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  background: 'linear-gradient(135deg, #7C3AED, #3B0764)',
                }}
              >
                +{xpAwarded} XP
              </motion.div>
            )}
          </div>

          {/* 5. Reward section */}
          {reward && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-full mb-4"
            >
              <div className="border-t border-black/10 dark:border-white/10 pt-3 mt-1 flex flex-col items-center">
                {reward.alreadyClaimed ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold font-sans">
                      <CheckCircle size={14} weight="bold" />
                      {reward.tag || 'Tour Reward Already Claimed'}
                    </span>
                    <p
                      className="text-text-tertiary text-xs text-center max-w-[280px] font-sans mt-0.5"
                    >
                      You've already received your onboarding {reward.label || 'reward'}. Replaying the tour gives a preview without duplicate items.
                    </p>
                  </div>
                ) : (
                  <>
                    <p
                      className="text-text-tertiary uppercase tracking-widest mb-1"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: 10 }}
                    >
                      You earned
                    </p>
                    <p
                      className="text-text-primary font-bold"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}
                    >
                      {reward.label}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}



          {/* 7. Dismiss button */}
          <Button
            variant="primary"
            onClick={onClose}
            className="!max-w-none w-full mt-2 py-3.5 text-sm font-semibold"
          >
            Keep Going
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return createPortal(content, document.body);
}
