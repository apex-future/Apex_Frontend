import React from 'react'
import BookCover from '../../books/BookCover'

/**
 * Shelf Component:
 * Renders a collection of shelves, where each shelf displays its top 3 book covers (or placeholders).
 * Applies a signature tilted layout for the book covers and shows shelf metadata.
 */
function Shelf({ shelves }) {
  // If no shelves data is provided or the array is empty, render nothing to avoid layout shifts.
  if (!shelves || shelves.length === 0) return null;

  return (
    // Main Container: A responsive grid displaying each shelf as a separate card.
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 py-8'>
      {shelves.map((shelf, index) => {
        const actualBooksCount = shelf.books?.length || 0;
        const fillersCount = Math.max(0, 3 - actualBooksCount);
        
        return (
          <div key={index} className='group flex flex-col border-2 border-border-default rounded-3xl bg-neutral-100/40 relative h-64 transition-all duration-500 overflow-hidden'>
            
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
                    className={`w-24 h-32 rounded-sm bg-neutral-200/60 relative overflow-hidden shadow-inner border border-neutral-300/30 flex flex-col p-2 gap-2 transition-all duration-500 ${
                      absoluteIndex === 0 
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
    </div>
  );
}

export default Shelf;