import React, { useRef, useEffect, useState } from 'react'
import { ArrowLeft, BookmarkSimple, DotsThreeVertical, CornersOut, LockKey, LockKeyOpen, ArrowsOut, ArrowsIn, Notebook, Gear, TextAa } from '@phosphor-icons/react';
import { gsap } from 'gsap'

function FirstLayerNavBar({ navigate, onDotsClick, readerControls, onNotebookClick }) {
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
    <div className='absolute inset-0 z-50 flex flex-col justify-between p-2 pr-4 sm:pr-6 pointer-events-none'>
      <div
        ref={topBarRef}
        className='flex top-bar pb-4 items-start sm:items-center justify-between w-full pointer-events-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back and Gear buttons */}
        <div className='flex items-center gap-3 pt-1 sm:pt-0'>
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); setPageSettings?.(true); }}
            className="w-10 h-10 flex items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
          >
            <Gear size={18} weight="bold" />
          </button>
        </div>
        <div className='flex items-start sm:items-center gap-2 sm:gap-3'>
          {/* Bookmark and Dots Wrapper — always side-by-side */}
          <div className='flex flex-row items-center gap-2 sm:gap-3'>
            {/* Page Bookmark button — purple fill when bookmarked */}
            <button
              className={`w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border shadow-sm rounded-full transition-all active:scale-90 hover:bg-white/25 dark:hover:bg-white/10 ${
                isBookmarked
                  ? 'text-accent-primary border-accent-primary/40'
                  : 'text-text-primary border-white/25 dark:border-white/10'
              }`}
              onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(); }}
              title={isBookmarked ? 'Remove page bookmark' : 'Bookmark this page'}
            >
              <BookmarkSimple
                size={18}
                weight={isBookmarked ? "fill" : "bold"}
              />
            </button>

            {/* Dots — open second layer */}
            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
              onClick={onDotsClick}
            >
              <DotsThreeVertical size={18} weight="bold" />
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
          {/* Bottom Left Controls — Dictionary and Notebook */}
          <div className='flex items-center gap-2 sm:gap-3'>
            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); onToggleDictionary?.(); }}
              title="Dictionary Search"
            >
              <TextAa size={18} weight="bold" />
            </button>

            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); onNotebookClick?.(); }}
              title="Notebook"
            >
              <Notebook size={18} weight="bold" />
            </button>
          </div>

          {/* Bottom Right Controls — Lock, Fit-to-screen and Browser Fullscreen */}
          <div className='flex items-end sm:items-center gap-2 sm:gap-3'>
            {/* Lock — toggles pan/scroll lock */}
            <button
              className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all active:scale-90 shadow-sm backdrop-blur-xl border ${
                locked
                  ? 'bg-accent-primary/25 text-accent-primary border-accent-primary/45 hover:bg-accent-primary/35'
                  : 'bg-white/15 dark:bg-white/5 border-white/25 dark:border-white/10 text-text-primary hover:bg-white/25 dark:hover:bg-white/10'
              }`}
              onClick={(e) => { e.stopPropagation(); onToggleLock?.(); }}
              title={locked ? 'LockOpen scroll' : 'Lock scroll'}
            >
              {locked ? (
                <LockKey size={18} weight="bold" />
              ) : (
                <LockKeyOpen size={18} weight="bold" />
              )}
            </button>

            <div className='flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3'>
              {/* Fit-to-screen — resets zoom to 100% */}
              <button
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
                onClick={(e) => { e.stopPropagation(); onResetZoom?.(); }}
                title="Fit to screen (reset zoom)"
              >
                <CornersOut size={18} weight="bold" />
              </button>

              {/* Browser Fullscreen — makes app occupy entire window */}
              <button
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-white/25 dark:hover:bg-white/10"
                onClick={handleFullScreen}
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
              >
                {isFullScreen ? (
                  <ArrowsIn size={18} weight="bold" />
                ) : (
                  <ArrowsOut size={18} weight="bold" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real progress bar */}
        
        <div 
          className="progress w-full max-w-md bg-white/15 dark:bg-white/5 backdrop-blur-xl p-4 rounded-3xl shadow-sm border-t border-white/25 dark:border-white/10 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onProgressBarClick?.(); }}
        >
          
          <div className="text-progress mb-2.5 flex items-center justify-between font-sans">
            <span className="percent text-[11px] font-black uppercase tracking-widest text-text-tertiary">{progress}% Read</span>
            <span className="chapter text-[11px] font-bold text-text-tertiary bg-white/10 dark:bg-white/5 px-2 py-0.5 rounded-full">page {pages.current} of {pages.total}</span>
          </div>
          <div className="progress-bar h-1 rounded-full w-full bg-black/10 dark:bg-white/10 overflow-hidden">
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