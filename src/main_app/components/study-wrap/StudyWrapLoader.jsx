import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FingerprintSimple } from '@phosphor-icons/react';
import DepthText from '../ui/DepthText';
import Orb from '../ui/Orb';
import './studyWrap.css';

const LOADER_MESSAGES = [
  "Gathering your story...",
  "Reading your sessions...",
  "Crunching the numbers...",
  "Polishing your wrap...",
  "Almost ready...",
];

const CIRCLE_RADIUS = 36;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ≈ 226.2
const HOLD_DURATION_MS = 5200; // Relaxed hold & countdown duration (~1.04s per number)

export default function StudyWrapLoader({ onComplete, isDataReady = false, studyDays = 5 }) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'hold'
  const [messageIndex, setMessageIndex] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentNum, setCurrentNum] = useState(5);
  const [isHolding, setIsHolding] = useState(false);

  const holdStartTimeRef = useRef(null);
  const holdAnimFrameRef = useRef(null);
  const isHoldingRef = useRef(false);
  const minTimePassedRef = useRef(false);
  const isDataReadyRef = useRef(isDataReady);
  isDataReadyRef.current = isDataReady;

  // Phase 1: Loading & Message cycling
  useEffect(() => {
    if (phase !== 'loading') return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADER_MESSAGES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [phase]);

  // Phase 1 Minimum display timer (at least 2.2s for smooth experience)
  useEffect(() => {
    minTimePassedRef.current = false;
    const minTimer = setTimeout(() => {
      minTimePassedRef.current = true;
      if (isDataReadyRef.current) {
        setPhase('hold');
        console.log('[StudyWrap] Data ready & min time met — transitioning to hold screen');
      }
    }, 2200);

    return () => clearTimeout(minTimer);
  }, []);

  // When isDataReady becomes true, check if minimum time has passed
  useEffect(() => {
    if (isDataReady && minTimePassedRef.current && phase === 'loading') {
      setPhase('hold');
      console.log('[StudyWrap] Data ready — transitioning to hold screen');
    }
  }, [isDataReady, phase]);

  // Hold mechanic & countdown
  const startHold = () => {
    if (phase !== 'hold') return;
    isHoldingRef.current = true;
    setIsHolding(true);
    holdStartTimeRef.current = performance.now();

    const updateLoop = (now) => {
      if (!isHoldingRef.current) return;
      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      // Map progress (0 to 1) evenly to number 5 down to 0
      let nextNum = 5;
      if (progress >= 1) {
        nextNum = 0;
      } else if (progress >= 0.8) {
        nextNum = 1;
      } else if (progress >= 0.6) {
        nextNum = 2;
      } else if (progress >= 0.4) {
        nextNum = 3;
      } else if (progress >= 0.2) {
        nextNum = 4;
      } else {
        nextNum = 5;
      }

      setCurrentNum(nextNum);

      if (progress >= 1) {
        isHoldingRef.current = false;
        setIsHolding(false);
        if (holdAnimFrameRef.current) {
          cancelAnimationFrame(holdAnimFrameRef.current);
          holdAnimFrameRef.current = null;
        }
        console.log('[StudyWrap] Hold complete — countdown reached 0');

        // Smooth instantaneous transition after reaching 0
        setTimeout(() => {
          onComplete?.();
        }, 100);
      } else {
        holdAnimFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };

    holdAnimFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const endHold = () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsHolding(false);
    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }
    if (phase === 'hold') {
      setHoldProgress(0);
      setCurrentNum(5);
      console.log('[StudyWrap] Hold released early — reset');
    }
  };

  useEffect(() => {
    return () => {
      if (holdAnimFrameRef.current) {
        cancelAnimationFrame(holdAnimFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative z-10 bg-transparent select-none">
      <AnimatePresence mode="wait">
        {/* PHASE 1: Fluid Shader Orb & Cycling Text */}
        {phase === 'loading' && (
          <motion.div
            key="loading-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            {/* Interactive Shader Orb */}
            <div className="relative w-32 h-32 md:w-36 md:h-36 mb-6 flex items-center justify-center pointer-events-none">
              <Orb
                hue={270}
                hoverIntensity={0.5}
                rotateOnHover={true}
                forceHoverState={true}
                backgroundColor="#000000"
              />
            </div>

            {/* Cycling message */}
            <p
              className="study-wrap-text-cycle text-base font-bold text-white tracking-wide"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {LOADER_MESSAGES[messageIndex]}
            </p>
          </motion.div>
        )}

        {/* PHASE 2: Countdown & Hold Screen */}
        {phase === 'hold' && (
          <motion.div
            key="hold-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full flex flex-col items-center justify-between h-[440px] max-h-[85%]"
          >
            {/* Top Prompt */}
            <p
              className="text-[12px] text-white/50 text-center"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Your Study Wrap is ready.
            </p>

            {/* Center: Large Countdown Display with DepthText and 3D Flip */}
            <div
              className="flex flex-col items-center justify-center my-auto"
              style={{ perspective: '400px' }}
            >
              <motion.div
                key={currentNum}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex items-center justify-center select-none leading-none"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <DepthText
                  text={String(currentNum)}
                  layers={18}
                  depth={3}
                  faceColor="#FFFFFF"
                  depthColor="#7C3AED"
                  fontSize="clamp(5.5rem, 24vw, 7.5rem)"
                  fontWeight={900}
                  shadow
                />
              </motion.div>
              <div
                className="text-[15px] font-semibold text-white/60 uppercase tracking-widest mt-3"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                days
              </div>
            </div>

            {/* Bottom: Hold Button with Fingerprint Icon & Explanatory Text */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="relative w-[80px] h-[80px] cursor-pointer touch-none"
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                onTouchCancel={endHold}
              >
                {/* Outer SVG Ring */}
                <svg
                  className="w-[80px] h-[80px] -rotate-90 pointer-events-none"
                  viewBox="0 0 80 80"
                >
                  {/* Background Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={CIRCLE_RADIUS}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  {/* Progress Stroke */}
                  <circle
                    cx="40"
                    cy="40"
                    r={CIRCLE_RADIUS}
                    stroke="rgba(255, 255, 255, 1)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - holdProgress)}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner Frosted Glass Circle with Fingerprint Icon */}
                <div
                  className={`absolute inset-0 m-auto w-[64px] h-[64px] rounded-full flex items-center justify-center pointer-events-none transition-all duration-300 ${
                    isHolding
                      ? 'scale-105 shadow-[0_0_24px_rgba(192,132,252,0.6)] bg-white/25 border-white/60'
                      : 'bg-white/10 border-white/20'
                  }`}
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: '50%',
                  }}
                >
                  <FingerprintSimple
                    size={30}
                    weight={isHolding ? "bold" : "regular"}
                    className={`transition-all duration-300 ${
                      isHolding ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/75'
                    }`}
                  />
                </div>
              </div>

              {/* Explanatory Text Underneath */}
              <p
                className="text-[11px] text-white/50 mt-3 select-none tracking-wide"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {isHolding ? 'Keep holding...' : 'Hold to begin'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apex Wrap watermark at bottom */}
      <div
        className="absolute bottom-6 left-0 right-0 text-center font-black uppercase text-xs tracking-[0.25em] text-white/70 pointer-events-none"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Apex Wrap
      </div>
    </div>
  );
}
