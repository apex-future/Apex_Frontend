import React, { useRef, useEffect } from 'react'
import { Menu, RotateCcw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'
import { gsap } from 'gsap'

function SecondLayerNavBar({ visible }) {
  const navRef = useRef(null);

  useEffect(() => {
    if (visible && navRef.current) {
      // Kill any in-progress animation and restart clean
      gsap.killTweensOf(navRef.current);
      gsap.fromTo(
        navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={navRef}
      // Stop clicks on the nav bar itself from bubbling up to ReaderView's handler
      onClick={(e) => e.stopPropagation()}
      className='absolute top-0 left-0 right-0 z-50 p-2 w-full pointer-events-auto'
    >
      <div className='flex top-bar pb-4 items-center justify-between w-full'>
        {/* Left: Menu */}
        <div className='left-side'>
          <button className="p-2.5 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700">
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Center: Tool buttons */}
        <div className="middle-tool-bar flex items-center justify-center gap-4 bg-neutral-300/70 backdrop-blur-md rounded-xl p-2">
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <ZoomIn strokeWidth={1.5} size={20} />
          </button>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <ZoomOut strokeWidth={1.5} size={20} />
          </button>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <RotateCcw strokeWidth={1.5} size={20} />
          </button>
        </div>

        {/* Right: Sparkles */}
        <div className='right-side'>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Sparkles strokeWidth={1.5} size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SecondLayerNavBar