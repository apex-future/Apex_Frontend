import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import useXpStore from '../../store/useXpStore';
import soundManager from '../../utils/soundManager';

// ─── CSS keyframes (injected once into <head>) ─────────────────────────────────
const LEVEL_UP_STYLE_ID = 'level-up-screen-styles';
if (typeof document !== 'undefined' && !document.getElementById(LEVEL_UP_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = LEVEL_UP_STYLE_ID;
  style.textContent = `
    @keyframes lu-flash {
      0%   { opacity: 0;    }
      30%  { opacity: 0.15; }
      100% { opacity: 0;    }
    }
    @keyframes lu-number-spring {
      0%   { transform: scale(0.3); opacity: 0; }
      55%  { transform: scale(1.08); opacity: 1; }
      75%  { transform: scale(0.96); opacity: 1; }
      100% { transform: scale(1.0);  opacity: 1; }
    }
    @keyframes lu-band-rise {
      0%   { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0);    opacity: 1; }
    }
    @keyframes lu-fade-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes lu-bar-fill {
      0%   { width: 0%; }
      100% { width: var(--lu-bar-target); }
    }
    @keyframes lu-flavor-in {
      0%   { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0);   }
    }
    .lu-flash {
      animation: lu-flash 0.08s ease-out forwards;
    }
    .lu-number-spring {
      animation: lu-number-spring 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .lu-band-rise {
      animation: lu-band-rise 0.4s ease-out forwards;
    }
    .lu-fade-in {
      animation: lu-fade-in 0.4s ease-out forwards;
    }
    .lu-bar-fill {
      animation: lu-bar-fill 0.8s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    .lu-flavor-in {
      animation: lu-flavor-in 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

// ─── Confetti helper ─────────────────────────────────────────────────────────
function fireConfetti() {
  const COLORS = [
    '#7C3AED', '#A855F7', '#C084FC', '#DDD6FE',
    '#F59E0B', '#FCD34D', '#FBBF24', '#E9D5FF',
    '#8B5CF6', '#F59E0B', '#7C3AED', '#FCD34D',
    '#C084FC', '#FBBF24', '#A855F7', '#DDD6FE',
    '#F59E0B', '#7C3AED', '#E9D5FF', '#FCD34D',
    '#8B5CF6', '#C084FC', '#FBBF24', '#A855F7',
  ]; // 24 entries — 24 particles

  const COUNT = 24;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight * 0.38;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    // Alternate between dots and short confetti strips
    const isStrip = i % 3 === 0;
    el.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10001;
      left: ${centerX}px;
      top: ${centerY}px;
      background: ${COLORS[i]};
      border-radius: ${isStrip ? '2px' : '50%'};
      width: ${isStrip ? '3px' : '5px'};
      height: ${isStrip ? '10px' : '5px'};
      opacity: 1;
    `;
    document.body.appendChild(el);

    // Spread in a wide arc, biased upward
    const angle = (Math.PI * 2 * i) / COUNT
      - Math.PI / 2 // start from top
      + (Math.random() - 0.5) * 0.8; // jitter
    const speed = 120 + Math.random() * 180;
    const tx = Math.cos(angle) * speed;
    const ty = Math.sin(angle) * speed - 60;

    gsap.to(el, {
      x: tx,
      y: ty,
      opacity: 0,
      rotation: Math.random() * 360,
      duration: 1.1 + Math.random() * 0.4,
      ease: 'power2.out',
      delay: Math.random() * 0.12,
      onComplete: () => el.remove(),
    });
  }
}

// ─── Main LevelUpScreen component ────────────────────────────────────────────
export default function LevelUpScreen() {
  const pendingLevelUp = useXpStore(s => s.pendingLevelUp);
  const clearLevelUp = useXpStore(s => s.clearLevelUp);

  // Animation phase state
  const [visible, setVisible] = useState(false);
  // phase: 'idle' | 'flash' | 'entering' | 'full' | 'leaving'

  const [showFlash, setShowFlash] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [showBand, setShowBand] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [showFlavor, setShowFlavor] = useState(false);

  const hasConfettiFired = useRef(false);
  const autoDismissTimer = useRef(null);
  const levelUpData = useRef(null);

  // Snapshot the level up data when it arrives
  // so it stays stable during dismiss animation
  useEffect(() => {
    if (!pendingLevelUp) return;

    // Store snapshot
    levelUpData.current = pendingLevelUp;
    hasConfettiFired.current = false;

    // Reset all phase state
    setShowFlash(false);
    setShowNumber(false);
    setShowBand(false);
    setShowSub(false);
    setShowBar(false);
    setShowFlavor(false);

    // Begin sequence
    setVisible(true);

    // t=0: flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 80);

    // t=50ms: sound
    setTimeout(() => {
      soundManager.play('level_up');
    }, 50);

    // t=200ms: level number springs in
    setTimeout(() => setShowNumber(true), 200);

    // t=400ms: band name rises in
    setTimeout(() => setShowBand(true), 400);

    // t=700ms: sub-line fades in
    setTimeout(() => setShowSub(true), 700);

    // t=900ms: XP bar fills
    setTimeout(() => setShowBar(true), 900);

    // t=1200ms: confetti
    setTimeout(() => {
      if (!hasConfettiFired.current) {
        hasConfettiFired.current = true;
        fireConfetti();
      }
    }, 1200);

    // t=1700ms: flavor line
    setTimeout(() => setShowFlavor(true), 1700);

    // Auto-dismiss after 5 seconds total (t=5000ms)
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    autoDismissTimer.current = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLevelUp]);

  const handleDismiss = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    setVisible(false);
    // Delay clearing store so exit animation completes
    setTimeout(() => {
      clearLevelUp();
      // Reset all local state for next level up
      setShowNumber(false);
      setShowBand(false);
      setShowSub(false);
      setShowBar(false);
      setShowFlavor(false);
      levelUpData.current = null;
    }, 400);
  }, [clearLevelUp]);

  const data = levelUpData.current;

  if (!visible || !data) return null;

  const barTarget = Math.max(2, Math.min(100,
    data.progressPercent ?? 0));

  const content = (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="level-up-screen"
          className="fixed inset-0 z-[10002] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{
            background:
              'linear-gradient(160deg, #1e0038 0%, #3B0764 40%, #1a0030 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleDismiss}
        >

          {/* ── White flash overlay ─────────────────────────── */}
          {showFlash && (
            <div
              className="lu-flash fixed inset-0 bg-white pointer-events-none z-[10003]"
            />
          )}

          {/* ── Ambient background particles (static, CSS) ─── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, ' +
                'rgba(167,139,250,0.08) 0%, transparent 50%),' +
                'radial-gradient(circle at 80% 80%, ' +
                'rgba(245,158,11,0.06) 0%, transparent 50%)',
            }}
          />

          {/* ── Content stack ───────────────────────────────── */}
          <div className="relative flex flex-col items-center justify-center px-6 w-full max-w-sm text-center">

            {/* LEVEL NUMBER */}
            {showNumber && (
              <div
                className="lu-number-spring"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <span
                  className="font-black text-white leading-none"
                  style={{ fontSize: 88 }}
                >
                  {data.newLevel}
                </span>
              </div>
            )}

            {/* BAND NAME */}
            {showBand && (
              <div
                className="lu-band-rise mt-1"
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                }}
              >
                <span
                  className="font-black text-white tracking-tight leading-none"
                  style={{ fontSize: 34 }}
                >
                  {data.newDisplayTitle}
                </span>
              </div>
            )}

            {/* SUB-LINE */}
            {showSub && (
              <div className="lu-fade-in mt-2">
                <span
                  className="text-white/60 font-light"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 14,
                  }}
                >
                  Level {data.newLevel} · {data.newDisplayTitle}
                </span>
              </div>
            )}

            {/* XP PROGRESS BAR */}
            {showBar && (
              <div className="lu-fade-in w-full mt-8 px-2">
                {/* Bar labels */}
                <div className="flex justify-between mb-2">
                  <span
                    className="text-white/40 text-xs"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {data.xpIntoLevel} XP
                  </span>
                  <span
                    className="text-white/40 text-xs"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {data.xpToNextLevel} to next level
                  </span>
                </div>

                {/* Bar track */}
                <div
                  className="w-full h-2.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  {/* Animated fill */}
                  <div
                    className="lu-bar-fill h-full rounded-full"
                    style={{
                      '--lu-bar-target': `${barTarget}%`,
                      background:
                        'linear-gradient(90deg, #7C3AED, #C084FC, #F59E0B)',
                      boxShadow: '0 0 12px rgba(196,132,252,0.5)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* FLAVOR TEXT */}
            {showFlavor && (
              <div className="lu-flavor-in mt-10">
                <span
                  className="text-white/40 font-light tracking-wide"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                  }}
                >
                  The climb continues. Don't stop.
                </span>
              </div>
            )}

          </div>

          {/* ── Tap to dismiss hint ─────────────────────────── */}
          {showFlavor && (
            <div className="lu-fade-in absolute bottom-12 left-0 right-0 flex justify-center">
              <span
                className="text-white/25 text-xs font-light tracking-widest uppercase"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Tap to continue
              </span>
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// ─── DEV test helper ─────────────────────────────────────────────────────────
if (import.meta.env.DEV) {
  window.__apexTestLevelUp = (
    level = 12, title = 'Sophomore') => {
    // Direct store access via the already-imported store
    useXpStore.setState({
      pendingLevelUp: {
        newLevel: level,
        newDisplayTitle: title,
        progressPercent: 35,
        xpIntoLevel: 420,
        xpForCurrentLevel: 1200,
        xpToNextLevel: 780,
      },
    });
  };
}
