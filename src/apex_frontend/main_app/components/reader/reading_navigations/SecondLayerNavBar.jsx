import React, { useRef, useEffect } from 'react'
import { Menu, RotateCcw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'
import { gsap } from 'gsap'

function SecondLayerNavBar({ visible, setAiModal, setLeftPanel, pdfControls }) {
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
      className='fixed top-0 left-0 right-0 z-50 p-2 w-full pointer-events-auto'
    >
      <div className='flex top-bar pb-4 items-center justify-between w-full'>
        {/* Left: Menu — opens LeftPanel */}
        <div className='left-side'>
          <button
            className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); setLeftPanel(prev => !prev); }}
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Center: Tool buttons */}
        <div className="middle-tool-bar flex items-center justify-center gap-1 bg-bg-elevated shadow-lg rounded-full border border-border-default p-1.5 px-3">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); zoomOut?.(); }}
            title="Zoom Out"
          >
            <ZoomOut strokeWidth={2} size={18} />
          </button>

          {zoomLabel && (
            <span className="text-[11px] font-black text-text-tertiary w-12 text-center tabular-nums select-none font-sans">
              {zoomLabel}
            </span>
          )}

          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); zoomIn?.(); }}
            title="Zoom In"
          >
            <ZoomIn strokeWidth={2} size={18} />
          </button>

          <div className="w-px h-5 border-border-default mx-1" />

          <button
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 text-text-secondary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); rotate?.(); }}
            title="Rotate"
          >
            <RotateCcw strokeWidth={2} size={18} />
          </button>
        </div>

        {/* Right: Sparkles — opens AI panel */}
        <div className='right-side'>
          <button
            className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); setAiModal(prev => !prev); }}
          >
            <Sparkles strokeWidth={2} size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SecondLayerNavBar