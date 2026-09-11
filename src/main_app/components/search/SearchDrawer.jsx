import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlass, 
  X, 
  ClockCounterClockwise, 
  Trash, 
  CaretRight
} from '@phosphor-icons/react';
import { BookContext } from '../../context/BookContextInstance';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import BookCover from '../ui/BookCover';
import { isValidAuthor } from '../../utils/documentMetadata';

const SEARCH_HISTORY_KEY = 'apex_book_search_history';

export default function SearchDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { books = [], handleBookClick } = useContext(BookContext) || {};

  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading search history', e);
    }
  }, [isOpen]);

  // Focus input whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Add search term to history
  const addTermToHistory = (term) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Remove single term
  const removeHistoryItem = (e, itemToRemove) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Clear all history
  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {}
  };

  const handleSelectHistory = (term) => {
    setQuery(term);
    addTermToHistory(term);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBookSelect = (bookId) => {
    if (query.trim()) {
      addTermToHistory(query);
    }
    onClose();
    if (handleBookClick) {
      handleBookClick(bookId);
    }
    navigate(`/reader/${bookId}`);
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...books];

    // Category filter
    if (activeCategory === 'favorites') {
      list = list.filter((b) => b.isFavorite);
    } else if (activeCategory === 'in-progress') {
      list = list.filter((b) => b.progress > 0 && b.progress < 100);
    } else if (activeCategory === 'completed') {
      list = list.filter((b) => b.progress === 100);
    } else if (activeCategory === 'pdf') {
      list = list.filter((b) => (b.format || '').toLowerCase() === 'pdf' || (b.file_path || '').endsWith('.pdf'));
    } else if (activeCategory === 'epub') {
      list = list.filter((b) => (b.format || '').toLowerCase() === 'epub' || (b.file_path || '').endsWith('.epub'));
    }

    if (!q) return list;

    return list.filter((b) => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      const tags = Array.isArray(b.tags) ? b.tags.some((t) => t.toLowerCase().includes(q)) : false;
      return title.includes(q) || author.includes(q) || desc.includes(q) || tags;
    });
  }, [books, query, activeCategory]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'in-progress', label: 'Reading' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'completed', label: 'Completed' },
    { id: 'pdf', label: 'PDF' },
    { id: 'epub', label: 'EPUB' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 27, stiffness: 240 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-primary shadow-2xl z-[101] flex flex-col border-l border-black/10 dark:border-white/10 overflow-hidden"
          >
            {/* Drawer Header with Pill Style on Dashboard Background */}
            <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 bg-bg-primary flex flex-col gap-3.5 shrink-0">
              
              {/* Glassmorphic Pill Header Bar */}
              <div className="flex items-center justify-between relative w-full min-h-[44px]">
                {/* Left placeholder spacer to keep center title balanced */}
                <div className="w-10 h-10 opacity-0 pointer-events-none shrink-0" />

                {/* Center Glassmorphic Title Pill */}
                <div className="px-5 py-2 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center">
                  <h3 className="text-sm sm:text-base font-bold font-display text-text-primary whitespace-nowrap">
                    Search Library
                  </h3>
                </div>

                {/* Right Close Glassmorphic Pill */}
                <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] shrink-0">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-full transition-all flex items-center justify-center"
                    aria-label="Close search"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Input Box */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-text-tertiary flex items-center">
                  <MagnifyingGlass size={18} weight="regular" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTermToHistory(query);
                    }
                  }}
                  placeholder="Search titles, authors, or keywords..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-bg-subtle border border-black/10 dark:border-white/10 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-xs sm:text-sm transition-all shadow-xs"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="absolute right-2.5 p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar select-none">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-accent-primary text-white border-accent-primary shadow-xs'
                          : 'bg-bg-subtle text-text-secondary border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 hover:text-text-primary'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar flex flex-col gap-4">
              {/* If NO query typed: Show Search History as Titles */}
              {!query.trim() ? (
                <div>
                  {searchHistory.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                          <ClockCounterClockwise size={14} weight="bold" />
                          <span>Search History</span>
                        </div>
                        <button
                          onClick={clearAllHistory}
                          className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1 font-medium"
                        >
                          <Trash size={12} />
                          <span>Clear All</span>
                        </button>
                      </div>

                      {/* List of search history titles */}
                      <div className="flex flex-col rounded-2xl bg-bg-subtle border border-black/10 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5 shadow-xs">
                        {searchHistory.map((term, index) => (
                          <div
                            key={`${term}-${index}`}
                            onClick={() => handleSelectHistory(term)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ClockCounterClockwise size={16} className="text-text-tertiary group-hover:text-accent-primary transition-colors shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors truncate">
                                {term}
                              </span>
                            </div>

                            <button
                              onClick={(e) => removeHistoryItem(e, term)}
                              className="p-1.5 text-text-tertiary hover:text-red-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 ml-2"
                              title="Delete search"
                              aria-label="Delete search"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={ClockCounterClockwise}
                      title="No Search History"
                      description="Your past searches will appear here for easy access."
                      className="py-16"
                    />
                  )}
                </div>
              ) : (
                /* When Query IS typed: Live Search Results */
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-medium text-text-tertiary px-1">
                    {searchResults.length} {searchResults.length === 1 ? 'result found' : 'results found'}
                  </div>

                  {searchResults.length === 0 ? (
                    <EmptyState
                      icon={MagnifyingGlass}
                      title="No matching books"
                      description={`We couldn't find any books matching "${query}". Try checking your spelling or adjusting filters.`}
                      action={{
                        label: 'Clear Search',
                        onClick: () => {
                          setQuery('');
                          setActiveCategory('all');
                          if (inputRef.current) inputRef.current.focus();
                        },
                      }}
                      className="py-12"
                    />
                  ) : (
                    searchResults.map((book) => (
                      <Card
                        key={book.id}
                        variant="interactive"
                        onClick={() => handleBookSelect(book.id)}
                        className="p-3 flex items-center gap-3.5 group"
                      >
                        <BookCover book={book} size="xs" className="shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs sm:text-sm text-text-primary truncate group-hover:text-accent-primary transition-colors">
                              {book.title}
                            </h4>
                            {book.format && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-text-tertiary shrink-0">
                                {book.format}
                              </span>
                            )}
                          </div>
                          {isValidAuthor(book.author) && (
                            <p className="text-xs text-text-secondary truncate mt-0.5">
                              {book.author}
                            </p>
                          )}

                          {typeof book.progress === 'number' && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-accent-primary rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.max(0, book.progress))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-text-tertiary shrink-0">
                                {Math.round(book.progress)}%
                              </span>
                            </div>
                          )}
                        </div>

                        <CaretRight size={16} className="text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
