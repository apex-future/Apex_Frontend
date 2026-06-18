import React, { useRef, useEffect } from 'react'
import { List, ArrowCounterClockwise, Sparkle, MagnifyingGlassPlus, MagnifyingGlassMinus, Brain } from '@phosphor-icons/react';
import { gsap } from 'gsap'

function SecondLayerNavBar({ visible, setAiModal, setQuizModal, setLeftPanel, pdfControls }) {
  const navRef = useRef(null);

  useEffect(() => {
    if (visible && navRef.current) {
      gsap.killTweensOf(navRef.current);
      gsap.fromTo(
        navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [visible]);

  if (!visible) return null;

  const { zoomIn, zoomOut, rotate, scale } = pdfControls || {};
  const zoomLabel = scale != null ? `${Math.round(scale * 100)}%` : null;

  return (
    <div
      ref={navRef}
      onClick={(e) => e.stopPropagation()}
      className='absolute top-0 left-0 right-0 z-50 p-2 pr-4 sm:pr-6 pointer-events-auto'
    >
      <div className='flex top-bar pb-4 items-start sm:items-center justify-between w-full'>
        {/* Left: Menu — opens LeftPanel */}
        <div className='left-side pt-1 sm:pt-0'>
          <button
            className="w-10 h-10 flex items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setLeftPanel(prev => !prev); }}
          >
            <List size={18} weight="bold" />
          </button>
        </div>

        {/* Center: Tool buttons */}
        <div className="middle-tool-bar flex items-center justify-center gap-1 bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full p-1.5 px-3">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-white/20 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); zoomOut?.(); }}
            title="Zoom Out"
          >
            <MagnifyingGlassMinus size={18} weight="bold" />
          </button>

          {zoomLabel && (
            <span className="text-[11px] font-black text-text-tertiary w-12 text-center tabular-nums select-none font-sans">
              {zoomLabel}
            </span>
          )}

          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-white/20 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); zoomIn?.(); }}
            title="Zoom In"
          >
            <MagnifyingGlassPlus size={18} weight="bold" />
          </button>

          <div className="w-px h-5 bg-white/25 dark:bg-white/10 mx-1" />

          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-white/20 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); rotate?.(); }}
            title="Rotate"
          >
            <ArrowCounterClockwise size={18} weight="bold" />
          </button>
        </div>

        {/* Right: Sparkles & Quiz — opens AI and Quiz panels */}
        <div className='flex flex-col sm:flex-row gap-2 right-side items-center'>
          <button
            className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setAiModal(prev => !prev); }}
            title="AI Tools"
          >
            <Sparkle size={18} weight="fill" />
          </button>
          <button
            className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setQuizModal(prev => !prev); }}
            title="Quiz Generation Settings"
          >
            <Brain size={18} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SecondLayerNavBar