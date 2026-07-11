import React, { useRef, useEffect, useState } from 'react'
import { ArrowLeft, BookmarkSimple, DotsThreeVertical, CornersOut, LockKey, LockKeyOpen, ArrowsOut, ArrowsIn, Notebook, Gear, TextAa, Stack, X, MagicWand } from '@phosphor-icons/react';
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
    onGenerateFlashcards,
  } = readerControls || {};

  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  
  const [showFlashcardUI, setShowFlashcardUI] = useState(false);
  const [flashStart, setFlashStart] = useState(pages.current);
  const [flashEnd, setFlashEnd] = useState(Math.min(pages.current + 4, pages.total));
  const [flashError, setFlashError] = useState('');

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
          {/* Bottom Left Controls — Dictionary and Notebook */}
          <div className='flex items-center gap-2 sm:gap-3'>
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

            <button
              className="w-10 h-10 flex shrink-0 items-center justify-center bg-surface-overlay border border-border-default shadow-aura-sm rounded-full transition-all active:scale-90 text-text-primary hover:bg-bg-subtle"
              onClick={(e) => { 
                e.stopPropagation(); 
                setFlashStart(pages.current);
                setFlashEnd(Math.min(pages.current + 4, pages.total));
                setShowFlashcardUI(!showFlashcardUI);
              }}
              title="Generate Flashcards from Book"
            >
              <Stack size={18} weight="bold" className="text-rose-500" />
            </button>
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

        {/* Flashcard Page Selector UI */}
        {showFlashcardUI && (
          <div 
            className="w-full max-w-md bg-surface-overlay border border-border-default shadow-aura-lg rounded-2xl p-4 animate-in slide-in-from-bottom-2 mb-2 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                <Stack size={14} weight="fill" /> 
                Deck from Book
              </h3>
              <button 
                onClick={() => setShowFlashcardUI(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            
            <p className="text-xs text-text-secondary">
              Select the page range to extract flashcards from. (Max 15 pages)
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Start Page</label>
                <input 
                  type="number" 
                  min={1}
                  max={pages.total}
                  value={flashStart}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setFlashStart(val);
                    if (flashEnd - val > 14) {
                      setFlashError('Selection exceeds limit! Please choose a maximum of 15 pages to fit within memory.');
                    } else if (val > flashEnd) {
                      setFlashEnd(val);
                      setFlashError('');
                    } else {
                      setFlashError('');
                    }
                  }}
                  className="bg-bg-subtle border border-border-default rounded-lg px-3 py-1.5 text-sm font-bold text-text-primary focus:outline-none focus:border-rose-500"
                />
              </div>
              
              <div className="text-text-tertiary mt-4">-</div>

              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1">End Page</label>
                <input 
                  type="number" 
                  min={flashStart}
                  max={pages.total}
                  value={flashEnd}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || flashStart;
                    setFlashEnd(val);
                    if (val - flashStart > 14) {
                      setFlashError('Selection exceeds limit! Please choose a maximum of 15 pages to fit within memory.');
                    } else {
                      setFlashError('');
                    }
                  }}
                  className={`bg-bg-subtle border ${flashError ? 'border-red-500' : 'border-border-default'} rounded-lg px-3 py-1.5 text-sm font-bold text-text-primary focus:outline-none ${!flashError && 'focus:border-rose-500'}`}
                />
              </div>
            </div>

            {flashError && (
              <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2 rounded-lg text-center animate-in fade-in">
                {flashError}
              </p>
            )}

            <button
              disabled={!!flashError || flashEnd < flashStart}
              onClick={() => {
                if (onGenerateFlashcards) {
                  onGenerateFlashcards(flashStart, flashEnd);
                  setShowFlashcardUI(false);
                }
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <MagicWand size={16} weight="fill" />
              Craft Flashcards
            </button>
          </div>
        )}

        {/* Real progress bar */}
        
        <div 
          className="progress w-full max-w-md bg-bg-subtle dark:bg-bg-elevated p-4 rounded-3xl shadow-aura-md border border-border-default cursor-pointer"
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