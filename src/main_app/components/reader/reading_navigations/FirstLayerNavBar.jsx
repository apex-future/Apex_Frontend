import React, { useRef, useEffect, useState } from 'react'
import { ArrowLeft, Bookmark, EllipsisVertical, Fullscreen, Lock, LockOpen, Maximize, Minimize, Settings, WholeWord } from 'lucide-react'
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
    onProgressBarClick,
    onToggleDictionary,
    setPageSettings,
    setLeftPanel: internalSetLeftPanel, // renamed to avoid conflict if any
  } = readerControls || {};

  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);

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

    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleFullScreen = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex flex-col justify-between p-2 pr-4 sm:pr-6 pointer-events-none'>
      <div
        ref={topBarRef}
        className='flex top-bar pb-4 items-start sm:items-center justify-between w-full pointer-events-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back and Settings buttons */}
        <div className='flex items-center gap-3 pt-1 sm:pt-0'>
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); setPageSettings?.(true); }}
            className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
          >
            <Settings size={18} strokeWidth={2} />
          </button>
        </div>
        <div className='flex items-start sm:items-center gap-2 sm:gap-3'>
          {/* Dictionary search button */}
          <button
            className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
            onClick={(e) => { e.stopPropagation(); onToggleDictionary?.(); }}
            title="Dictionary Search"
          >
            <WholeWord strokeWidth={2} size={18} />
          </button>

          {/* Bookmark and Dots Wrapper */}
          <div className='flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3'>
            {/* Page Bookmark button — purple fill when bookmarked */}
            <button
              className={`w-10 h-10 flex shrink-0 items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 ${
                isBookmarked
                  ? 'text-accent-primary'
                  : 'text-text-primary hover:bg-bg-subtle'
              }`}
              onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(); }}
              title={isBookmarked ? 'Remove page bookmark' : 'Bookmark this page'}
            >
              <Bookmark
                strokeWidth={2}
                size={18}
                className={`transition-all duration-200 ${isBookmarked ? 'fill-accent-primary' : 'fill-none'}`}
              />
            </button>

            {/* Dots — open second layer */}
            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
              onClick={onDotsClick}
            >
              <EllipsisVertical strokeWidth={2} size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={bottomBarRef}
        className="bottom-bar flex flex-col gap-4 items-center pointer-events-auto w-full px-2 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-end sm:items-center justify-between w-full'>
          {/* Lock — toggles pan/scroll lock */}
          <button
            className={`w-10 h-10 flex items-center justify-center shadow-md rounded-full transition-all active:scale-90 ${locked
              ? 'bg-accent-primary text-bg-elevated'
              : 'bg-bg-elevated text-text-primary hover:bg-bg-subtle'
              }`}
            onClick={(e) => { e.stopPropagation(); onToggleLock?.(); }}
            title={locked ? 'Unlock scroll' : 'Lock scroll'}
          >
            {locked
              ? <Lock strokeWidth={2} size={18} />
              : <LockOpen strokeWidth={2} size={18} />
            }
          </button>

          {/* Bottom Right Controls — Fit-to-screen and Browser Fullscreen */}
          <div className='flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3'>
            {/* Fit-to-screen — resets zoom to 100% */}
            <button
              className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
              onClick={(e) => { e.stopPropagation(); onResetZoom?.(); }}
              title="Fit to screen (reset zoom)"
            >
              <Fullscreen strokeWidth={2} size={18} />
            </button>

            {/* Browser Fullscreen — makes app occupy entire window */}
            <button
              className="w-10 h-10 flex items-center justify-center bg-bg-elevated shadow-md rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
              onClick={handleFullScreen}
              title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              {isFullScreen ? (
                <Minimize strokeWidth={2} size={18} />
              ) : (
                <Maximize strokeWidth={2} size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Real progress bar */}
        
        <div 
          className="progress w-full max-w-md bg-white/80 dark:bg-black/80 backdrop-blur-lg p-4 rounded-3xl shadow-md border-2 border-border-default cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onProgressBarClick?.(); }}
        >
          
          <div className="text-progress mb-2.5 flex items-center justify-between font-sans">
            <span className="percent text-[11px] font-black uppercase tracking-widest text-text-tertiary">{progress}% Read</span>
            <span className="chapter text-[11px] font-bold text-text-tertiary bg-bg-subtle px-2 py-0.5 rounded-full">page {pages.current} of {pages.total}</span>
          </div>
          <div className="progress-bar h-1 rounded-full w-full bg-bg-subtle overflow-hidden">
            <div
              className="progress-fill h-full rounded-full bg-accent-primary transition-all duration-700 ease-out shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        
        </div>
          <div className=" text-center -mt-2">
            <span className="text-[10px] font-bold text-text-tertiary/60 uppercase tracking-widest ">Click to paginate</span>
          </div>
      </div>
    </div>
  )
}

export default FirstLayerNavBar