import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Heart, Bookmark, Trash2, X } from 'lucide-react'
import BookCover from '../../books/BookCover'
import useSpaceStore from '../../../store/spaceStore'
import useThemeStore from '../../../store/themeStore'
import { showToastGlobal } from '../../../hooks/useToast'

/**
 * Shelf Component:
 * Renders a collection of shelves, where each shelf displays its top 3 book covers (or placeholders).
 * Applies a signature tilted layout for the book covers and shows shelf metadata.
 */
function Shelf({ shelves }) {
  const navigate = useNavigate();
  const { deleteSpace } = useSpaceStore();
  const { resolvedTheme } = useThemeStore();
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState(null);

  // If no shelves data is provided or the array is empty, render nothing to avoid layout shifts.
  if (!shelves || shelves.length === 0) return null;

  const handleDeleteClick = (e, shelf) => {
    e.stopPropagation();
    if (shelf.isSystem) {
      showToastGlobal("System spaces cannot be deleted.", "info");
      return;
    }
    setShelfToDelete(shelf);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (shelfToDelete) {
      deleteSpace(shelfToDelete.id);
      showToastGlobal(`"${shelfToDelete.name}" space removed.`, "success");
      setIsDeleteModalOpen(false);
      setShelfToDelete(null);
    }
  };

  const renderDeleteModal = () => {
    if (!isDeleteModalOpen || !shelfToDelete) return null;

    return createPortal(
      <div className={`fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ${resolvedTheme}`}>
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsDeleteModalOpen(false)}
        />
        <div className="relative w-full max-w-md bg-bg-elevated/95 backdrop-blur-2xl rounded-[2.5rem] border-2 border-border-default shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="size-16 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mb-6">
            <Trash2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">Delete Space?</h2>
          <p className="text-sm font-bold text-text-tertiary mb-8">
            This will permanently remove the <span className="text-text-primary">"{shelfToDelete.name}"</span> space. 
            Books within this space will not be deleted from your library.
          </p>
          
          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={confirmDelete}
              className="w-full py-4 font-black text-white bg-red-500 rounded-3xl shadow-xl shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Yes, Delete
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full py-4 font-black text-text-secondary bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border-2 border-border-default rounded-3xl"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
    {/* Main Container: A responsive grid displaying each shelf as a separate card. */}
    <div className='grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-8 lg:gap-10 py-8 transition-all duration-300'>
      {shelves.map((shelf, index) => {
        const actualBooksCount = shelf.books?.length || 0;
        const fillersCount = Math.max(0, 3 - actualBooksCount);

        return (
          <div
            onClick={() => navigate(`/space/${shelf.id}`)}
            key={index}
            className='group flex flex-col border-2 border-border-default rounded-card bg-neutral-100/40 relative h-64 transition-all duration-500 overflow-hidden cursor-pointer hover:border-accent-primary/30 hover:shadow-xl hover:shadow-accent-primary/5'
          >

            {/* Book Stack Container: Positioned behind the info panel with a more subtle pop-up */}
            <div className="shelf-img-container flex gap-2 items-center justify-center absolute inset-x-0 bottom-20 z-0 transition-transform duration-500 ease-out group-hover:-translate-y-8">

              {/* 1. Actual Books */}
              {shelf.books?.slice(0, 3).map((book, bIndex) => {
                const rotationClasses = bIndex === 0
                  ? '-rotate-6 group-hover:-rotate-9 group-hover:-translate-x-2'
                  : bIndex === 1
                    ? 'rotate-0 group-hover:scale-105'
                    : 'rotate-6 group-hover:rotate-9 group-hover:translate-x-2';

                return (
                  <div key={`book-${book.id}`} className={`relative transition-all duration-500 ${rotationClasses}`}>
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="object-cover w-24 h-32 rounded-sm shadow-md border border-white/20"
                      />
                    ) : (
                      <BookCover
                        title={book.title}
                        author={book.author}
                        className="w-24 h-32 rounded-sm shadow-md border border-white/20"
                      />
                    )}

                    {/* Status Indicators */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                      {book.isFavorite && (
                        <div className="bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                          <Heart size={8} fill="currentColor" />
                        </div>
                      )}
                      {book.isBookmarked && (
                        <div className="bg-accent-primary text-white rounded-full p-0.5 shadow-sm">
                          <Bookmark size={8} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 2. Filler/Skeleton Books */}
              {Array.from({ length: fillersCount }).map((_, fIndex) => {
                const absoluteIndex = actualBooksCount + fIndex;
                return (
                  <div
                    key={`filler-${index}-${fIndex}`}
                    className={`w-24 h-32 rounded-sm bg-neutral-200/60 relative overflow-hidden shadow-inner border border-neutral-300/30 flex flex-col p-2 gap-2 transition-all duration-500 ${absoluteIndex === 0
                      ? '-rotate-6 group-hover:-rotate-9 group-hover:-translate-x-2'
                      : absoluteIndex === 1
                        ? 'rotate-0 group-hover:scale-105'
                        : 'rotate-6 group-hover:rotate-9 group-hover:translate-x-2'
                      }`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-300/50" />
                    <div className="h-2 w-3/4 bg-neutral-300/40 rounded-full" />
                    <div className="h-2 w-1/2 bg-neutral-300/40 rounded-full" />
                    <div className="mt-auto h-12 w-full bg-neutral-300/20 rounded-sm border border-neutral-300/10" />
                  </div>
                );
              })}
            </div>

            {/* Shelf Info: The "Glass" front panel */}
            <div className="shelf-info absolute inset-x-0 bottom-0 z-10 h-32 rounded-card p-6 bg-white/10 dark:bg-card-glass/80 backdrop-blur-xl border-t-2 border-white/40 flex flex-col justify-end transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-neutral-400/20">
              <div className="flex justify-between items-center mb-2">
                <div /> {/* Placeholder for left side */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold bg-accent-subtle px-3 py-1 rounded-full text-black/80 dark:text-white/80 shadow-sm">
                    {actualBooksCount} {actualBooksCount === 1 ? 'Book' : 'Books'}
                  </span>
                  {!shelf.isSystem && (
                    <button 
                      onClick={(e) => handleDeleteClick(e, shelf)}
                      className="p-1.5 hover:bg-red-500/10 text-text-tertiary hover:text-red-500 rounded-lg transition-all"
                      title="Delete Space"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className='font-display text-2xl text-text-primary text-center font-bold tracking-tightest leading-premium-tight'>{shelf.shelfName}</h3>
            </div>

          </div>
        );
      })}
    </div>
    {renderDeleteModal()}
    </>
  );
}

export default Shelf;