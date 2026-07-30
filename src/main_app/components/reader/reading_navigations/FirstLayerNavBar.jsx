import React, { useRef, useEffect, useState } from 'react'
import { ArrowLeft, BookmarkSimple, DotsThreeVertical, CornersOut, LockKey, LockKeyOpen, ArrowsOut, ArrowsIn, Notebook, Gear, TextAa, Sparkle } from '@phosphor-icons/react';
import { gsap } from 'gsap'

function FirstLayerNavBar({ navigate, onDotsClick, readerControls, onNotebookClick, setAiModal }) {
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
    onJumpToPage,
    setLeftPanel: internalSetLeftPanel, // renamed to avoid conflict if any
  } = readerControls || {};

  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const pageInputRef = useRef(null);

  useEffect(() => {
    if (isEditingPage && pageInputRef.current) {
      pageInputRef.current.focus();
    }
  }, [isEditingPage]);

  const handlePageSubmit = (e) => {
    if (e) e.preventDefault();
    const targetPage = parseInt(pageInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= pages.total) {
      onJumpToPage?.(targetPage);
    }
    setIsEditingPage(false);
  };

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
            className="w-10 h-10 flex items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); setPageSettings?.(true); }}
            className="w-10 h-10 flex items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
          >
            <Gear size={18} weight="bold" />
          </button>
        </div>
        <div className='flex items-start sm:items-center gap-2 sm:gap-3'>
          {/* Bookmark and Dots Wrapper — always side-by-side */}
          <div className='flex flex-row items-center gap-2 sm:gap-3'>
            {/* Page Bookmark button — purple fill when bookmarked */}
            <button
              className={`w-10 h-10 flex shrink-0 items-center justify-center shadow-md rounded-full transition-all active:scale-90 ${
                isBookmarked
                  ? 'bg-bg-subtle dark:bg-bg-elevated text-accent-primary border border-accent-primary/40 hover:bg-bg-subtle'
                  : 'bg-bg-subtle dark:bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-subtle'
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
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
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
          {/* Bottom Left Controls — L-shaped helper buttons on mobile, horizontal row on desktop */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3'>
            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
              onClick={(e) => { e.stopPropagation(); setAiModal?.(prev => !prev); }}
              title="AI Tools"
            >
              <Sparkle size={18} weight="fill" />
            </button>

            <div className='flex flex-row items-center gap-2 sm:gap-3'>
              <button
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
                onClick={(e) => { e.stopPropagation(); onToggleDictionary?.(); }}
                title="Dictionary Search"
              >
                <TextAa size={18} weight="bold" />
              </button>

              <button
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
                onClick={(e) => { e.stopPropagation(); onNotebookClick?.(); }}
                title="Notebook"
              >
                <Notebook size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Bottom Right Controls — Lock, Fit-to-screen and Browser Fullscreen */}
          <div className='flex items-end sm:items-center gap-2 sm:gap-3'>
            {/* Lock — toggles pan/scroll lock */}
            <button
              className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-full transition-all active:scale-90 shadow-md border ${
                locked
                  ? 'bg-accent-primary/25 text-accent-primary border-accent-primary/45 hover:bg-accent-primary/35'
                  : 'bg-bg-subtle dark:bg-bg-elevated border-border-default text-text-primary hover:bg-bg-subtle'
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
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
                onClick={(e) => { e.stopPropagation(); onResetZoom?.(); }}
                title="Fit to screen (reset zoom)"
              >
                <CornersOut size={18} weight="bold" />
              </button>

              {/* Browser Fullscreen — makes app occupy entire window */}
              <button
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-bg-subtle dark:bg-bg-elevated border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
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
          className="progress w-full max-w-md bg-bg-subtle dark:bg-bg-elevated p-4 rounded-3xl shadow-aura-md border border-border-default cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onProgressBarClick?.(); }}
        >
          
          <div className="text-progress mb-2.5 flex items-center justify-between font-sans">
            <span className="percent text-[11px] font-black uppercase tracking-widest text-text-tertiary">{progress}% Read</span>
            <div 
              className="chapter text-[11px] font-bold text-text-tertiary bg-white/10 dark:bg-white/5 px-2 py-0.5 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPage(true);
                setPageInput(pages.current.toString());
              }}
            >
              {isEditingPage ? (
                <form 
                  onSubmit={handlePageSubmit}
                  className="inline-flex items-center m-0"
                >
                  <input
                    ref={pageInputRef}
                    type="number"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageSubmit}
                    className="w-10 bg-transparent text-center text-text-primary outline-none border-b border-accent-primary"
                    min={1}
                    max={pages.total}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingPage(false);
                      }
                    }}
                  />
                  <span className="ml-1">of {pages.total}</span>
                </form>
              ) : (
                <span>page {pages.current} of {pages.total}</span>
              )}
            </div>
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