import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { BookmarkSimple, MagnifyingGlass, Sliders, X, Check } from '@phosphor-icons/react';
import BookCard from '../books/BookCard';
import { BookContext } from '../../context/BookContextInstance';

function BookCardSkeleton() {
  return (
    <div className="flex flex-row gap-4 p-4 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-2xl shadow-sm">
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

export default function AllBooks({ books = [], onBookClick, isSearching, searchQuery = '', setSearchQuery }) {
  const { booksLoading } = useContext(BookContext) || {};
  
  // Local state for search bar open state and filters
  const [isSearchOpen, setIsSearchOpen] = useState(!!searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'favorites', 'in-progress', 'completed', 'unread'
  const [activeSort, setActiveSort] = useState('recent'); // 'recent', 'title-asc', 'title-desc', 'author', 'progress-desc'

  const searchInputRef = useRef(null);
  const filterRef = useRef(null);

  // Focus input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Sort Logic applied locally
  const processedBooks = useMemo(() => {
    let result = [...books];

    // Filter logic
    if (activeFilter === 'favorites') {
      result = result.filter(b => b.isFavorite);
    } else if (activeFilter === 'in-progress') {
      result = result.filter(b => b.progress > 0 && b.progress < 100);
    } else if (activeFilter === 'completed') {
      result = result.filter(b => b.progress === 100);
    } else if (activeFilter === 'unread') {
      result = result.filter(b => !b.progress || b.progress === 0);
    }

    // Sort logic
    result.sort((a, b) => {
      if (activeSort === 'recent') {
        const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
        const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
        return dateB - dateA; // Newest first
      }
      if (activeSort === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (activeSort === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (activeSort === 'author') {
        return (a.author || '').localeCompare(b.author || '');
      }
      if (activeSort === 'progress-desc') {
        return (b.progress || 0) - (a.progress || 0);
      }
      return 0;
    });

    return result;
  }, [books, activeFilter, activeSort]);

  // Handle toggling search
  const toggleSearch = () => {
    if (isSearchOpen && searchQuery) {
      setSearchQuery('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <section className='all-book-section pt-4 pb-10 px-6 sm:px-8 lg:px-12 mt-2 mb-12'>
      <div className="flex justify-between items-center mb-6 relative">
        {/* Title and Counter (Stacked layout, smaller text) */}
        <div className="flex flex-col select-none">
          <h2 className='text-xl sm:text-2xl font-bold font-display text-text-primary tracking-tight leading-tight'>
            {isSearching ? 'MagnifyingGlass Results' : 'Your Library'}
          </h2>
          {!booksLoading && (
            <span className="text-xs sm:text-sm text-text-tertiary mt-1 font-medium">
              {processedBooks.length} {processedBooks.length === 1 ? 'Book' : 'Books'}
              {activeFilter !== 'all' && ` (${activeFilter.replace('-', ' ')})`}
            </span>
          )}
        </div>

        {/* Right Corner: MagnifyingGlass and Funnel Control Center */}
        <div className="flex items-center gap-2">
          
          {/* Expandable MagnifyingGlass Input Container */}
          <div className="flex items-center">
            <div className={`flex items-center transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-48 sm:w-64 border-accent-primary bg-surface-sunken px-3 py-1.5' : 'w-0 border-transparent bg-transparent overflow-hidden'} border rounded-full relative`}>
              <MagnifyingGlass className={`text-text-placeholder mr-2 ${isSearchOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} size={16} weight="regular" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books..."
                className={`w-full bg-transparent focus:outline-none text-xs sm:text-sm text-text-primary ${isSearchOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-text-tertiary hover:text-text-primary p-0.5 rounded-full"
                >
                  <X size={16} weight="regular" />
                </button>
              )}
            </div>

            {/* Toggle MagnifyingGlass Button */}
            <button
              onClick={toggleSearch}
              className={`p-2.5 rounded-full transition-all ${isSearchOpen ? 'bg-accent-primary/10 text-accent-primary' : 'bg-bg-subtle text-text-secondary hover:text-text-primary'} hover:scale-105 active:scale-95 ml-1`}
              title={isSearchOpen ? "Close MagnifyingGlass" : "MagnifyingGlass Library"}
            >
              {isSearchOpen && !searchQuery ? <X size={18} /> : <MagnifyingGlass size={18} />}
            </button>
          </div>

          {/* Funnel Dropdown Container */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-full transition-all ${isFilterOpen || activeFilter !== 'all' || activeSort !== 'recent' ? 'bg-accent-primary text-white shadow-md' : 'bg-bg-subtle text-text-secondary hover:text-text-primary'} hover:scale-105 active:scale-95`}
              title="Filter & Sort"
            >
              <Sliders size={20} weight="regular" />
            </button>

            {/* Dropdown List */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2.5 w-60 sm:w-64 aura-card-raised p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                {/* Section: Funnel By */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block mb-2">Filter By</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'favorites', label: 'Favorites' },
                      { id: 'in-progress', label: 'Reading' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'unread', label: 'Unread' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setActiveFilter(f.id);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full transition-all border ${activeFilter === f.id ? 'bg-accent-primary text-white border-accent-primary font-semibold' : 'bg-bg-subtle text-text-secondary border-transparent hover:border-border-default hover:text-text-primary'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-default my-3" />

                {/* Section: Sort By */}
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block mb-2">Sort By</span>
                  <div className="space-y-1">
                    {[
                      { id: 'recent', label: 'Recently Read' },
                      { id: 'title-asc', label: 'Title: A to Z' },
                      { id: 'title-desc', label: 'Title: Z to A' },
                      { id: 'author', label: 'Author Name' },
                      { id: 'progress-desc', label: 'Reading Progress' }
                    ].map((s) => {
                      const isSelected = activeSort === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveSort(s.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all ${isSelected ? 'bg-accent-primary/5 text-accent-primary font-bold' : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'}`}
                        >
                          <span>{s.label}</span>
                          {isSelected && <Check size={14} weight="regular" className="text-accent-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {booksLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : (!processedBooks || processedBooks.length === 0) ? (
        isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-card rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-bg-subtle rounded-full flex items-center justify-center mb-6 text-text-tertiary">
              {/* migrated from lucide: MagnifyingGlassMinus */}
              <MagnifyingGlass size={32} />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No matching books</h3>
            <p className="text-text-secondary max-w-xs mx-auto">
              We couldn't find any books matching your search. Try a different title or author.
            </p>
          </div>
        ) : books.length > 0 ? (
          /* Filtered empty state */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-card rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-bg-subtle rounded-full flex items-center justify-center mb-6 text-text-tertiary">
              <SlidersHorizontal size={32} />
            </div>
            <h3 className="text-xl font-display font-bold text-text-primary mb-2">No books found</h3>
            <p className="text-text-secondary max-w-xs mx-auto mb-6">
              No books in your library match the selected filter.
            </p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setActiveSort('recent');
              }}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white text-sm font-medium rounded-full transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface-card rounded-3xl border-2 border-dashed border-border-default animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 text-accent-primary">
              <BookmarkSimple size={32} />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Your library is empty</h3>
            <p className="text-text-secondary max-w-xs mx-auto mb-8">
              Ready to start reading? Upload your first book.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8 transition-all duration-500">
          {processedBooks.map((book) => (
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
