import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Lightning, Target, Clock, PlayCircle } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import useXpStore from '../../store/useXpStore';
import useThemeStore from '../../store/themeStore';

const HAILING_TEXTS = [
  "Knowledge unlocked!",
  "Great session!",
  "You're on fire!",
  "Mind expanded!",
  "Apex Scholar in the making!",
  "Another step towards mastery!",
];

function CountingNumber({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export default function SessionSummaryModal({
  onClose,
  onStartQuiz,
  xpGained,
  pagesRead,
  timeSpentSeconds,
}) {
  const isMultiplierActive = useXpStore(state => state.isMultiplierActive());
  const lastMultiplierApplied = useXpStore(state => state.lastMultiplierApplied);
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [hailingText, setHailingText] = useState('');

  useEffect(() => {
    setHailingText(HAILING_TEXTS[Math.floor(Math.random() * HAILING_TEXTS.length)]);
    
    // Fire confetti
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, startVelocity: 15, origin: { x: randomInRange(0.1, 0.9), y: -0.1 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 1) return '0:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const showMultiplier = isMultiplierActive || lastMultiplierApplied > 1.0;
  const multiplierCount = lastMultiplierApplied > 1.0 ? `${lastMultiplierApplied}x` : null;

  // Exact card bg from Header.jsx dashboard
  const cardBase = isDark
    ? 'bg-bg-elevated border-t border-white/10 shadow-sm shadow-black/40'
    : 'bg-bg-subtle border-t border-black/10 shadow-sm shadow-black/10';

  const xpCardBorder = showMultiplier
    ? (isDark ? 'border-t-2 border-purple-500' : 'border-t-2 border-purple-500')
    : '';

  // Radial gradient backgrounds: glow at bottom
  const lightGradient = 'bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]';
  const darkGradient = 'bg-[#0D0D0F] [background:radial-gradient(125%_125%_at_50%_10%,#141416_40%,#3b0764_100%)]';
  const bgGradient = isDark ? darkGradient : lightGradient;

  const stats = [
    {
      key: 'xp',
      label: 'TOTAL XP',
      icon: <Lightning size={28} />,
      value: <CountingNumber value={xpGained} />,
      // Purple when multiplier, gold otherwise
      accentLight: showMultiplier ? '#7C3AED' : '#D97706',
      accentDark:  showMultiplier ? '#A78BFA' : '#F59E0B',
      seedBgLight: showMultiplier ? 'rgba(124,58,237,0.10)' : 'rgba(217,119,6,0.10)',
      seedBgDark:  showMultiplier ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.15)',
      cardBorder: showMultiplier
        ? (isDark ? 'border border-purple-500 shadow-sm shadow-black/40 bg-bg-elevated' : 'border border-purple-500 shadow-sm shadow-black/10 bg-bg-subtle')
        : null,
      sub: showMultiplier ? multiplierCount : null,
    },
    {
      key: 'pages',
      label: 'PAGES',
      icon: <Target size={28} />,
      value: <CountingNumber value={pagesRead} />,
      accentLight: '#059669',
      accentDark:  '#34D399',
      seedBgLight: 'rgba(5,150,105,0.10)',
      seedBgDark:  'rgba(52,211,153,0.15)',
      cardBorder: null,
    },
    {
      key: 'time',
      label: 'TIME',
      icon: <Clock size={28} />,
      value: <span>{formatTime(timeSpentSeconds)}</span>,
      accentLight: '#0284C7',
      accentDark:  '#38BDF8',
      seedBgLight: 'rgba(2,132,199,0.10)',
      seedBgDark:  'rgba(56,189,248,0.15)',
      cardBorder: null,
    },
  ];

  return (
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

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-1 font-sans"
          >
            {hailingText}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-tertiary font-semibold mb-10 text-base font-sans"
          >
            Session Complete
          </motion.p>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="grid grid-cols-3 gap-2 sm:gap-4 w-full mb-10"
          >
            {stats.map(({ key, label, icon, value, accentLight, accentDark, seedBgLight, seedBgDark, cardBorder, sub }) => {
              const accent = isDark ? accentDark : accentLight;
              const seedBg = isDark ? seedBgDark : seedBgLight;
              const baseCard = cardBorder || (isDark
                ? 'border-t border-white/10 shadow-sm shadow-black/40 bg-bg-elevated'
                : 'border-t border-black/10 shadow-sm shadow-black/10 bg-bg-subtle');

              return (
                <div
                  key={key}
                  className={`${baseCard} rounded-xl p-4 flex flex-col items-center gap-2`}
                >
                  {/* Seed label */}
                  <div
                    className="mb-2 px-2 py-0.5 rounded-full text-[11px] font-black tracking-widest uppercase"
                    style={{ backgroundColor: seedBg, color: accent }}
                  >
                    {label}
                  </div>

                  {/* Value */}
                  <div
                    className="flex items-center gap-1.5 font-black font-sans"
                    style={{ color: accent, fontSize: '1.5rem', lineHeight: 1 }}
                  >
                    {icon}
                    <span>{value}</span>
                  </div>

                  {/* Multiplier badge */}
                  {sub && (
                    <div
                      className="text-[11px] font-black tracking-widest"
                      style={{ color: accent }}
                    >
                      {sub}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full space-y-3"
          >
            <button
              onClick={onStartQuiz}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-brand hover:bg-brand-light active:bg-brand-mid text-white font-bold text-base font-sans transition-colors duration-200 shadow-sm"
            >
              <PlayCircle size={22} weight="fill" />
              Test Your Knowledge
            </button>

            <button
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-bold text-base font-sans text-text-secondary transition-all duration-200 active:scale-[0.98] ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              No Thanks, Exit
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
