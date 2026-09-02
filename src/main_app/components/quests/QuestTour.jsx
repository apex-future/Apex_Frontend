import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Snowflake,
  ArrowCounterClockwise,
  Package,
  X,
} from '@phosphor-icons/react';
import useOnboardingStore from '../../store/useOnboardingStore';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * QuestTour — First-visit guided tour of the Quest page.
 * Teaches new students the quest reward ecosystem through a 4-step walkthrough:
 *   Step 1 — Welcome modal (no spotlight)
 *   Step 2 — Spotlight quest_1 card (Streak Freeze explanation)
 *   Step 3 — Spotlight quest_2 card (Refresh Token explanation)
 *   Step 4 — Spotlight refresh token badge (spending tokens explanation)
 */
export default function QuestTour({ quests }) {
  const { hasSeenQuestTour, completeTour } = useOnboardingStore();

  // Steps: 'welcome' | 'quest-1' | 'quest-2' | 'refresh' | null
  const [currentStep, setCurrentStep] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Visibility condition: gate checks whether the tour should run
  const isTourEligible =
    !hasSeenQuestTour &&
    quests !== null &&
    (quests?.quest_1?.is_onboarding === true ||
      quests?.quest_2?.is_onboarding === true);

  // Initialize or reset currentStep based on eligibility
  useEffect(() => {
    if (isTourEligible) {
      setCurrentStep((prev) => prev || 'welcome');
    } else {
      setCurrentStep(null);
    }
  }, [isTourEligible]);

  // Auto-scroll target elements into comfortable view when advancing steps
  useEffect(() => {
    if (!currentStep || currentStep === 'welcome') return;

    let selector = null;
    if (currentStep === 'quest-1') {
      selector = '#quest-card-1, [data-quest-key="quest_1"]';
    } else if (currentStep === 'quest-2') {
      selector = '#quest-card-2, [data-quest-key="quest_2"]';
    } else if (currentStep === 'refresh') {
      selector = '#quest-refresh-token-badge';
    }

    if (!selector) return;

    const performScroll = () => {
      const el = document.querySelector(selector);
      if (!el) return;

      const elRect = el.getBoundingClientRect();

      if (window.innerWidth < 768) {
        // On mobile:
        if (currentStep === 'refresh') {
          const targetScrollY = window.scrollY + elRect.top - 80;
          window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
        } else {
          // Position spotlighted card comfortably ~75px from top, leaving room below for floating card
          const targetScrollY = window.scrollY + elRect.top - 75;
          window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
        }
      } else {
        // On desktop:
        if (currentStep === 'refresh') {
          const targetScrollY = window.scrollY + elRect.top - 100;
          window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    const timer = setTimeout(performScroll, 60);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Track target element bounding rect for spotlight cutout and positioning
  useEffect(() => {
    if (!currentStep || currentStep === 'welcome') {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      let selector = null;
      let isPill = false;
      let pad = 8;
      let rx = 16;

      if (currentStep === 'quest-1') {
        selector = '#quest-card-1, [data-quest-key="quest_1"]';
        pad = 8;
        rx = 16;
      } else if (currentStep === 'quest-2') {
        selector = '#quest-card-2, [data-quest-key="quest_2"]';
        pad = 8;
        rx = 16;
      } else if (currentStep === 'refresh') {
        selector = '#quest-refresh-token-badge';
        pad = 6;
        isPill = true;
      }

      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              pad,
              rx: isPill ? rect.height / 2 + 8 : rx,
            });
            return;
          }
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const interval = setInterval(updateRect, 100);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, isMobile]);

  // Dismiss / complete handler
  const handleDismiss = () => {
    completeTour('Quest');
    setCurrentStep(null);
  };

  // Visibility gate
  if (!isTourEligible || !currentStep) {
    return null;
  }


  // Positioning of floating Cards: ensures generous spacing so slide never overlaps focus
  const getFloatingCardStyle = () => {
    if (!targetRect) {
      return {
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100vw - 32px)' : '400px',
      };
    }

    const windowH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const windowW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const cardHeightEst = 220;
    const pad = targetRect.pad || 8;
    const gap = 24; // Generous 24px spacing between focus area and slide

    const spaceBelow = windowH - (targetRect.top + targetRect.height + pad + gap);
    const spaceAbove = targetRect.top - pad - gap;

    let topPos;
    // If enough space below, place below with gap
    if (spaceBelow >= cardHeightEst) {
      topPos = targetRect.top + targetRect.height + pad + gap;
    } else if (spaceAbove >= cardHeightEst) {
      // If cramped below but space above, place above with gap
      topPos = targetRect.top - pad - gap - cardHeightEst;
    } else if (spaceBelow >= spaceAbove) {
      // More space below than above
      topPos = targetRect.top + targetRect.height + pad + gap;
    } else {
      // More space above than below
      topPos = Math.max(16, targetRect.top - pad - gap - cardHeightEst);
    }

    return {
      top: topPos,
      left: isMobile
        ? 16
        : Math.max(24, Math.min(windowW - 424, targetRect.left + targetRect.width / 2 - 200)),
      width: isMobile ? 'calc(100vw - 32px)' : '400px',
    };
  };

  return createPortal(
    <>
      {/* ── Spotlight Backdrop Overlay with Cutout ──────────────── */}
      {currentStep !== 'welcome' && (
        <>
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-[9980]"
            style={{ width: '100vw', height: '100vh' }}
          >
            <defs>
              <mask id="quest-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - targetRect.pad}
                    y={targetRect.top - targetRect.pad}
                    width={targetRect.width + targetRect.pad * 2}
                    height={targetRect.height + targetRect.pad * 2}
                    rx={targetRect.rx}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
          </svg>

          {/* Full Screen Dimmed & Blurred Backdrop with Cutout */}
          <div
            className="fixed inset-0 z-[9980] bg-black/40 backdrop-blur-[6px] transition-all duration-150 pointer-events-none"
            style={{
              mask: 'url(#quest-spotlight-mask)',
              WebkitMask: 'url(#quest-spotlight-mask)',
            }}
          />
        </>
      )}

      {/* ── Step 1: Welcome Modal (no spotlight) ────────────────── */}
      <Modal
        isOpen={currentStep === 'welcome'}
        title="Your first quests are ready"
        onClose={handleDismiss}
        className="max-w-md"
        actions={[
          {
            label: 'Show Me',
            variant: 'primary',
            onClick: () => setCurrentStep('quest-1'),
          },
          {
            label: 'Skip Tour',
            variant: 'ghost',
            onClick: handleDismiss,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            Today's quests are specially designed to teach you how Apex rewards work. Complete them in order to earn two items that will protect and power your study habit.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 dark:text-sky-400 shrink-0">
                <Snowflake size={18} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Streak Freeze</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Saves your streak automatically if you ever miss a day.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <ArrowCounterClockwise size={18} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Refresh Token</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Swap any quest you don't like for a different one.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Package size={18} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Chest Rewards</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Complete a quest and a chest appears. Drag it open to claim your items.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 2: Spotlight quest_1 Card ─────────────────────── */}
      <AnimatePresence>
        {currentStep === 'quest-1' && targetRect && (
          <div
            className="fixed z-[9990] pointer-events-none"
            style={getFloatingCardStyle()}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 24 : -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 16 : -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">
                      Step 1 of 3
                    </span>
                    <h3 className="text-sm font-bold font-display text-text-primary">
                      Complete quest 1
                    </h3>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-3 font-sans">
                  Add your first book to your library. When completed, open the chest here to earn a Streak Freeze.
                </p>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium mb-4">
                  <Snowflake size={16} weight="bold" />
                  <span>Streak Freeze inside</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('quest-2')}
                    className="w-full !py-2.5 text-xs font-bold font-display"
                  >
                    Got it
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Spotlight quest_2 Card ─────────────────────── */}
      <AnimatePresence>
        {currentStep === 'quest-2' && targetRect && (
          <div
            className="fixed z-[9990] pointer-events-none"
            style={getFloatingCardStyle()}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 24 : -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 16 : -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">
                      Step 2 of 3
                    </span>
                    <h3 className="text-sm font-bold font-display text-text-primary">
                      Complete quest 2
                    </h3>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-3 font-sans">
                  Open any book and select a word or sentence. Claim the chest to earn a Refresh Token.
                </p>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium mb-4">
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Refresh Token inside</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep('quest-1')}
                    className="!py-2 !px-3 text-xs font-display"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('refresh')}
                    className="!py-2 !px-4 text-xs font-bold font-display"
                  >
                    Got it
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 4: Spotlight Refresh Badge Card ────────────────── */}
      <AnimatePresence>
        {currentStep === 'refresh' && targetRect && (
          <div
            className="fixed z-[9990] pointer-events-none"
            style={getFloatingCardStyle()}
          >
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 24 : -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 16 : -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">
                      Step 3 of 3
                    </span>
                    <h3 className="text-sm font-bold font-display text-text-primary">
                      Use your Refresh Token
                    </h3>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  After earning a token, that number goes up. Tap the refresh icon on quest 3 to spend one and get a different quest.
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep('quest-2')}
                    className="!py-2 !px-3 text-xs font-display"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDismiss}
                    className="!py-2 !px-4 text-xs font-bold font-display"
                  >
                    Got it, let's go
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
