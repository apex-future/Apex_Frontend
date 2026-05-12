import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookContext } from '../context/BookContextInstance';
import {
  ArrowLeft, Search, Star, Pencil, ChevronRight,
  BookOpen, FileText, Bookmark, X
} from 'lucide-react';

// Deterministic colour picker: hash bookTitle to pick from palette
const COVER_COLORS = ['#3B0764', '#1D4ED8', '#065F46', '#92400E', '#881337', '#1E3A5F'];
function getCoverColor(title) {
  let hash = 0;
  for (let i = 0; i < (title || '').length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STARRED_KEY = 'apex_starred_notebooks';

function NotebooksPage() {
  const { books } = useContext(BookContext);
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'recent' | 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [starredSet, setStarredSet] = useState(new Set());
  const [renameModal, setRenameModal] = useState(null); // { bookId, currentTitle }
  const [renameValue, setRenameValue] = useState('');
  const [localRenames, setLocalRenames] = useState({}); // bookId -> renamed title

  // Seed starred state from localStorage
  useEffect(() => {
    console.log('[NotebooksPage] mounted, books:', books?.length);
    try {
      const stored = localStorage.getItem(STARRED_KEY);
      if (stored) {
        setStarredSet(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const toggleStar = useCallback((bookId) => {
    setStarredSet((prev) => {
      const next = new Set(prev);
      const isNowStarred = !next.has(bookId);
      if (isNowStarred) {
        next.add(bookId);
      } else {
        next.delete(bookId);
      }
      console.log('[NotebooksPage] starred toggle:', bookId, isNowStarred);
      localStorage.setItem(STARRED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Derive notebooks from books
  const notebooks = useMemo(() => {
    return (books || []).map((book) => {
      const tabs = book?.metadata?.tabs || [];
      // TODO: book_notes data should come from bookNotesStore when built
      const bookNotes = [];

      const allTimestamps = [
        ...tabs.map((t) => t.updatedAt || t.createdAt),
        ...bookNotes.map((n) => n.updatedAt || n.createdAt),
      ].filter(Boolean);

      const lastEdited = allTimestamps.length > 0
        ? new Date(Math.max(...allTimestamps.map((t) => new Date(t).getTime()))).toISOString()
        : book.lastReadAt || book.uploadedAt;

      return {
        bookId: book.id,
        bookTitle: localRenames[book.id] || book.title,
        bookCover: book.cover || book.coverImage || null,
        notesCount: bookNotes.length,
        tabsCount: tabs.length,
        lastEdited,
        isStarred: starredSet.has(book.id),
      };
    });
  }, [books, starredSet, localRenames]);

  // Filter + search
  const filteredNotebooks = useMemo(() => {
    let result = notebooks;

    // Apply filter
    if (activeFilter === 'starred') {
      result = result.filter((nb) => nb.isStarred);
    } else if (activeFilter === 'recent') {
      result = [...result].sort(
        (a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((nb) => nb.bookTitle.toLowerCase().includes(q));
    }

    return result;
  }, [notebooks, activeFilter, searchQuery]);

  // Rename handlers
  const openRenameModal = (bookId, currentTitle) => {
    setRenameModal({ bookId, currentTitle });
    setRenameValue(currentTitle);
  };

  const confirmRename = () => {
    if (renameModal && renameValue.trim()) {
      console.log('[NotebooksPage] rename:', renameModal.bookId, renameValue.trim());
      setLocalRenames((prev) => ({ ...prev, [renameModal.bookId]: renameValue.trim() }));
    }
    setRenameModal(null);
  };

  const closeRenameModal = () => {
    setRenameModal(null);
  };

  // Close rename modal on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && renameModal) {
        closeRenameModal();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [renameModal]);

  const filterPills = [
    { key: 'all', label: 'All' },
    { key: 'recent', label: 'Recent' },
    { key: 'starred', label: 'Starred' },
  ];

  return (
    <div className="min-h-screen bg-bg-elevated w-full overflow-x-hidden">
      {/* Header — standard Apex glassmorphic pattern */}
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <h3 className="text-xl font-bold font-display text-text-primary">Notebooks</h3>
          <div className="w-10" /> {/* spacer — no right action */}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Toolbar row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter pills */}
          <div className="flex gap-2">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase transition-all ${
                  activeFilter === pill.key
                    ? 'bg-bg-subtle text-accent-primary border border-accent-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg-subtle/50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-72 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-subtle border-2 border-border-default rounded-2xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        {notebooks.length === 0 ? (
          /* Empty state — no notebooks at all */
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border-default rounded-card">
            <BookOpen size={32} className="text-text-placeholder mb-4" />
            <h3 className="font-display text-2xl font-bold text-text-primary mb-2">
              No notebooks yet
            </h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              Upload a book to start taking notes and creating tabs.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-accent-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-accent-primary/20 hover:-translate-y-1 transition-all active:translate-y-0"
            >
              Go to Library
            </button>
          </div>
        ) : filteredNotebooks.length === 0 ? (
          /* Empty search state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-text-placeholder mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No notebooks match</h3>
            <p className="text-text-secondary">Try a different search term.</p>
          </div>
        ) : (
          /* Notebook grid — masonry */
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredNotebooks.map((nb) => (
              <div
                key={nb.bookId}
                className="break-inside-avoid bg-bg-subtle border border-border-default rounded-card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(`/notes/${nb.bookId}`)}
              >
                {/* SECTION 1 — Book cover area */}
                <div className="relative h-36 overflow-hidden">
                  {nb.bookCover ? (
                    <img
                      src={nb.bookCover}
                      alt={nb.bookTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: getCoverColor(nb.bookTitle) }}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-full" />

                  {/* Book title on cover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">
                      Notebook for
                    </span>
                    <h4 className="font-display text-white text-sm font-semibold leading-snug line-clamp-2 mt-0.5">
                      {nb.bookTitle}
                    </h4>
                  </div>

                  {/* Note count pill — top right */}
                  <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium">
                    {nb.notesCount} notes
                  </div>
                </div>

                {/* SECTION 2 — Card footer */}
                <div className="p-4">
                  {/* Stats row */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-text-secondary bg-bg-elevated px-2 py-1 rounded-md border border-border-default">
                      <FileText size={12} /> {nb.notesCount} notes
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-secondary bg-bg-elevated px-2 py-1 rounded-md border border-border-default">
                      <Bookmark size={12} /> {nb.tabsCount} tabs
                    </span>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between mt-3">
                    {/* Last edited */}
                    <span className="text-[11px] text-text-tertiary">
                      Edited {formatDate(nb.lastEdited)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Star button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(nb.bookId);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          nb.isStarred
                            ? 'text-amber-400 bg-amber-50 dark:bg-amber-400/10'
                            : 'text-text-tertiary hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                        }`}
                      >
                        <Star
                          size={14}
                          strokeWidth={nb.isStarred ? 2 : 1.5}
                          fill={nb.isStarred ? 'currentColor' : 'none'}
                        />
                      </button>

                      {/* Rename button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameModal(nb.bookId, nb.bookTitle);
                        }}
                        className="p-1.5 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-all"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Open button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/notes/${nb.bookId}`);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Open <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renameModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={closeRenameModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal card */}
          <div
            className="relative bg-bg-elevated rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-text-primary">Rename notebook</h3>
            <p className="text-text-secondary text-sm mt-1">
              This renames your local label for this notebook.
            </p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
              }}
              className="w-full mt-4 bg-bg-subtle border-2 border-border-default rounded-2xl py-3 pl-4 pr-4 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={closeRenameModal}
                className="px-4 py-2 text-sm font-bold text-text-secondary hover:bg-bg-subtle rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="px-5 py-2 text-sm font-bold text-white bg-accent-primary rounded-xl hover:opacity-90 transition-all"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotebooksPage;
