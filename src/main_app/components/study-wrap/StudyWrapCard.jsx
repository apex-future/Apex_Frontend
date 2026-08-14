import React, { useState, useEffect } from 'react';
import { ShareNetwork, Trophy, Quotes, BookOpen, Clock, Flame, Lightning, Fire, CalendarCheck, ListChecks } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import DepthText from '../ui/DepthText';
import ShuffleText from '../ui/ShuffleText';
import bgImg from '../../../assets/Exam_Day_Asset/background.jpg';

const imageVariants = {
  hidden: {
    y: 30,
    opacity: 0,
    scale: 0.96
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
      delay: 0.15
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const statRowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const getStatCardData = (key, value) => {
  let title = '';
  let IconComponent = Trophy;

  switch (key) {
    case 'mostRead':
      title = 'Most Read';
      IconComponent = BookOpen;
      break;
    case 'leastRead':
      title = 'Least Read';
      IconComponent = BookOpen;
      break;
    case 'totalPages':
      title = 'Total Pages';
      IconComponent = BookOpen;
      break;
    case 'totalHours':
      title = 'Total Hours';
      IconComponent = Clock;
      break;
    case 'longestSession':
      title = 'Longest Session';
      IconComponent = Lightning;
      break;
    case 'averageSession':
      title = 'Average';
      IconComponent = Clock;
      break;
    case 'mostActiveHour':
      title = 'Peak Hour';
      IconComponent = Clock;
      break;
    case 'bestScore':
      title = 'Best Score';
      IconComponent = Trophy;
      break;
    case 'lowestScore':
      title = 'Lowest';
      IconComponent = Trophy;
      break;
    case 'avgScore':
      title = 'Avg Score';
      IconComponent = Trophy;
      break;
    case 'quizzesTaken':
      title = 'Quizzes Taken';
      IconComponent = ListChecks;
      break;
    case 'longestStreak':
      title = 'Longest Streak';
      IconComponent = Fire;
      break;
    case 'daysStudied':
      title = 'Days Studied';
      IconComponent = CalendarCheck;
      break;
    case 'mostActiveDay':
      title = 'Active Day';
      IconComponent = Flame;
      break;
    case 'streaksBroken':
      title = 'Broken';
      IconComponent = Flame;
      break;
    default:
      title = key.replace(/([A-Z])/g, ' $1');
      IconComponent = Trophy;
  }

  let number = '';
  let measurement = '';

  if (value.includes('—')) {
    const parts = value.split('—');
    const partA = parts[0].trim();
    const partB = parts[1].trim();

    const startsWithDigit = (str) => /^[+-]?[\d.,%]+/.test(str);

    if (startsWithDigit(partB) && !startsWithDigit(partA)) {
      number = partB;
      measurement = partA;
    } else {
      number = partA;
      measurement = partB;
    }
  } else {
    const match = value.match(/^([\d.,%]+)\s*(.*)$/);
    if (match) {
      number = match[1];
      measurement = match[2];
    } else {
      number = value;
      measurement = '';
    }
  }

  return { title, IconComponent, number, measurement };
};

function StatNumber({ value = '' }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return '';
    const str = String(value);
    const hasPercent = str.includes('%');
    const hasDecimals = str.includes('.');
    return (hasDecimals ? '0.0' : '0') + (hasPercent ? '%' : '');
  });

  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }

    const str = String(value).trim();
    const hasPercent = str.includes('%');
    const hasCommas = str.includes(',');

    const cleanStr = str.replace(/[,%]/g, '');
    const targetNum = parseFloat(cleanStr);

    if (isNaN(targetNum)) {
      setDisplayValue(str);
      return;
    }

    const decimalPlaces = cleanStr.includes('.') ? (cleanStr.split('.')[1] || '').length : 0;

    let animFrame = null;
    let timeoutId = null;

    const delayMs = 1700;
    const durationMs = 800;

    timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / durationMs, 1);
        const easeOutProgress = 1 - Math.pow(1 - t, 3);
        const currentVal = targetNum * easeOutProgress;

        let formattedNum = currentVal.toFixed(decimalPlaces);

        if (hasCommas) {
          const parts = formattedNum.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          formattedNum = parts.join('.');
        }

        if (hasPercent) {
          formattedNum += '%';
        }

        setDisplayValue(formattedNum);

        if (t < 1) {
          animFrame = requestAnimationFrame(animate);
        } else {
          let finalFormatted = targetNum.toFixed(decimalPlaces);
          if (hasCommas) {
            const parts = finalFormatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            finalFormatted = parts.join('.');
          }
          if (hasPercent) {
            finalFormatted += '%';
          }
          setDisplayValue(finalFormatted);
        }
      };

      animFrame = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [value]);

  return <>{displayValue}</>;
}

export default function StudyWrapCard({
  direction = 1,
  topicLabel,
  image,
  headline,
  achievementTitle,
  achievementWhy,
  supporting,
  imageStyle,
}) {
  const supportingEntries = supporting ? Object.entries(supporting) : [];

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-4 study-wrap-card-enter relative z-10 select-none">
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-purple-400/35" />

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
        {/* Large Hero Image (Fills 98% of container width) */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <motion.img
            key={image}
            src={image}
            alt={topicLabel}
            initial="hidden"
            animate="visible"
            variants={imageVariants}
            className="w-[98%] mx-auto max-h-[190px] md:max-h-[215px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
            style={{
              ...imageStyle,
              willChange: "transform",
            }}
          />
        </div>

        {/* Non-Image Content Wrapper */}
        <div className="w-full px-4 pb-1 md:px-5 flex flex-col items-center text-center gap-2">
          <motion.div
            custom={0.5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full"
          >
            <DepthText
              text={headline}
              layers={18}
              depth={2}
              faceColor="#FFFFFF"
              depthColor="#7C3AED"
              fontSize="clamp(1.5rem, 5.5vw, 2.25rem)"
              fontWeight={900}
              shadow
            />
          </motion.div>

          {/* Achievement Badge Block */}
          {achievementTitle && (
            <motion.div
              custom={0.9}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="relative w-full overflow-visible mt-2 mb-2"
            >
              {/* SVG Gradient Definition */}
              <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                  <linearGradient id="quote-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C084FC" /> {/* Purple */}
                    <stop offset="100%" stopColor="#FFFFFF" /> {/* White */}
                  </linearGradient>
                </defs>
              </svg>

              {/* Back Card (peaking out, rotated and colored purple gradient, matching design blob style) */}
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-purple-700 to-violet-500 opacity-90 transform -rotate-3 scale-[1.02] shadow-xl" />

              {/* Front Card (achievement box) */}
              <div
                className="relative w-full rounded-[24px] p-4 md:p-5 flex flex-col items-center border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-visible"
                style={{
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(30, 27, 75, 0.88)), url(${bgImg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Quotes: One at top-left, one at bottom-right rotated 180 degrees */}
                <Quotes
                  size={32}
                  weight="fill"
                  className="absolute -top-3.5 -left-3"
                  style={{ fill: 'url(#quote-gradient)' }}
                />
                <Quotes
                  size={32}
                  weight="fill"
                  className="absolute -bottom-3.5 -right-3 transform rotate-180"
                  style={{ fill: 'url(#quote-gradient)' }}
                />

                {/* Achievement Header - Creative Playfair Display Italic (No trophy icon) */}
                <div
                  className="text-amber-200 font-extrabold italic text-sm md:text-base tracking-wide mb-1 text-center drop-shadow"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {/* Playfair Display retained — intentional accent */}
                  <ShuffleText
                    text={achievementTitle}
                    shuffleDirection="right"
                    duration={1.2}
                    delay={0.9}
                    animationMode="evenodd"
                    shuffleTimes={2}
                    ease="power3.out"
                    stagger={0.06}
                  />
                </div>

                <motion.p
                  custom={1.5}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="text-xs text-white/95 italic font-medium mt-2 px-2 leading-relaxed max-w-[340px] text-center relative z-10"
                >
                  {achievementWhy}
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Supporting Stat Cards */}
          {supportingEntries.length > 0 && (
            <motion.div
              custom={1.7}
              initial="hidden"
              animate="visible"
              variants={statRowVariants}
              className="w-full grid grid-cols-2 gap-3 mt-2 px-1"
            >
              {supportingEntries.slice(0, 2).map(([key, value]) => {
                const { title, IconComponent, number, measurement } = getStatCardData(key, value);
                return (
                  <div
                    key={key}
                    className="flex flex-col items-start rounded-[14px] p-[10px_12px] text-left overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {/* Icon + Title row */}
                    <div
                      className="flex items-center gap-1.5 text-[10px] uppercase text-white/60 tracking-wider mb-1"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <IconComponent size={12} weight="bold" />
                      <span>{title}</span>
                    </div>

                    {/* Bold number */}
                    <div
                      className="text-[22px] font-bold text-white opacity-100 leading-none tracking-tight mb-0.5"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      <StatNumber value={number} />
                    </div>

                    {/* Measurement */}
                    {measurement && (
                      <div
                        className="text-[10.5px] text-white/50 font-normal leading-tight"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {measurement}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
}




