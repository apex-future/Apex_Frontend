import React, { useRef, useEffect } from 'react'
import { ArrowLeft, Bookmark, EllipsisVertical, Fullscreen, Lock, LockOpen } from 'lucide-react'
import { gsap } from 'gsap'

function FirstLayerNavBar({ navigate, onDotsClick, readerControls }) {
  const topBarRef = useRef(null);
  const bottomBarRef = useRef(null);

  const {
    locked = false,
    onToggleLock,
    onResetZoom,
    progress = 0,
    pages = { current: 1, total: 1 },
    isBookmarked = false,
    onToggleBookmark,
  } = readerControls || {};

  useEffect(() => {
    if (topBarRef.current) {
      gsap.killTweensOf(topBarRef.current);
      gsap.fromTo(
        topBarRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
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
    <div className='absolute top-0 left-0 right-0 z-50 flex flex-col justify-between p-2 w-full max-h-screen pointer-events-none'>
      <div
        ref={topBarRef}
        className='flex top-bar pb-4 items-center justify-between w-full pointer-events-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back button */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="p-2.5 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className='flex items-center gap-2'>
          {/* Bookmark button — purple fill when bookmarked */}
          <button
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isBookmarked
                ? 'text-accent-primary'
                : 'hover:bg-white/60 text-gray-700'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(); }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          >
            <Bookmark
              strokeWidth={1.5}
              size={20}
              className={`transition-all duration-200 ${isBookmarked ? 'fill-accent-primary' : 'fill-none'}`}
            />
          </button>

          {/* Dots — open second layer */}
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
          {/* Lock — toggles pan/scroll lock */}
          <button
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              locked
                ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                : 'hover:bg-white/60 text-gray-700'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleLock?.(); }}
            title={locked ? 'Unlock scroll' : 'Lock scroll'}
          >
            {locked
              ? <Lock strokeWidth={1.5} size={20} />
              : <LockOpen strokeWidth={1.5} size={20} />
            }
          </button>

          {/* Fit-to-screen — resets zoom to 100% */}
          <button
            className='p-2 hover:bg-white/60 rounded-xl transition-all active:scale-95 text-gray-700'
            onClick={(e) => { e.stopPropagation(); onResetZoom?.(); }}
            title="Fit to screen (reset zoom)"
          >
            <Fullscreen strokeWidth={1.5} size={20} />
          </button>
        </div>

        {/* Real progress bar */}
        <div className="progress w-[90%]">
          <div className="text-progress mb-2 flex items-center justify-between">
            <span className="percent text-sm">{progress}%</span>
            <span className="chapter text-sm">page {pages.current} of {pages.total}</span>
          </div>
          <div className="progress-bar h-1.5 rounded-full w-full bg-accent-subtle">
            <div
              className="progress-fill h-1.5 rounded-full bg-accent-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirstLayerNavBar