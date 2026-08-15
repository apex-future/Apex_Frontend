import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { ShareNetwork, BookOpen, Clock, Trophy, Fire } from '@phosphor-icons/react';
import DepthText from '../ui/DepthText';

const imageVariants = {
  hidden: {
    y: 30,
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      mass: 0.8,
      delay: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

const ICON_MAP = {
  BookOpen,
  Clock,
  Trophy,
  Fire,
};

const CLOSING_GRID_STATS = [
  {
    key: 'courseCoverage',
    icon: 'BookOpen',
    title: 'Books Covered',
    number: '5',
    measurement: 'out of 6 books',
  },
  {
    key: 'timeSpent',
    icon: 'Clock',
    title: 'Time Spent',
    number: '47',
    measurement: 'hours studied',
  },
  {
    key: 'quizPerformance',
    icon: 'Trophy',
    title: 'Best Score',
    number: '88%',
    measurement: 'correct answers',
  },
  {
    key: 'studyConsistency',
    icon: 'Fire',
    title: 'Days Studied',
    number: '38',
    measurement: 'out of 60 days',
  },
];

export default function StudyWrapClosing({ direction = 1, image, wrapData, onClose }) {
  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-3 study-wrap-card-enter relative z-10 select-none">
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-purple-500/35" />

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-1.5">
        {/* Large Hero Image */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <motion.img
            key={image}
            src={image}
            alt="Study Wrap Closing"
            initial="hidden"
            animate="visible"
            variants={imageVariants}
            className="w-[98%] mx-auto max-h-[165px] md:max-h-[190px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>

        {/* Non-Image Content Wrapper */}
        <div className="w-full px-3.5 pb-1 md:px-4 flex flex-col items-center text-center gap-1.5">
          {/* Header with vertical breathing room */}
          <motion.div
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full py-1.5 md:py-2"
          >
            <DepthText
              text="That's not luck. That's work."
              layers={18}
              depth={2}
              faceColor="#FFFFFF"
              depthColor="#7C3AED"
              fontSize="clamp(1.4rem, 5vw, 2.1rem)"
              fontWeight={900}
              shadow
            />
          </motion.div>

          {/* 2×2 Frosted Glass Summary Grid */}
          <motion.div
            custom={0.7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full grid grid-cols-2 gap-2 my-0.5"
          >
            {CLOSING_GRID_STATS.map(({ key, icon, title, number, measurement }, index) => {
              const Icon = ICON_MAP[icon];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.7 + index * 0.1,
                    duration: 0.35,
                    ease: 'easeOut',
                  }}
                  className="flex flex-col items-start rounded-[14px] p-[8px_12px] md:p-[10px_12px] text-left overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: 'none',
                    borderTop: '1px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Icon + Title row */}
                  <div
                    className="flex items-center gap-1.5 text-[10px] uppercase text-white/60 tracking-wider mb-0.5"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {Icon && <Icon size={12} weight="bold" className="text-white/80" />}
                    <span>{title}</span>
                  </div>

                  {/* Bold number */}
                  <div
                    className="text-[20px] md:text-[22px] font-bold text-white leading-none tracking-tight mb-0.5"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {number}
                  </div>

                  {/* Measurement */}
                  <div
                    className="text-[10px] md:text-[10.5px] text-white/50 font-normal leading-tight"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {measurement}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Action Buttons — Matching Height & Balanced Layout */}
          <motion.div
            custom={1.0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full flex flex-col gap-2 pt-1"
          >
            <Button
              variant="primary"
              fullWidth
              onClick={() => console.log('[StudyWrap] Share full wrap tapped')}
              className="!py-2.5 md:!py-3 !font-black !text-xs md:!text-sm !uppercase !tracking-wider !shadow-lg shadow-purple-900/40 hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <ShareNetwork size={18} weight="bold" />
              <span>Share your Wrap</span>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
              className="!py-2.5 md:!py-3 !text-xs md:!text-sm !font-bold !text-white/90 hover:!text-white !border-white/25 hover:!bg-white/15 active:scale-[0.98] transition-all"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Save Wrap &amp; Exit
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
