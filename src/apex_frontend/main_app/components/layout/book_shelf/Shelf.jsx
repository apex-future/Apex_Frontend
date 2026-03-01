import React, { useState } from 'react'
import { X, BookOpen } from 'lucide-react'
import BookCover from '../../books/BookCover'
import BookCard from '../../books/BookCard'

/**
 * Shelf Component:
 * Renders a collection of shelves, where each shelf displays its top 3 book covers (or placeholders).
 * Applies a signature tilted layout for the book covers and shows shelf metadata.
 */
function Shelf({ shelves }) {
  const [selectedShelf, setSelectedShelf] = useState(null);

  // If no shelves data is provided or the array is empty, render nothing to avoid layout shifts.
  if (!shelves || shelves.length === 0) return null;

  return (
    // Main Container: A responsive grid displaying each shelf as a separate card.
    <div className='grid w-full  grid-cols-[repeat(auto-fill,minmax(min(90%,360px),1fr))] gap-8 lg:gap-10 py-8'>
      {shelves.map((shelf, index) => {
        const actualBooksCount = shelf.books?.length || 0;
        const fillersCount = Math.max(0, 3 - actualBooksCount);

        return (
          <div onClick={() => setSelectedShelf(shelf)} key={index} className='group flex flex-col border-2 border-border-default rounded-3xl bg-neutral-100/40 relative h-64 transition-all duration-500 overflow-hidden cursor-pointer hover:border-accent-primary/30 hover:shadow-xl hover:shadow-accent-primary/5'>

            {/* Book Stack Container: Positioned behind the info panel with a more subtle pop-up */}
            <div className="shelf-img-container flex gap-2 items-center justify-center absolute inset-x-0 bottom-20 z-0 transition-transform duration-500 ease-out group-hover:-translate-y-8">

              {/* 1. Actual Books */}
              {shelf.books?.slice(0, 3).map((book, bIndex) => {
                const rotationClasses = bIndex === 0
                  ? '-rotate-6 group-hover:-rotate-9 group-hover:-translate-x-2'
                  : bIndex === 1
                    ? 'rotate-0 group-hover:scale-105'
                    : 'rotate-6 group-hover:rotate-9 group-hover:translate-x-2';

                return book.cover ? (
                  <img
                    key={`book-${book.id}`}
                    src={book.cover}
                    alt={book.title}
                    className={`object-cover w-24 h-32 rounded-sm shadow-md border border-white/20 transition-all duration-500 ${rotationClasses}`}
                  />
                ) : (
                  <BookCover
                    key={`book-${book.id}`}
                    title={book.title}
                    author={book.author}
                    className={`w-24 h-32 rounded-sm shadow-md border border-white/20 transition-all duration-500 ${rotationClasses}`}
                  />
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
            <div className="shelf-info absolute inset-x-0 bottom-0 z-10 h-32 rounded-3xl p-6 bg-white/60 backdrop-blur-xl border-t-2 border-white/40 flex flex-col justify-end transition-all duration-500 group-hover:bg-white/80 group-hover:shadow-2xl group-hover:shadow-neutral-400/20">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">Shelf Collection</h5>
                <span className="text-[10px] font-bold bg-accent-subtle/50 px-3 py-1 rounded-full text-accent-pressed shadow-sm">
                  {actualBooksCount} {actualBooksCount === 1 ? 'Book' : 'Books'}
                </span>
              </div>
              <h3 className='font-display text-2xl text-text-primary text-center font-bold tracking-tightest leading-premium-tight'>{shelf.shelfName}</h3>
            </div>

          </div>
        );
      })}

      {/* Modal Popup for Selected Shelf */}
      {selectedShelf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300" onClick={() => setSelectedShelf(null)}>
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-neutral-50/50">
              <div>
                <h2 className="text-2xl font-bold font-display text-text-primary">{selectedShelf.shelfName}</h2>
                <p className="text-sm text-text-tertiary mt-1">{selectedShelf.books?.length || 0} {selectedShelf.books?.length === 1 ? 'book' : 'books'} in this shelf</p>
              </div>
              <button onClick={() => setSelectedShelf(null)} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm cursor-pointer border border-gray-100">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {selectedShelf.books?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {selectedShelf.books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <BookOpen className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Empty Shelf</h3>
                  <p className="text-gray-400 mt-2 max-w-xs text-sm">Books will appear here when you add them to this shelf.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shelf;