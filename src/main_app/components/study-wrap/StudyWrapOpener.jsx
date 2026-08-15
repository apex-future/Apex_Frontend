import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Question } from '@phosphor-icons/react';
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

const FAN_CARDS = [
  { rotation: -20, x: -72, opacity: 0.35, zIndex: 1 },
  { rotation: -10, x: -36, opacity: 0.65, zIndex: 2 },
  { rotation: 0,   x: 0,   opacity: 1,    zIndex: 5, isCenter: true },
  { rotation: 10,  x: 36,  opacity: 0.65, zIndex: 2 },
  { rotation: 20,  x: 72,  opacity: 0.35, zIndex: 1 },
];

export default function StudyWrapOpener({
  direction,
  userName,
  examName,
  image,
  triggerConfetti = true,
  onConfettiFired,
}) {
  const [showConfetti, setShowConfetti] = useState(triggerConfetti);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const confettiAnimFrameRef = useRef(null);

  // Celebratory confetti shower raining down from the top inside the card (only on first entrance)
  useEffect(() => {
    if (!triggerConfetti) {
      setShowConfetti(false);
      return;
    }

    onConfettiFired?.();
    console.log('[StudyWrap] Opening card mounted — showering confetti from top (first view only)');

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 420;
    canvas.height = rect.height || 680;

    const colors = ['#A855F7', '#C084FC', '#FBBF24', '#FFFFFF', '#7C3AED', '#E879F9', '#38BDF8'];

    // Spawn particles staggered across the top edge
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 140, // Staggered drop start above the card
      vx: (Math.random() - 0.5) * 1.2,
      vy: 1.8 + Math.random() * 2.4, // Downward shower velocity
      swaySpeed: 0.025 + Math.random() * 0.035,
      swayPhase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: 6 + Math.random() * 5,
      height: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 6,
    }));

    let frame = 0;
    const totalFrames = 220;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.swayPhase += p.swaySpeed;
        p.x += Math.sin(p.swayPhase) * 0.9 + p.vx;
        p.y += p.vy;
        p.vy += 0.03; // Gentle downward gravity
        p.rotation += p.vRot;

        // Smooth fade out in the last 60 frames
        const opacity = frame > 160 ? Math.max(0, (totalFrames - frame) / 60) : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      });

      if (frame < totalFrames) {
        confettiAnimFrameRef.current = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    confettiAnimFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (confettiAnimFrameRef.current) {
        cancelAnimationFrame(confettiAnimFrameRef.current);
      }
    };
  }, [triggerConfetti, onConfettiFired]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-full flex flex-col items-center justify-center px-4 py-3 study-wrap-card-enter relative z-10 select-none overflow-hidden"
    >
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-indigo-500/40" />

      {/* Confetti Shower Canvas contained inside the card */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-30 pointer-events-none w-full h-full"
        />
      )}

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
        {/* 1. Hero Image — Exactly matching dimensions of other cards */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <motion.img
            key={image}
            src={image}
            alt="Study Wrap Opener"
            initial="hidden"
            animate="visible"
            variants={imageVariants}
            className="w-[98%] mx-auto max-h-[190px] md:max-h-[215px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>

        {/* Content Wrapper */}
        <div className="w-full px-4 md:px-5 flex flex-col items-center text-center">
          {/* 2. Header — The D-Day Has Arrived */}
          <motion.div
            custom={0.5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full py-1.5 md:py-2 mb-1.5"
          >
            <DepthText
              text="The D-Day Has Arrived"
              layers={18}
              depth={2}
              faceColor="#FFFFFF"
              depthColor="#7C3AED"
              fontSize="clamp(1.45rem, 5.2vw, 2.15rem)"
              fontWeight={900}
              shadow
            />
          </motion.div>

          {/* 3. Exam Name Pill */}
          <motion.div
            custom={0.7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="px-5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-extrabold text-white uppercase tracking-widest shadow-xl mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {examName}
          </motion.div>

          {/* 4. Center-Focused Card Hand */}
          <motion.div
            custom={0.9}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative w-full h-[124px] flex items-end justify-center mb-3"
          >
            {FAN_CARDS.map((card, index) => (
              <div
                key={index}
                className="absolute flex items-center justify-center transition-all duration-300"
                style={{
                  width: '84px',
                  height: '116px',
                  borderRadius: '14px',
                  background: card.isCenter
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: card.isCenter
                    ? '1.5px solid rgba(255, 255, 255, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderTop: card.isCenter
                    ? '1.5px solid rgba(255, 255, 255, 0.7)'
                    : '1px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: card.isCenter
                    ? '0 10px 28px rgba(0, 0, 0, 0.5), 0 0 20px rgba(192, 132, 252, 0.25)'
                    : '0 6px 20px rgba(0, 0, 0, 0.35)',
                  transformOrigin: 'bottom center',
                  transform: `translateX(${card.x}px) rotate(${card.rotation}deg)`,
                  opacity: card.opacity,
                  zIndex: card.zIndex,
                }}
              >
                {card.isCenter && (
                  <Question
                    size={32}
                    weight="bold"
                    color="rgba(255, 255, 255, 0.95)"
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* 5. Two Copy Lines */}
          <motion.div
            custom={1.1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[13.5px] text-white/85 font-medium text-center mb-1"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Tap through. Your story is waiting.
          </motion.div>

          <motion.div
            custom={1.3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[12.5px] text-white/55 font-normal italic text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            You might be surprised who showed up.
          </motion.div>
        </div>
      </div>
    </div>
  );
}
