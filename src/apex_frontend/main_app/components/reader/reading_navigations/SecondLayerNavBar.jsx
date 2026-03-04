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
      className='absolute top-0 left-0 right-0 z-50 p-2 w-full pointer-events-auto'
    >
      <div className='flex top-bar pb-4 items-center justify-between w-full'>
        {/* Left: Menu — opens LeftPanel */}
        <div className='left-side'>
          <button
            className="p-2.5 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700"
            onClick={(e) => { e.stopPropagation(); setLeftPanel(prev => !prev); }}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Center: Tool buttons */}
        <div className="middle-tool-bar flex items-center justify-center gap-1 bg-neutral-300/70 backdrop-blur-md rounded-xl border-2 p-2">
          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={(e) => { e.stopPropagation(); zoomOut?.(); }}
            title="Zoom Out"
          >
            <ZoomOut strokeWidth={1.5} size={20} />
          </button>

          {zoomLabel && (
            <span className="text-[11px] font-bold text-gray-600 w-10 text-center tabular-nums select-none">
              {zoomLabel}
            </span>
          )}

          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={(e) => { e.stopPropagation(); zoomIn?.(); }}
            title="Zoom In"
          >
            <ZoomIn strokeWidth={1.5} size={20} />
          </button>

          <div className="w-px h-5 bg-gray-400/40 mx-1" />

          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={(e) => { e.stopPropagation(); rotate?.(); }}
            title="Rotate"
          >
            <RotateCcw strokeWidth={1.5} size={20} />
          </button>
        </div>

        {/* Right: Sparkles — opens AI panel */}
        <div className='right-side'>
          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={(e) => { e.stopPropagation(); setAiModal(prev => !prev); }}
          >
            <Sparkles strokeWidth={1.5} size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SecondLayerNavBar