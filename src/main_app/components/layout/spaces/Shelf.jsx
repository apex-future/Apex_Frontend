import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash } from '@phosphor-icons/react';
import BookCover from '../../ui/BookCover'
import Modal from '../../ui/Modal'
import useSpaceStore from '../../../store/spaceStore'
import { showToastGlobal } from '../../../hooks/useToast'

/**
 * Shelf Component:
 * Renders a collection of shelves, where each shelf displays its top 3 book covers (or placeholders).
 * Applies a signature tilted layout for the book covers and shows shelf metadata.
 */
function Shelf({ shelves }) {
  const navigate = useNavigate();
  const { deleteSpace } = useSpaceStore();
  
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
      showToastGlobal(`"${shelfToDelete.name || shelfToDelete.shelfName || 'Space'}" removed.`, "success");
      setIsDeleteModalOpen(false);
      setShelfToDelete(null);
    }
  };

  const renderDeleteModal = () => {
    return (
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Space?"
        message={`This will permanently remove the "${shelfToDelete?.name || shelfToDelete?.shelfName || 'this'}" space. Books within this space will not be deleted from your library.`}
        actions={[
          {
            label: 'Yes, Delete',
            variant: 'danger',
            onClick: confirmDelete,
          },
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => setIsDeleteModalOpen(false),
          }
        ]}
      />
    );
  };

  return (
    <>
    {/* Main Container: A responsive grid displaying each shelf as a separate card. */}
    <div className='grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] max-w-[1400px] gap-8 lg:gap-10 py-8 transition-all duration-300'>
      {shelves.map((shelf, index) => {
        const actualBooksCount = shelf.books?.length || 0;
        const fillersCount = Math.max(0, 3 - actualBooksCount);

        return (
          <div
            onClick={() => navigate(`/space/${shelf.id}`)}
            key={index}
            className='group flex flex-col border-t border-black/10 dark:border-white/10 rounded-card bg-bg-subtle/80 dark:bg-bg-elevated/80 backdrop-blur-md relative h-64 transition-all duration-500 overflow-hidden cursor-pointer shadow-sm hover:shadow-md'
          >

            {/* Book Stack Container: Positioned behind the info panel with a more subtle pop-up */}
            <div className="shelf-img-container flex gap-2 items-center justify-center absolute inset-x-0 bottom-20 z-0 transition-transform duration-500 ease-out group-hover:-translate-y-8">

              {/* 1. Actual Books */}
              {(shelf.books || []).slice(0, 3).map((book, bIndex) => {
                const rotationClasses = bIndex === 0
                  ? '-rotate-6 group-hover:-rotate-9 group-hover:-translate-x-2'
                  : bIndex === 1
                    ? 'rotate-0 group-hover:scale-105'
                    : 'rotate-6 group-hover:rotate-9 group-hover:translate-x-2';

                return (
                  <div key={`book-${book.id}`} className={`relative transition-all duration-500 ${rotationClasses}`}>
                    <BookCover
                      book={book}
                      className="w-24 h-32 rounded-sm shadow-md"
                      badge={book.isFavorite && (
                        <div className="bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                          <Heart size={8} weight="fill" />
                        </div>
                      )}
                    />
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
                      <Trash size={16} weight="bold" />
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