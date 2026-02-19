import React, { useRef, useEffect } from 'react'
import { ArrowLeft, Bookmark, EllipsisVertical, Fullscreen, Lock } from 'lucide-react'
import { gsap } from 'gsap'

function FirstLayerNavBar({ navigate, onDotsClick }) {
  const topBarRef = useRef(null);
  const bottomBarRef = useRef(null);

  useEffect(() => {
    // Top bar bounces in from above
    if (topBarRef.current) {
      gsap.killTweensOf(topBarRef.current);
      gsap.fromTo(
        topBarRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
    // Bottom bar bounces in from below
    if (bottomBarRef.current) {
      gsap.killTweensOf(bottomBarRef.current);
      gsap.fromTo(
        bottomBarRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  return (
    <div className='absolute top-0 left-0 right-0 z-50 flex flex-col justify-between p-2 w-full h-screen pointer-events-none'>
      <div
        ref={topBarRef}
        className='flex top-bar pb-4 items-center justify-between w-full pointer-events-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <button onClick={() => navigate('/')} className="p-2.5 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className='left-side flex items-center gap-2'>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Bookmark strokeWidth={1.5} size={20} />
          </button>
          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={onDotsClick}
          >
            <EllipsisVertical strokeWidth={1.5} size={20} />
          </button>
        </div>
      </div>

      <div
        ref={bottomBarRef}
        className="bottom-bar flex flex-col gap-2 items-center pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between w-full'>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Lock strokeWidth={1.5} size={20} />
          </button>
          <button className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'>
            <Fullscreen strokeWidth={1.5} size={20} />
          </button>
        </div>
        <div className="progress w-[90%]">
          <div className="text-progress mb-2 flex items-center justify-between">
            <span className="percent text-sm">50%</span>
            <span className="chapter text-sm">page 1 of 10</span>
          </div>
          <div className="progress-bar h-1.5 rounded-full w-full bg-accent-subtle">
            <div className="progress-fill h-1.5 rounded-full w-[50%] bg-accent-primary"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirstLayerNavBar