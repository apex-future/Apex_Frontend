import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkSimple, MagnifyingGlass, Sliders, X, Check } from '@phosphor-icons/react';
import BookCard from '../books/BookCard';
import { BookContext } from '../../context/BookContextInstance';
import { NavBarContext } from '../layout/navigation/NavBarContextInstance';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

function BookCardSkeleton() {
  return (
    <Card className="flex flex-row gap-4 p-4">
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
    </Card>
  );
}

export default function AllBooks({ books = [], onBookClick, isSearching, searchQuery = '', setSearchQuery }) {
  const navigate = useNavigate();
  const { booksLoading } = useContext(BookContext) || {};
  const { setIsSearchOpen } = useContext(NavBarContext) || {};
  
  // Local state for filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'favorites', 'in-progress', 'completed', 'unread'
  const [activeSort, setActiveSort] = useState('recent'); // 'recent', 'title-asc', 'title-desc', 'author', 'progress-desc'

  const filterRef = useRef(null);

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
        const getBookRecentTime = (book) => {
          if (!book) return 0;
          const times = [
            book.lastAccessed,
            book.lastReadAt,
            book.last_read_at,
            book.uploadedAt,
            book.uploaded_at
          ]
            .filter(Boolean)
            .map(d => new Date(d).getTime())
            .filter(t => !isNaN(t) && t > 0);
          return times.length > 0 ? Math.max(...times) : 0;
        };
        const dateA = getBookRecentTime(a);
        const dateB = getBookRecentTime(b);
        if (dateB !== dateA) return dateB - dateA; // Newest first
        return (b.id || 0) - (a.id || 0);
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


  return (
    <section className='all-book-section pt-4 pb-10 px-6 sm:px-8 lg:px-12 mt-2 mb-12'>
      <div className="flex justify-between items-center mb-6 relative">
        {/* Title and Counter (Stacked layout, smaller text) */}
        <div className="flex flex-col select-none">
          <h2 className='text-xl sm:text-2xl font-bold font-display text-text-primary tracking-tight leading-tight'>
            {isSearching ? 'Search Results' : 'Your Library'}
          </h2>
          {!booksLoading && (
            <span className="text-xs sm:text-sm text-text-tertiary mt-1 font-medium">
              {processedBooks.length} {processedBooks.length === 1 ? 'Book' : 'Books'}
              {activeFilter !== 'all' && ` (${activeFilter.replace('-', ' ')})`}
            </span>
          )}
        </div>

        {/* Right Corner: Search and Filter Control Center */}
        <div className="flex items-center gap-2">
          {/* Search Button -> Opens Search Drawer */}
          <button
            onClick={() => setIsSearchOpen ? setIsSearchOpen(true) : navigate('/search')}
            className="p-2.5 rounded-full transition-all bg-bg-subtle text-text-secondary hover:text-text-primary hover:scale-105 active:scale-95"
            title="Search Library (Ctrl+K)"
            aria-label="Search Library"
          >
            <MagnifyingGlass size={20} weight="regular" />
          </button>

          {/* Filter Dropdown Container */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-full transition-all ${isFilterOpen || activeFilter !== 'all' || activeSort !== 'recent' ? 'bg-accent-primary text-white shadow-md' : 'bg-bg-subtle text-text-secondary hover:text-text-primary'} hover:scale-105 active:scale-95`}
              title="Filter & Sort"
            >
              <Sliders size={20} weight="regular" />
            </button>

            {/* Dropdown Card */}
            {isFilterOpen && (
              <Card className="absolute right-0 mt-2.5 w-60 sm:w-64 p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 shadow-xl shadow-black/15 dark:shadow-black/50 !hover:scale-100">
                {/* Section: Filter By */}
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
                        className={`text-xs px-2.5 py-1 rounded-full transition-all border ${activeFilter === f.id ? 'bg-accent-primary text-white border-accent-primary font-semibold' : 'bg-black/5 dark:bg-white/5 text-text-secondary border-transparent hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-black/10 dark:bg-white/10 my-3" />

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
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all ${isSelected ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'}`}
                        >
                          <span>{s.label}</span>
                          {isSelected && <Check size={14} weight="bold" className="text-accent-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

      </div>

      {booksLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] max-w-[1400px] gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : (!processedBooks || processedBooks.length === 0) ? (
        isSearching ? (
          <EmptyState
            icon={MagnifyingGlass}
            title="No matching books"
            description="We couldn't find any books matching your search. Try a different title or author."
            className="py-20"
          />
        ) : books.length > 0 ? (
          /* Filtered empty state */
          <EmptyState
            icon={Sliders}
            title="No books found"
            description="No books in your library match the selected filter."
            action={{
              label: 'Clear Filters',
              onClick: () => { setActiveFilter('all'); setActiveSort('recent'); }
            }}
            className="py-20"
          />
        ) : (
          <EmptyState
            icon={BookmarkSimple}
            title="Your library is empty"
            description="Ready to start reading? Upload your first book."
            className="py-20"
          />
        )
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] max-w-[1400px] gap-6 lg:gap-8 transition-all duration-500">
          {processedBooks.map((book, idx) => (
            <div
              key={book.id}
              id={`book-card-${book.id}`}
              data-tour-first-book={idx === 0 ? "true" : undefined}
              className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
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
