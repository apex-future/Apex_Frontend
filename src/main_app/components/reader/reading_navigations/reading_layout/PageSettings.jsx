import React, { useState } from 'react'
import { X, CaretLeft, ArrowsVertical, ArrowsHorizontal, Gear, SlidersHorizontal, Keyboard, CaretDown } from '@phosphor-icons/react';
import { AnimatePresence } from 'framer-motion';
import useSettingsStore from '../../../../store/settingsStore';
import StreakCelebration from '../../StreakCelebration';

function PageSettings({ setPageSettings, readerControls }) {
  const [activeSection, setActiveSection] = useState(null);
  const [previewStyle, setPreviewStyle] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { scrollOrientation = 'vertical', setScrollOrientation } = readerControls || {};

  const {
    pageAnimations,
    scrollAnimation,
    streakCelebrationEnabled = true,
    streakCelebrationStyle = 'full',
    updateSetting,
  } = useSettingsStore();

  const handleOrientationChange = (orientation) => {
    readerControls?.setScrollOrientation?.(orientation);
    updateSetting('scrollOrientation', orientation);
  };

  const sections = [
    { id: 'orientation', label: 'Scroll Orientation', icon: SlidersHorizontal }
  ];

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[200] bg-bg-subtle dark:bg-bg-elevated md:relative md:inset-auto md:w-80 md:h-full md:border-0 md:shrink-0 font-sans shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-left duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 shrink-0">
        {activeSection ? (
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-base font-bold text-text-primary hover:text-accent-primary transition-colors"
          >
            <CaretLeft size={18} weight="bold" />
            {activeSection === 'orientation' ? 'Scroll Orientation' : 'Gear'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Gear size={18} weight="bold" className="text-text-tertiary" />
            <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">Settings</h2>
          </div>
        )}
        <button
          onClick={() => setPageSettings(false)}
          className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
        >
          <X size={18} weight="bold" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="flex flex-col gap-6">

            {/* Page Animation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">
                  Page Animation
                </h3>
                {/* Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={pageAnimations}
                    onChange={(e) => updateSetting('pageAnimations', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
                </label>
              </div>

              {/* Animation choice boxes — only when pageAnimations is ON */}
              {pageAnimations && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => updateSetting('scrollAnimation', 'slide')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all group ${
                      scrollAnimation === 'slide'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    {/* Slide icon */}
                    <div className="relative w-8 h-6 overflow-hidden rounded">
                      <div className="absolute inset-0 bg-bg-elevated rounded border border-border-default" />
                      <div className="absolute inset-0 translate-x-1 bg-accent-primary/20 rounded border border-accent-primary/40" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">Smooth Slide</span>
                  </button>

                  <button
                    onClick={() => updateSetting('scrollAnimation', 'fade')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all group ${
                      scrollAnimation === 'fade'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    {/* Fade icon */}
                    <div className="relative w-8 h-6">
                      <div className="absolute inset-0 bg-bg-elevated rounded border border-border-default opacity-40" />
                      <div className="absolute inset-0 bg-accent-primary/20 rounded border border-accent-primary/40 opacity-80" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">Fade Through</span>
                  </button>
                </div>
              )}
            </div>

            {/* Scroll Orientation Section */}
            <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
              <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest px-1">Scroll Orientation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOrientationChange('vertical')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all group ${
                    scrollOrientation === 'vertical'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'vertical' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowsVertical size={20} weight="bold" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Up & Down</span>
                </button>

                <button
                  onClick={() => handleOrientationChange('horizontal')}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all group ${
                    scrollOrientation === 'horizontal'
                      ? 'border-accent-primary bg-accent-primary/5 text-accent-primary shadow-sm'
                      : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    scrollOrientation === 'horizontal' ? 'bg-accent-primary text-bg-elevated' : 'bg-bg-elevated text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    <ArrowsHorizontal size={20} weight="bold" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">Left & Right</span>
                </button>
              </div>
            </div>

            {/* Streak Celebration Section */}
            <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">
                    Streak Celebration
                  </h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Show alert when daily streak is kept</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={streakCelebrationEnabled}
                    onChange={(e) => updateSetting('streakCelebrationEnabled', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
                </label>
              </div>

              {/* Celebration Style choices — visible when celebration is enabled */}
              {streakCelebrationEnabled && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      updateSetting('streakCelebrationStyle', 'full');
                      setPreviewStyle('full');
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      streakCelebrationStyle === 'full'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    <span className="text-xs font-bold tracking-tight">Full Celebration</span>
                    <span className="text-[9px] text-text-tertiary text-center">Confetti & modal</span>
                  </button>

                  <button
                    onClick={() => {
                      updateSetting('streakCelebrationStyle', 'subtle');
                      setPreviewStyle('subtle');
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      streakCelebrationStyle === 'subtle'
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-border-default bg-bg-subtle/50 text-text-tertiary hover:border-text-tertiary/20'
                    }`}
                  >
                    <span className="text-xs font-bold tracking-tight">Subtle Banner</span>
                    <span className="text-[9px] text-text-tertiary text-center">Minimal top pill</span>
                  </button>
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Section (Only visible on md and above views) */}
            <div className="hidden md:block space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowShortcuts((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-card hover:bg-bg-subtle border border-border-default transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center transition-transform group-hover:scale-105">
                    <Keyboard size={18} weight="bold" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-text-primary">Keyboard Shortcuts</h3>
                    <p className="text-[10px] text-text-tertiary">Quick navigation & reader actions</p>
                  </div>
                </div>
                <div 
                  className="text-text-tertiary group-hover:text-text-primary transition-transform duration-200" 
                  style={{ transform: showShortcuts ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <CaretDown size={16} weight="bold" />
                </div>
              </button>

              {showShortcuts && (
                <div className="space-y-4 p-3 bg-surface-card border border-border-default rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Navigation */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block mb-2 px-1">
                      Navigation
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Next Page</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">→</kbd>
                          <span className="text-[10px] text-text-tertiary">or</span>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">PgDn</kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Previous Page</span>
                        <div className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">←</kbd>
                          <span className="text-[10px] text-text-tertiary">or</span>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">PgUp</kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Rotate Page</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">R</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Toggle Nav Bar</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">F</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Zoom */}
                  <div className="pt-2 border-t border-border-default">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block mb-2 px-1">
                      Zoom & View
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Zoom In</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">+</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Zoom Out</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">-</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Reset Zoom (100%)</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">0</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Panels & Overlays */}
                  <div className="pt-2 border-t border-border-default">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block mb-2 px-1">
                      Panels & Tools
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Dictionary</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">D</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Cleo (AI)</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">A</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Page Settings</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">S</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">AI Quizzes</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">Q</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-bg-subtle">
                        <span className="text-text-secondary font-medium">Close Active Panel</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-bg-subtle border border-border-default rounded shadow-2xs text-text-primary">Esc</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>

      <AnimatePresence>
        {previewStyle && (
          <StreakCelebration
            streakCount={7}
            streakHistory={[]}
            previewStyle={previewStyle}
            onClose={() => setPreviewStyle(null)}
          />
        )}
      </AnimatePresence>
    </aside>
  )
}

export default PageSettings
