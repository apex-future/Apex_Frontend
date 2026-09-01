import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  Book,
  SpeakerHigh,
  WifiSlash,
  ArrowRight,
  Check,
  X
} from '@phosphor-icons/react';
import useOnboardingStore from '../../store/useOnboardingStore';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * DictionaryTour — Native in-app interactive dictionary tour.
 * Features:
 * - Perfectly centered cards on all screens
 * - 4-Quadrant Backdrop blur overlay: completely blurs the entire app while leaving the target 100% unblurred and crisp
 * - Clean static focus outline
 * - Space Grotesk (font-display) and Inter (font-sans) typography
 */
export default function DictionaryTour() {
  const { hasSeenDictionaryTour, completeTour } = useOnboardingStore();
  // Steps: 'welcome' | 'search' | 'offline' | null
  const [currentStep, setCurrentStep] = useState(null);
  const [targetRect, setTargetRect] = useState(null);

  // Auto-start immediately when tour not seen (0ms latency)
  useEffect(() => {
    if (!hasSeenDictionaryTour) {
      setCurrentStep('welcome');
    } else {
      setCurrentStep(null);
    }
  }, [hasSeenDictionaryTour]);

  // Track target element bounding rect for spotlight cutout
  useEffect(() => {
    if (!currentStep || currentStep === 'welcome') {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      let selector = null;
      if (currentStep === 'search') {
        selector = '#tour-dict-search';
      } else if (currentStep === 'offline') {
        selector = '#tour-dict-offline';
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
              radius: currentStep === 'search' ? 24 : 20,
            });
            return;
          }
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const interval = setInterval(updateRect, 200);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep]);

  const handleFinishTour = () => {
    completeTour('Dictionary');
    setCurrentStep(null);
  };

  if (hasSeenDictionaryTour || !currentStep) {
    return null;
  }

  const pad = 10;

  return createPortal(
    <>
      {/* ── Spotlight Backdrop Blur Overlay with Cutout ──────────────── */}
      {currentStep !== 'welcome' && (
        <>
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-[9980]"
            style={{ width: '100vw', height: '100vh' }}
          >
            <defs>
              <mask id="dict-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - pad}
                    y={targetRect.top - pad}
                    width={targetRect.width + pad * 2}
                    height={targetRect.height + pad * 2}
                    rx={targetRect.radius + pad}
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
              mask: 'url(#dict-spotlight-mask)',
              WebkitMask: 'url(#dict-spotlight-mask)',
            }}
          />
        </>
      )}

      {/* ── Step 1: Welcome Modal (uses Modal component) ──────────────── */}
      <Modal
        isOpen={currentStep === 'welcome'}
        title="Welcome to the Dictionary 📚"
        onClose={handleFinishTour}
        className="max-w-md"
        actions={[
          {
            label: 'Show Me Around 🚀',
            variant: 'primary',
            onClick: () => setCurrentStep('search'),
          },
          {
            label: 'Skip Tour',
            variant: 'ghost',
            onClick: handleFinishTour,
          },
        ]}
      >
        <div className="space-y-3 py-1 font-sans">
          <p className="text-text-secondary text-sm leading-relaxed">
            Your comprehensive, offline-ready dictionary designed for quick vocabulary lookups, phonetics, and audio pronunciations.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                <MagnifyingGlass size={18} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Instant Definitions & Audio</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Look up parts of speech, synonyms, definitions, and listen to natural audio pronunciations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <WifiSlash size={18} weight="bold" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">100% Offline Support</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Download the offline dictionary package to define words anywhere without internet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/60 border border-black/5 dark:border-white/5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Book size={18} weight="fill" />
              </div>
              <div>
                <p className="text-xs font-bold font-display text-text-primary">Synced Search History</p>
                <p className="text-[11px] text-text-tertiary mt-0.5 font-sans">
                  Words you look up in the Reader or Dictionary are saved so you can review anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Step 2: Search Bar Spotlight Card ─────────────────────────── */}
      <AnimatePresence>
        {currentStep === 'search' && (
          <div className="fixed inset-x-0 bottom-8 flex justify-center px-4 z-[9990] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                      <MagnifyingGlass size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 1 of 2</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Search Any Word 🔍</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  Type any word into the search box to get instant definitions, examples, and speaker audio.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="primary"
                    onClick={() => setCurrentStep('offline')}
                    className="w-full !py-2.5 text-xs font-bold font-display"
                  >
                    Next: Offline Mode <ArrowRight size={14} weight="bold" className="ml-1 inline" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Step 3: Offline Package Spotlight Card ────────────────────── */}
      <AnimatePresence>
        {currentStep === 'offline' && (
          <div className="fixed inset-x-0 bottom-8 flex justify-center px-4 z-[9990] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md pointer-events-auto font-sans"
            >
              <Card className="p-5 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <WifiSlash size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-primary font-display">Step 2 of 2</span>
                      <h3 className="text-sm font-bold font-display text-text-primary">Offline Support ⚡</h3>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishTour}
                    className="text-text-tertiary hover:text-text-primary p-1 rounded-lg transition-colors"
                    title="Dismiss Tour"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-1 mb-4 font-sans">
                  Click the download button to install the offline dictionary database so you can look up words anywhere without Wi-Fi.
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep('search')}
                    className="!py-2 !px-3 text-xs font-display"
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinishTour}
                    className="!py-2 !px-4 text-xs font-bold font-display"
                  >
                    <Check size={14} weight="bold" className="mr-1 inline" /> Got It, Let's Search!
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
