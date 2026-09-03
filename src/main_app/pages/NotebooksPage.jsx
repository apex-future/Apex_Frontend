import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookContext } from '../context/BookContextInstance';
import useBookNotesStore from '../store/bookNotesStore';
import {
  ArrowLeft, MagnifyingGlass, Star, PencilSimple, CaretRight,
  BookOpen, FileText, BookmarkSimple, X, TextAlignLeft
} from '@phosphor-icons/react';

// Extract plain text preview from JSONB content blocks
function getContentPreview(content) {
  if (!content || !content.content || !Array.isArray(content.content)) return null;
  for (const block of content.content) {
    if (block.type === 'paragraph' && block.content) {
      const text = block.content.map(c => c.text).join(' ');
      if (text.trim()) return text.trim();
    }
  }
  return null;
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
  const { books = [] } = useContext(BookContext) || {};
  const navigate = useNavigate();
  const { getNotebooksSummary } = useBookNotesStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [starredSet, setStarredSet] = useState(new Set());
  const [renameModal, setRenameModal] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [localRenames, setLocalRenames] = useState({});
  const [notebookSummaries, setNotebookSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState(true);

  // Load summaries
  const loadSummaries = useCallback(async () => {
    if (!books?.length) {
      setLoadingSummaries(false);
      return;
    }
    const ids = books.map(b => b.id);
    const summaries = await getNotebooksSummary(ids);
    setNotebookSummaries(summaries);
    setLoadingSummaries(false);
  }, [books, getNotebooksSummary]);

  useEffect(() => {
    loadSummaries();

    const handleSync = () => {
      loadSummaries();
    };

    window.addEventListener('apex:sync-complete', handleSync);
    window.addEventListener('apex:books-updated', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('apex:sync-complete', handleSync);
      window.removeEventListener('apex:books-updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [loadSummaries]);

  // Seed starred state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STARRED_KEY);
      if (stored) {
        setStarredSet(new Set(JSON.parse(stored)));
      }
    } catch { /* ignore */ }
  }, []);

  const toggleStar = useCallback((bookId) => {
    setStarredSet((prev) => {
      const next = new Set(prev);
      const isNowStarred = !next.has(bookId);
      if (isNowStarred) next.add(bookId);
      else next.delete(bookId);
      localStorage.setItem(STARRED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Derive notebooks
  const notebooksData = useMemo(() => {
    return (books || []).map((book) => {
      const summary = notebookSummaries[book.id] || { count: 0, tabsCount: 0, recent: [] };
      
      const lastEdited = summary.recent.length > 0
        ? new Date(Math.max(...summary.recent.map((n) => new Date(n.updatedAt || n.createdAt).getTime()))).toISOString()
        : book.lastReadAt || book.uploadedAt;

      return {
        bookId: book.id,
        bookTitle: localRenames[book.id] || book.title,
        bookCover: book.cover || book.coverImage || null,
        notesCount: summary.count,
        recentNotes: summary.recent,
        tabsCount: summary.tabsCount,
        lastEdited,
        isStarred: starredSet.has(book.id),
      };
    });
  }, [books, starredSet, localRenames, notebookSummaries]);

  // Filter + search
  const filteredNotebooks = useMemo(() => {
    let result = notebooksData;
    if (activeFilter === 'starred') {
      result = result.filter((nb) => nb.isStarred);
    } else if (activeFilter === 'recent') {
      result = [...result].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((nb) => nb.bookTitle.toLowerCase().includes(q));
    }
    return result;
  }, [notebooksData, activeFilter, searchQuery]);

  const openRenameModal = (bookId, currentTitle) => {
    setRenameModal({ bookId, currentTitle });
    setRenameValue(currentTitle);
  };

  const confirmRename = () => {
    if (renameModal && renameValue.trim()) {
      setLocalRenames((prev) => ({ ...prev, [renameModal.bookId]: renameValue.trim() }));
    }
    setRenameModal(null);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && renameModal) setRenameModal(null);
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
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
            >
              <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform text-text-primary" />
            </button>
          </div>

          <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <h3 className="text-base md:text-lg font-bold font-display text-text-primary text-center">Notebooks</h3>
          </div>

          <div className="w-[42px]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase transition-all ${
                  activeFilter === pill.key
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg-subtle/50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 group">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary" size={18} weight="bold" />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-subtle dark:bg-bg-elevated border border-black/10 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-accent-primary transition-all"
            />
          </div>
        </div>

        {notebooksData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-card">
            <BookOpen size={32} weight="fill" className="text-text-placeholder mb-4" />
            <h3 className="font-display text-2xl font-bold text-text-primary mb-2">No notebooks yet</h3>
            <button onClick={() => navigate('/')} className="mt-4 bg-accent-primary text-white px-8 py-3 rounded-xl font-bold">Go to Library</button>
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-card">
            {activeFilter === 'starred' ? (
              <>
                <Star size={32} weight="fill" className="text-text-placeholder mb-4" />
                <h3 className="font-display text-2xl font-bold text-text-primary mb-2">No starred notebooks</h3>
                <p className="text-text-secondary">Star your favorite notebooks to see them here.</p>
              </>
            ) : searchQuery.trim() ? (
              <>
                <MagnifyingGlass size={32} weight="bold" className="text-text-placeholder mb-4" />
                <h3 className="font-display text-2xl font-bold text-text-primary mb-2">No results found</h3>
                <p className="text-text-secondary">We couldn't find any notebooks matching "{searchQuery}".</p>
              </>
            ) : (
              <>
                <BookOpen size={32} weight="fill" className="text-text-placeholder mb-4" />
                <h3 className="font-display text-2xl font-bold text-text-primary mb-2">No notebooks found</h3>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredNotebooks.map((nb) => (
              <div
                key={nb.bookId}
                className="flex flex-col bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-card overflow-hidden hover:-translate-y-2 transition-all duration-300 group cursor-pointer aspect-[3/4.2] shadow-sm hover:shadow-md"
                onClick={() => navigate(`/notes/${nb.bookId}`)}
              >
                {/* Book Header Section */}
                <div className="p-6 pb-2">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
                      Notebook For
                    </p>
                    <h4 className="font-display text-lg font-bold text-text-primary leading-tight truncate mt-1">
                      {nb.bookTitle}
                    </h4>
                  </div>
                </div>

                {/* Center Content Preview Area */}
                <div className="flex-1 px-8 py-4 flex flex-col justify-center relative">
                  {(nb.notesCount > 0 || nb.tabsCount > 0) ? (
                    <div className="w-full flex flex-col justify-center gap-3.5">
                      {/* Line 1 — stretches end-to-end with 4 word breaks */}
                      <div className="w-full">
                        <svg className="w-full h-2 text-black/25 dark:text-white/25 group-hover:text-accent-primary/60 transition-colors duration-300" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                          <path
                            d="M 4 6 C 18 4, 30 8, 44 5 S 62 7, 72 6 M 84 6 C 98 8, 112 5, 126 7 S 142 5, 154 6 M 166 6 C 180 5, 194 7, 208 5 S 224 7, 236 6 M 248 6 C 260 8, 274 5, 286 7 S 294 5, 296 6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Line 2 — stretches end-to-end with varied spacing */}
                      <div className="w-full">
                        <svg className="w-full h-2 text-black/20 dark:text-white/20 group-hover:text-accent-primary/50 transition-colors duration-300" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                          <path
                            d="M 4 6 C 22 7, 40 5, 58 7 S 78 5, 92 6 M 106 6 C 122 5, 138 8, 154 5 S 168 7, 178 6 M 190 6 C 206 7, 222 5, 238 7 S 252 5, 262 6 M 274 6 C 282 5, 290 7, 296 6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Line 3 — stretches end-to-end with 4 words */}
                      <div className="w-full">
                        <svg className="w-full h-2 text-black/25 dark:text-white/25 group-hover:text-accent-primary/60 transition-colors duration-300" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                          <path
                            d="M 4 6 C 16 5, 28 7, 40 5 S 52 7, 62 6 M 76 6 C 94 8, 112 5, 130 7 S 146 5, 158 6 M 172 6 C 188 5, 204 7, 220 5 S 234 7, 244 6 M 256 6 C 268 7, 280 5, 290 7 S 294 5, 296 6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Line 4 — natural paragraph ending (~65% width) */}
                      <div className="w-[65%]">
                        <svg className="w-full h-2 text-black/20 dark:text-white/20 group-hover:text-accent-primary/50 transition-colors duration-300" viewBox="0 0 195 12" fill="none" preserveAspectRatio="none">
                          <path
                            d="M 4 6 C 20 7, 36 5, 52 7 S 68 5, 78 6 M 92 6 C 108 5, 122 8, 134 5 S 144 7, 150 6 M 162 6 C 174 7, 184 5, 192 7 L 195 6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-text-placeholder opacity-40">
                      <FileText size={40} strokeWidth={1} weight="fill" />
                      <p className="text-xs mt-3 font-medium">Empty notebook</p>
                    </div>
                  )}
                </div>

                {/* Footer Section */}
                <div className="p-6 pt-0 mt-auto">
                  <div className="h-px bg-border-default/50 w-full mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{nb.notesCount}</span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-tighter">Notes</span>
                      </div>
                      <div className="w-px h-6 bg-border-default" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">{nb.tabsCount}</span>
                        <span className="text-[10px] text-text-tertiary uppercase tracking-tighter">Tabs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Star button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(nb.bookId); }}
                        className={`p-2 rounded-xl transition-all ${nb.isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-text-tertiary hover:bg-bg-subtle'}`}
                      >
                        <Star size={15} weight={nb.isStarred ? 'fill' : 'regular'} />
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); openRenameModal(nb.bookId, nb.bookTitle); }}
                        className="p-2 text-text-tertiary hover:text-accent-primary transition-colors rounded-xl"
                      >
                        <PencilSimple size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-3">
                    Last edited {formatDate(nb.lastEdited)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {renameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setRenameModal(null)}>
          <div className="bg-bg-subtle dark:bg-bg-elevated rounded-card p-8 w-full max-w-sm shadow-xl border-t border-black/10 dark:border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-text-primary">Rename Notebook</h3>
            <p className="text-sm text-text-secondary mt-1.5">Give this notebook a new name — anything you like.</p>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="w-full mt-6 bg-bg-subtle dark:bg-bg-elevated border border-black/10 dark:border-white/10 rounded-2xl py-4 px-6 text-text-primary focus:outline-none focus:border-accent-primary transition-all"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setRenameModal(null)} className="px-6 py-2.5 text-sm font-bold text-text-secondary">Cancel</button>
              <button onClick={confirmRename} className="px-8 py-2.5 text-sm font-bold text-white bg-accent-primary rounded-xl shadow-lg shadow-accent-primary/20">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotebooksPage;
