import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlass, 
  ArrowLeft, 
  X, 
  ClockCounterClockwise, 
  Trash, 
  Sparkle,
  BookmarkSimple,
  SlidersHorizontal,
  BookOpen
} from '@phosphor-icons/react';
import { BookContext } from '../context/BookContextInstance';
import BookCard from '../components/books/BookCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const SEARCH_HISTORY_KEY = 'apex_book_search_history';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { books = [], booksLoading, handleBookClick } = useContext(BookContext) || {};
  
  const [query, setQuery] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'in-progress', 'completed', 'favorites', 'pdf', 'epub'
  const inputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load search history', err);
    }
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sync query state with URL query param if present
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  // Save term to search history
  const addTermToHistory = (term) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 12);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Remove single term from search history
  const removeHistoryItem = (e, itemToRemove) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== itemToRemove);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Clear all search history
  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {}
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      addTermToHistory(query);
    }
  };

  const handleSelectHistoryItem = (term) => {
    setQuery(term);
    addTermToHistory(term);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBookNavigate = (bookId) => {
    if (query.trim()) {
      addTermToHistory(query);
    }
    if (handleBookClick) {
      handleBookClick(bookId);
    }
    navigate(`/reader/${bookId}`);
  };

  // Filter books according to query and selected category
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...books];

    // Category filter
    if (activeCategory === 'favorites') {
      list = list.filter(b => b.isFavorite);
    } else if (activeCategory === 'in-progress') {
      list = list.filter(b => b.progress > 0 && b.progress < 100);
    } else if (activeCategory === 'completed') {
      list = list.filter(b => b.progress === 100);
    } else if (activeCategory === 'pdf') {
      list = list.filter(b => (b.format || '').toLowerCase() === 'pdf' || (b.file_path || '').endsWith('.pdf'));
    } else if (activeCategory === 'epub') {
      list = list.filter(b => (b.format || '').toLowerCase() === 'epub' || (b.file_path || '').endsWith('.epub'));
    }

    if (!q) return list;

    return list.filter(book => {
      const titleMatch = (book.title || '').toLowerCase().includes(q);
      const authorMatch = (book.author || '').toLowerCase().includes(q);
      const descMatch = (book.description || '').toLowerCase().includes(q);
      const tagMatch = Array.isArray(book.tags) && book.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || authorMatch || descMatch || tagMatch;
    });
  }, [books, query, activeCategory]);

  // Suggested books to show when query is empty
  const suggestedBooks = useMemo(() => {
    return [...books].slice(0, 6);
  }, [books]);

  const categories = [
    { id: 'all', label: 'All Books' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'completed', label: 'Completed' },
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'epub', label: 'EPUB Books' },
  ];

  return (
    <div className="min-h-screen w-full bg-bg-primary text-text-primary px-4 sm:px-8 lg:px-12 pt-6 pb-28 md:pb-16 max-w-7xl mx-auto">
      {/* Top Search Bar Row */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-bg-subtle hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95 flex items-center justify-center shrink-0"
          aria-label="Go Back"
          title="Go Back"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>

        <form 
          onSubmit={handleSearchSubmit}
          className="flex-1 relative flex items-center"
        >
          <div className="absolute left-4 pointer-events-none text-text-tertiary flex items-center">
            <MagnifyingGlass size={20} weight="regular" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, topics, or formats..."
            className="w-full pl-12 pr-10 py-3 rounded-2xl bg-bg-subtle border border-black/10 dark:border-white/10 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm sm:text-base transition-all shadow-sm"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="absolute right-3 p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X size={16} weight="bold" />
            </button>
          )}
        </form>
      </div>

      {/* Quick Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar select-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                  : 'bg-bg-subtle text-text-secondary border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* When NO query is typed: Show Search History & Library Quick Picks */}
      {!query.trim() ? (
        <div className="flex flex-col gap-8">
          {/* Recent Searches Section */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  <ClockCounterClockwise size={16} weight="bold" />
                  <span>Recent Searches</span>
                </div>
                <button
                  onClick={clearAllHistory}
                  className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1 font-medium"
                >
                  <Trash size={14} />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <button
                    key={`${term}-${index}`}
                    onClick={() => handleSelectHistoryItem(term)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bg-subtle hover:bg-black/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 text-xs text-text-primary transition-all group active:scale-95"
                  >
                    <ClockCounterClockwise size={13} className="text-text-tertiary group-hover:text-accent-primary transition-colors" />
                    <span className="font-medium">{term}</span>
                    <span
                      onClick={(e) => removeHistoryItem(e, term)}
                      className="text-text-tertiary hover:text-red-500 p-0.5 rounded transition-colors ml-1"
                      title="Remove"
                    >
                      <X size={12} weight="bold" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested / Recent Books Section */}
          {suggestedBooks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary mb-4">
                <Sparkle size={16} weight="duotone" className="text-accent-primary" />
                <span>Quick Access from Library</span>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6">
                {suggestedBooks.map((book) => (
                  <div key={book.id} className="h-full">
                    <BookCard
                      book={book}
                      onClick={handleBookNavigate}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* When user IS searching: Show Results */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">
              {searchResults.length} {searchResults.length === 1 ? 'book found' : 'books found'} for "{query}"
            </h2>
          </div>

          {searchResults.length === 0 ? (
            <EmptyState
              icon={MagnifyingGlass}
              title="No matching books found"
              description={`We couldn't find any books matching "${query}". Try searching for another title, author, or adjusting the category filter.`}
              action={{
                label: 'Clear Search',
                onClick: () => {
                  setQuery('');
                  setActiveCategory('all');
                  if (inputRef.current) inputRef.current.focus();
                },
              }}
              className="py-16"
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6">
              {searchResults.map((book) => (
                <div key={book.id} className="h-full animate-in fade-in duration-200">
                  <BookCard
                    book={book}
                    onClick={handleBookNavigate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
