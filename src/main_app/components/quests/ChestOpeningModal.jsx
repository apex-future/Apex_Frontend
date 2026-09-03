import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Snowflake,
  ArrowCounterClockwise,
  Lightning,
  X,
  ArrowClockwise,
  Lock,
  ArrowRight,
} from '@phosphor-icons/react';
import apiClient from '../../services/apiClient';
import soundManager from '../../utils/soundManager';
import Button from '../ui/Button';

// ─── CSS keyframes (injected once into <head>) ─────────────────────────────────
const CHEST_MODAL_STYLE_ID = 'chest-modal-styles';
if (typeof document !== 'undefined' && !document.getElementById(CHEST_MODAL_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = CHEST_MODAL_STYLE_ID;
  style.textContent = `
    @keyframes chest-shake-slow {
      0%,100% { transform: translateX(0) rotate(0deg); }
      25%      { transform: translateX(-3px) rotate(-1deg); }
      75%      { transform: translateX(3px) rotate(1deg); }
    }
    @keyframes chest-shake-medium {
      0%,100% { transform: translateX(0) rotate(0deg); }
      20%      { transform: translateX(-5px) rotate(-2deg); }
      60%      { transform: translateX(5px) rotate(2deg); }
    }
    @keyframes chest-shake-fast {
      0%,100% { transform: translateX(0) rotate(0deg); }
      15%      { transform: translateX(-7px) rotate(-3deg) translateY(-2px); }
      50%      { transform: translateX(7px) rotate(3deg) translateY(-4px); }
    }
    @keyframes chest-shake-violent {
      0%,100% { transform: translateX(0) rotate(0deg); }
      10%      { transform: translateX(-9px) rotate(-4deg) translateY(-4px); }
      40%      { transform: translateX(9px) rotate(4deg) translateY(-6px); }
      70%      { transform: translateX(-6px) rotate(-3deg) translateY(-3px); }
    }
    @keyframes chest-lid-open {
      0%   { transform: rotate(0deg);   }
      100% { transform: rotate(-35deg); }
    }
    @keyframes chest-glow-pulse {
      0%,100% { opacity: 0.4; transform: scale(1);    }
      50%      { opacity: 0.8; transform: scale(1.08); }
    }
    @keyframes chest-screen-flash {
      0%   { opacity: 0;    }
      25%  { opacity: 0.15; }
      100% { opacity: 0;    }
    }
    @keyframes card-rise {
      0%   { transform: translateY(60px) scale(0.7); opacity: 0; }
      60%  { transform: translateY(-8px) scale(1.03); opacity: 1; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes card-flip {
      0%   { transform: rotateY(90deg); }
      100% { transform: rotateY(0deg);  }
    }
    .chest-shake-slow    { animation: chest-shake-slow 0.8s ease-in-out infinite; }
    .chest-shake-medium  { animation: chest-shake-medium 0.5s ease-in-out infinite; }
    .chest-shake-fast    { animation: chest-shake-fast 0.3s ease-in-out infinite; }
    .chest-shake-violent { animation: chest-shake-violent 0.15s ease-in-out infinite; }
    .chest-lid-open      { animation: chest-lid-open 0.3s ease-out forwards; }
    .chest-glow-pulse    { animation: chest-glow-pulse 1.4s ease-in-out infinite; }
    .screen-flash        { animation: chest-screen-flash 0.08s ease-out forwards; }
    .card-rise           { animation: card-rise 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .card-flip           { animation: card-flip 0.35s ease-out forwards; }
  `;
  document.head.appendChild(style);
}

// ─── Local SVG components ────────────────────────────────────────────────────
const ChestClosed = ({ className, color = '#7C3AED', size = 96 }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
  >
    {/* Body */}
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    {/* Lid */}
    <path d="M2 11 Q2 5 12 5 Q22 5 22 11Z" fill={color} opacity="0.85" />
    {/* Latch */}
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.6" />
    {/* Hinge line */}
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const ChestOpen = ({ className, color = '#7C3AED', size = 96 }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
  >
    {/* Body */}
    <rect x="2" y="11" width="20" height="10" rx="2" fill={color} />
    {/* Lid raised — rotated up */}
    <path d="M2 11 Q2 4 12 2 Q22 4 22 11Z" fill={color} opacity="0.6" />
    {/* Latch */}
    <rect x="10" y="13" width="4" height="3" rx="1" fill="white" opacity="0.4" />
    {/* Opening glow line */}
    <line x1="2" y1="11" x2="22" y2="11" stroke="white" strokeWidth="0.8" opacity="0.25" />
  </svg>
);

const ChestLid = ({ className, color = '#7C3AED', size = 96 }) => (
  <svg
    viewBox="0 0 24 11"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size * (11 / 24)}
    style={{ transformOrigin: '50% 100%' }}
  >
    <path d="M2 11 Q2 5 12 5 Q22 5 22 11Z" fill={color} opacity="0.85" />
  </svg>
);

// ─── RewardCard internal component ───────────────────────────────────────────
function RewardCard({ item, delay, rotation, translateX }) {
  const [risen, setRisen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [overflowSecondsLeft, setOverflowSecondsLeft] = useState(
    item.overflowDurationSeconds ?? 0
  );

  useEffect(() => {
    const riseTimer = setTimeout(() => setRisen(true), delay);
    const flipTimer = setTimeout(() => setFlipped(true), delay + 300);
    const soundTimer = setTimeout(() => {
      soundManager.play('item_reveal');
    }, delay + 350);

    return () => {
      clearTimeout(riseTimer);
      clearTimeout(flipTimer);
      clearTimeout(soundTimer);
    };
  }, [delay]);

  // Overflow countdown
  useEffect(() => {
    if (item.type !== 'overflow' || !item.overflowDurationSeconds) return;
    setOverflowSecondsLeft(item.overflowDurationSeconds);
    const interval = setInterval(() => {
      setOverflowSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [item.type, item.overflowDurationSeconds]);

  const minutes = Math.ceil(overflowSecondsLeft / 60);
  const countdownMinutes = Math.floor(overflowSecondsLeft / 60);
  const countdownSeconds = overflowSecondsLeft % 60;

  const cardBase = `
    w-[200px] rounded-2xl shadow-lg
    bg-white dark:bg-zinc-800
    p-5 flex flex-col items-center gap-3
    text-center transition-all
  `;

  if (item.type === 'streak_freeze') {
    return (
      <div
        className={`${cardBase} ${risen ? 'card-rise' : 'opacity-0'}`}
        style={{ borderTop: '4px solid #60A5FA' }}
      >
        <div className={`${flipped ? 'card-flip' : ''}`} style={{ perspective: '600px' }}>
          <Snowflake size={36} color="#60A5FA" weight="fill" />
        </div>
        <span
          className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: '#60A5FA' }}
        >
          RARE
        </span>
        <h4
          className="text-base font-bold text-zinc-900 dark:text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Streak Freeze
        </h4>
        <p className="text-xs font-light text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          Miss a day. Keep your streak.
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          You now have {item.newCount} / {item.maxCount}
        </p>
      </div>
    );
  }

  if (item.type === 'refresh_token') {
    return (
      <div
        className={`${cardBase} ${risen ? 'card-rise' : 'opacity-0'}`}
        style={{ borderTop: '4px solid #F59E0B' }}
      >
        <div className={`${flipped ? 'card-flip' : ''}`} style={{ perspective: '600px' }}>
          <ArrowCounterClockwise size={36} color="#F59E0B" weight="fill" />
        </div>
        <span
          className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: '#F59E0B' }}
        >
          COMMON
        </span>
        <h4
          className="text-base font-bold text-zinc-900 dark:text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Quest Refresh
        </h4>
        <p className="text-xs font-light text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          Not feeling a quest? Swap it out.
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          You now have {item.newCount} / {item.maxCount}
        </p>
      </div>
    );
  }

  if (item.type === 'overflow') {
    return (
      <div className={`${risen ? 'card-rise' : 'opacity-0'}`}>
        {/* Gradient border wrapper */}
        <div
          className="rounded-2xl p-[4px_4px_0_4px]"
          style={{
            background: 'linear-gradient(90deg, #7C3AED, #60A5FA)',
            borderRadius: '16px',
          }}
        >
          <div
            className="w-[200px] rounded-2xl bg-white dark:bg-zinc-800 p-5 flex flex-col items-center gap-3 text-center shadow-lg"
            style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
          >
            <div className={`${flipped ? 'card-flip' : ''} flex items-center gap-2`} style={{ perspective: '600px' }}>
              {/* Converted items with lock overlays */}
              {item.combinedItems?.includes('streak_freeze') && (
                <div className="relative">
                  <Snowflake size={24} color="#60A5FA" weight="fill" className="opacity-50" />
                  <Lock size={12} color="#7C3AED" weight="bold" className="absolute -bottom-0.5 -right-0.5" />
                </div>
              )}
              {item.combinedItems?.includes('refresh_token') && (
                <div className="relative">
                  <ArrowCounterClockwise size={24} color="#F59E0B" weight="fill" className="opacity-50" />
                  <Lock size={12} color="#7C3AED" weight="bold" className="absolute -bottom-0.5 -right-0.5" />
                </div>
              )}
              <ArrowRight size={16} color="#A78BFA" weight="bold" />
              <Lightning size={28} color="#F59E0B" weight="fill" />
            </div>
            <span
              className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #60A5FA)' }}
            >
              OVERFLOW
            </span>
            <h4
              className="text-base font-bold text-zinc-900 dark:text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {item.overflowTier} Active
            </h4>
            <p
              className="text-sm text-purple-400"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              ×1.5 XP for {Math.ceil((item.overflowDurationSeconds ?? 0) / 60)} minutes
            </p>
            <p className="text-xs font-light text-zinc-500 dark:text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Inventory full — your overflow fuels your grind.
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 self-end" style={{ fontFamily: 'Inter, sans-serif' }}>
              {countdownMinutes}:{String(countdownSeconds).padStart(2, '0')} ▶
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Fan layout helpers ──────────────────────────────────────────────────────
function getFanLayout(totalCards, index) {
  if (totalCards === 1) {
    return { rotation: 0, translateX: 0 };
  }
  if (totalCards === 2) {
    const rotations = [-6, 6];
    const translates = [-60, 60];
    return { rotation: rotations[index], translateX: translates[index] };
  }
  if (totalCards === 3) {
    const rotations = [-10, 0, 10];
    const translates = [-80, 0, 80];
    return { rotation: rotations[index], translateX: translates[index] };
  }
  return { rotation: 0, translateX: 0 };
}

// ─── Main ChestOpeningModal component ────────────────────────────────────────
export default function ChestOpeningModal({
  isOpen,
  questKey,
  questCopy,
  allCompleted,
  onClose,
}) {
  // Phase state machine
  const [phase, setPhase] = useState('idle');
  const [thumbPercent, setThumbPercent] = useState(0);
  const [fillPercent, setFillPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [claimResponse, setClaimResponse] = useState(null);
  const [claimError, setClaimError] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [revealedCardCount, setRevealedCardCount] = useState(0);
  const [showAllCompletedBanner, setShowAllCompletedBanner] = useState(false);
  const [cards, setCards] = useState([]);

  // Refs
  const trackRef = useRef(null);
  const fillFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const holdTimerRef = useRef(null);
  const hasTriggeredBurst = useRef(false);

  // ── startReveal function ──────────────────────────────────────────────────
  const startReveal = useCallback((response) => {
    const reward = response.reward || {};
    const inventory = response.inventory || {};
    const itemsAwarded = reward.items_awarded || [];
    const overflowGrants = reward.overflow_grants || [];
    const multiplierActive = reward.multiplier_active || false;
    const overflowTier = reward.overflow_tier || null;

    const cardList = [];

    // Rare items first
    if (itemsAwarded.includes('streak_freeze')) {
      cardList.push({
        type: 'streak_freeze',
        newCount: inventory.streak_freezes_held ?? 1,
        maxCount: 2,
        overflowTier: null,
        combinedItems: null,
        overflowDurationSeconds: null,
      });
    }

    // Common items
    if (itemsAwarded.includes('refresh_token')) {
      cardList.push({
        type: 'refresh_token',
        newCount: inventory.refresh_tokens ?? 1,
        maxCount: 5,
        overflowTier: null,
        combinedItems: null,
        overflowDurationSeconds: null,
      });
    }

    // Combined overflow card
    if (multiplierActive && overflowGrants.length > 0) {
      const totalSeconds = overflowGrants.reduce(
        (sum, g) => sum + (g.duration_seconds || 0), 0);
      const combinedItems = overflowGrants.map(g => g.item);
      cardList.push({
        type: 'overflow',
        newCount: null,
        maxCount: null,
        overflowTier,
        combinedItems,
        overflowDurationSeconds: totalSeconds,
      });
    }

    setCards(cardList);
    setPhase('revealing');

    // Reveal cards sequentially
    const totalCards = cardList.length;
    if (totalCards === 0) {
      // No cards — go straight to revealed
      setTimeout(() => {
        setPhase('revealed');
        if (allCompleted) {
          setTimeout(() => setShowAllCompletedBanner(true), 300);
        }
      }, 300);
      return;
    }

    // Stagger card reveals
    cardList.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCardCount(prev => prev + 1);
      }, i * 350);
    });

    // After last card settles
    setTimeout(() => {
      setPhase('revealed');
      if (allCompleted) {
        setTimeout(() => setShowAllCompletedBanner(true), 300);
      }
    }, totalCards * 350 + 700);
  }, [allCompleted]);

  // ── triggerBurst function ─────────────────────────────────────────────────
  const triggerBurst = useCallback(() => {
    setPhase('burst');
    soundManager.play('chest_open');
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 80);
    setTimeout(() => setLidOpen(true), 60);

    // After burst animation settles, check for claim response
    setTimeout(() => {
      setClaimResponse(prev => {
        if (prev) {
          // Response already here — go straight to revealing
          startReveal(prev);
          return prev;
        }
        // Response not here yet — enter waiting state
        setPhase('waiting');

        // 3 second timeout
        setTimeout(() => {
          setClaimResponse(resp => {
            if (!resp) {
              setPhase('error');
            }
            return resp;
          });
        }, 3000);

        return null;
      });
    }, 500);
  }, [startReveal]);

  // ── INITIALIZATION useEffect ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Reset all state for fresh open
    setPhase('sliding');
    setThumbPercent(0);
    setFillPercent(0);
    setIsDragging(false);
    setClaimResponse(null);
    setClaimError(false);
    setShowFlash(false);
    setLidOpen(false);
    setRevealedCardCount(0);
    setShowAllCompletedBanner(false);
    setCards([]);
    hasTriggeredBurst.current = false;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Fire claim immediately in background
    apiClient.post('/api/quests/claim', { quest_key: questKey })
      .then(res => {
        if (res.data.already_claimed) {
          // Skip ceremony — already claimed on another device
          onClose(res.data.inventory ?? null);
          return;
        }
        setClaimResponse(res.data);
      })
      .catch(() => {
        // Store the error but don't show yet —
        // only show if burst has already happened
        setClaimError(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── RAF FILL LOOP ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'sliding') {
      cancelAnimationFrame(fillFrameRef.current);
      lastFrameTimeRef.current = null;
      return;
    }

    const MAX_VELOCITY = 1.0; // % per frame at 60fps

    const tick = (timestamp) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      // Use fixed step instead of dt to prevent
      // huge jumps after tab switch
      const step = MAX_VELOCITY;

      setFillPercent(prev => {
        const diff = thumbPercent - prev;
        if (diff <= 0) return prev;
        const next = prev + Math.min(diff, step);

        // Schedule burst when fill reaches 100
        if (next >= 100 && !hasTriggeredBurst.current) {
          hasTriggeredBurst.current = true;
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
          }
          holdTimerRef.current = setTimeout(() => {
            triggerBurst();
          }, 150);
        }

        return Math.min(next, 100);
      });

      lastFrameTimeRef.current = timestamp;
      fillFrameRef.current = requestAnimationFrame(tick);
    };

    fillFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(fillFrameRef.current);
    };
  }, [phase, thumbPercent, triggerBurst]);

  // ── Watch claimResponse for late arrival during 'waiting' ─────────────────
  useEffect(() => {
    if (!claimResponse) return;
    if (phase === 'waiting') {
      startReveal(claimResponse);
    }
  }, [claimResponse, phase, startReveal]);

  useEffect(() => {
    if (claimError && (phase === 'burst' || phase === 'waiting')) {
      setPhase('error');
    }
  }, [claimError, phase]);

  // ── POINTER HANDLERS ──────────────────────────────────────────────────────
  const updateThumb = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setThumbPercent(Math.min(100, pct));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (phase !== 'sliding') return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateThumb(e.clientX);
  }, [phase, updateThumb]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || phase !== 'sliding') return;
    updateThumb(e.clientX);
  }, [isDragging, phase, updateThumb]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── handleClaim ───────────────────────────────────────────────────────────
  const handleClaim = useCallback(() => {
    setPhase('dismissing');
    soundManager.play('claim_success');

    // Cards fly to destinations via GSAP
    const cardEls = document.querySelectorAll('.chest-reward-card');
    cardEls.forEach((el, i) => {
      const angle = -45 + i * 15;
      gsap.to(el, {
        x: Math.cos(angle * Math.PI / 180) * 200,
        y: -250 + Math.random() * 80,
        opacity: 0,
        scale: 0.5,
        duration: 0.5,
        delay: i * 0.06,
        ease: 'power2.in',
      });
    });

    setTimeout(() => {
      onClose(claimResponse?.inventory ?? null);
    }, 550);
  }, [claimResponse, onClose]);

  // ── handleRetry ───────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setClaimError(false);
    setPhase('waiting');

    apiClient.post('/api/quests/claim', { quest_key: questKey })
      .then(res => {
        if (res.data.already_claimed) {
          onClose(res.data.inventory ?? null);
          return;
        }
        setClaimResponse(res.data);
      })
      .catch(() => {
        setClaimError(true);
        setPhase('error');
      });
  }, [questKey, onClose]);

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const getChestShakeClass = (fill) => {
    if (fill < 30) return 'chest-shake-slow';
    if (fill < 60) return 'chest-shake-medium';
    if (fill < 90) return 'chest-shake-fast';
    return 'chest-shake-violent';
  };

  const glowOpacity = Math.max(0, (fillPercent - 30) / 70 * 0.85);

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="chest-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-12"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* SCREEN FLASH */}
          {showFlash && (
            <div
              className="fixed inset-0 z-[10000] bg-white pointer-events-none screen-flash"
            />
          )}

          {/* X CLOSE BUTTON */}
          <button
            className="fixed top-5 right-5 z-[10001] p-2 rounded-full hover:bg-white/20 transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onClick={() => onClose(null)}
          >
            <X size={20} weight="bold" className="text-white" />
          </button>

          {/* CHEST STAGE */}
          <div className="relative mx-auto mb-8" style={{ width: 200, height: 180 }}>
            {/* GLOW (behind chest) */}
            <div
              className="absolute rounded-full pointer-events-none transition-opacity duration-200"
              style={{
                inset: -20,
                background: 'radial-gradient(circle, #7C3AED, transparent 70%)',
                opacity: glowOpacity,
              }}
            />

            {/* CHEST BODY */}
            <div
              className={`relative w-full h-full flex items-center justify-center ${
                phase === 'sliding'
                  ? getChestShakeClass(fillPercent)
                  : phase === 'burst'
                  ? 'chest-shake-violent'
                  : ''
              }`}
            >
              {/* Chest SVG */}
              {lidOpen ? (
                <ChestOpen color="#7C3AED" size={120} />
              ) : (
                <ChestClosed color="#7C3AED" size={120} />
              )}

              {/* LID (only during sliding phase for independent animation) */}
              {phase === 'sliding' && !lidOpen && (
                <div
                  className="absolute top-0 left-0 right-0 flex justify-center"
                  style={{ transformOrigin: '50% 100%' }}
                >
                  {/* Lid is part of the chest SVG already; independent lid hidden when not opening */}
                </div>
              )}

              {/* LID animation overlay when bursting */}
              {lidOpen && (
                <div
                  className="absolute top-0 left-0 right-0 flex justify-center chest-lid-open"
                  style={{ transformOrigin: '50% 100%' }}
                >
                  <ChestLid color="#7C3AED" size={120} className="chest-lid-open" />
                </div>
              )}
            </div>

            {/* LID CRACK (fillPercent >= 30 and not open) */}
            {fillPercent >= 30 && !lidOpen && (
              <div
                className="absolute left-[10%] right-[10%] pointer-events-none"
                style={{
                  top: '50%',
                  height: 2,
                  width: '80%',
                  background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)',
                  opacity: Math.min(1, (fillPercent - 30) / 30),
                  transition: 'opacity 200ms',
                }}
              />
            )}

            {/* WAITING GLOW */}
            {phase === 'waiting' && (
              <div
                className="absolute inset-0 rounded-full chest-glow-pulse pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 60%, rgba(124,58,237,0.6), transparent 60%)',
                }}
              />
            )}
          </div>

          {/* SLIDER SECTION */}
          <AnimatePresence>
            {phase === 'sliding' && (
              <motion.div
                key="slider-section"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 w-full px-6"
              >
                {/* Label */}
                <p
                  className="text-sm font-light text-zinc-400"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {fillPercent < 80 ? 'Pull to open' : 'Almost there...'}
                </p>

                {/* TRACK */}
                <div
                  ref={trackRef}
                  className="w-full max-w-xs h-14 rounded-full relative overflow-visible cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {/* FILL */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #3B0764, #7C3AED, #C084FC)',
                      transform: `scaleX(${fillPercent / 100})`,
                      transformOrigin: 'left',
                    }}
                  />

                  {/* TRACK LABEL */}
                  {fillPercent > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/70 pointer-events-none">
                      {Math.round(fillPercent)}%
                    </div>
                  )}

                  {/* THUMB */}
                  <div
                    className={`absolute rounded-full flex items-center justify-center ${
                      isDragging ? 'ring-2 ring-purple-400 scale-105' : ''
                    }`}
                    style={{
                      top: '50%',
                      transform: 'translateY(-50%)',
                      left: `calc(${fillPercent}% - 28px)`,
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #7C3AED, #3B0764)',
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      transition: isDragging ? 'none' : 'left 0ms',
                    }}
                  >
                    {/* Grip lines */}
                    <div className="flex gap-[3px]">
                      <div className="w-[2px] h-4 rounded bg-white/60" />
                      <div className="w-[2px] h-4 rounded bg-white/60" />
                      <div className="w-[2px] h-4 rounded bg-white/60" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NO CARDS MESSAGE (after burst, no items) */}
          {phase === 'revealed' && cards.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center mt-6"
            >
              <p
                className="text-lg font-bold text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                ✨ Quest Complete!
              </p>
              <p className="text-sm text-zinc-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                {questCopy}
              </p>
            </motion.div>
          )}

          {/* CARDS SECTION */}
          <AnimatePresence>
            {(phase === 'revealing' || phase === 'revealed' || phase === 'dismissing') && cards.length > 0 && (
              <motion.div
                key="cards-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-row items-end justify-center gap-3 mt-4"
                style={{ minHeight: 200 }}
              >
                {cards.slice(0, revealedCardCount).map((card, index) => {
                  const { rotation, translateX } = getFanLayout(cards.length, index);
                  return (
                    <div
                      key={`${card.type}-${index}`}
                      className="chest-reward-card"
                      style={{
                        transform: `rotate(${rotation}deg) translateX(${translateX}px)`,
                      }}
                    >
                      <RewardCard
                        item={card}
                        delay={0}
                        rotation={rotation}
                        translateX={translateX}
                      />
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ALL QUESTS BANNER */}
          <AnimatePresence>
            {showAllCompletedBanner && (
              <motion.div
                key="all-completed-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-amber-500 font-bold text-sm text-center mt-4"
              >
                🏆 All quests done! Golden day earned.
              </motion.div>
            )}
          </AnimatePresence>

          {/* CLAIM BUTTON */}
          <AnimatePresence>
            {phase === 'revealed' && (
              <motion.div
                key="claim-button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mt-6"
              >
                <Button
                  variant="primary"
                  fullWidth={false}
                  className="px-10 py-3.5 text-sm font-bold"
                  onClick={handleClaim}
                >
                  {cards.length > 0 ? 'Claim Rewards' : 'Continue'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WAITING STATE */}
          {phase === 'waiting' && (
            <p
              className="text-sm text-zinc-400 mt-4 animate-pulse"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Opening your chest...
            </p>
          )}

          {/* ERROR STATE */}
          {phase === 'error' && (
            <div className="flex flex-col items-center mt-4">
              <p className="text-red-400 text-sm mb-3">
                Couldn't connect. Try again.
              </p>
              <Button
                variant="ghost"
                fullWidth={false}
                onClick={handleRetry}
                className="text-white border-white/20"
              >
                <ArrowClockwise size={14} /> Retry
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
