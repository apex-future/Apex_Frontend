import React, { useContext } from 'react';
import { Bookmark, SearchX } from 'lucide-react';
import BookCard from '../books/BookCard';
import { BookContext } from '../../context/BookContextInstance';

function BookCardSkeleton() {
  return (
    <div className="flex flex-row gap-4 p-4 bg-card-glass backdrop-blur-md border border-border-default rounded-2xl shadow-sm">
      {/* Cover skeleton */}
      <div className="w-28 h-40 rounded-lg flex-shrink-0 bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
      {/* Info skeleton */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-3/4 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
          <div className="h-3 w-1/2 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
          <div className="mt-3 h-1 w-full rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
          <div className="h-3 w-1/3 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AllBooks({ books = [], onBookClick, isSearching }) {
  const { booksLoading } = useContext(BookContext) || {};

  return (
    <section className='all-book-section py-10 px-6 sm:px-8 lg:px-12   mt-8 mb-12'>
      <div className="flex justify-between items-center mb-6">
        <h2 className='text-2xl font-bold font-display text-text-primary'>
          {isSearching ? 'Search Results' : 'Your Library'}
        </h2>
        {!booksLoading && (
          <span className="text-sm text-text-tertiary bg-bg-subtle px-3 py-1 rounded-full tabular-nums">
            {books.length} {books.length === 1 ? 'Book' : 'Books'}
          </span>
        )}
      </div>

      {booksLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : (!books || books.length === 0) ? (
        isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card-glass rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-text-tertiary">
              <SearchX size={32} />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No matching books</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              We couldn't find any books matching your search. Try a different title or author.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card-glass rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
              <Bookmark size={32} />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Your library is empty</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              Ready to start reading? Upload your first book.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8 transition-all duration-500">
          {books.map((book) => (
            <div key={book.id} className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <BookCard
                book={book}
                onClick={onBookClick}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
