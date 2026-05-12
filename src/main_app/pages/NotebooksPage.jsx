import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookContext } from '../context/BookContextInstance';
import useBookNotesStore from '../store/bookNotesStore';
import {
  ArrowLeft, Search, Star, Pencil, ChevronRight,
  BookOpen, FileText, Bookmark, X, AlignLeft
} from 'lucide-react';

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
  const { books } = useContext(BookContext);
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
  useEffect(() => {
    const load = async () => {
      if (!books?.length) {
        setLoadingSummaries(false);
        return;
      }
      const ids = books.map(b => b.id);
      const summaries = await getNotebooksSummary(ids);
      setNotebookSummaries(summaries);
      setLoadingSummaries(false);
    };
    load();
  }, [books, getNotebooksSummary]);

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
    <div className="min-h-screen bg-bg-elevated w-full overflow-x-hidden">
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <h3 className="text-xl font-bold font-display text-text-primary text-center flex-1">Notebooks</h3>
          <div className="w-10" />
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary" size={18} />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-subtle border border-border-default rounded-2xl py-3 pl-11 pr-4 text-text-primary focus:outline-none focus:border-accent-primary transition-all"
            />
          </div>
        </div>

        {notebooksData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border-default rounded-card">
            <BookOpen size={32} className="text-text-placeholder mb-4" />
            <h3 className="font-display text-2xl font-bold text-text-primary mb-2">No notebooks yet</h3>
            <button onClick={() => navigate('/')} className="mt-4 bg-accent-primary text-white px-8 py-3 rounded-xl font-bold">Go to Library</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredNotebooks.map((nb) => (
              <div
                key={nb.bookId}
                className="flex flex-col bg-card-glass backdrop-blur-xl border border-border-default rounded-[32px] overflow-hidden hover:-translate-y-2 transition-all duration-500 group cursor-pointer aspect-[3/4.2]"
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

                {/* Stacked Notes Area */}
                <div className="flex-1 px-6 py-4 flex flex-col items-center justify-center relative">
                  {nb.recentNotes.length > 0 ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {nb.recentNotes.slice(0, 3).map((note, idx) => {
                        const offsets = [
                          'translate-y-0 scale-100 z-30 opacity-100',
                          'translate-y-4 scale-95 z-20 opacity-60',
                          'translate-y-8 scale-90 z-10 opacity-30',
                        ];
                        const hoverOffsets = [
                          'group-hover:-translate-y-6',
                          'group-hover:-translate-y-0',
                          'group-hover:translate-y-6',
                        ];
                        
                        return (
                          <div
                            key={note.local_id}
                            className={`absolute inset-x-0 h-32 bg-bg-elevated border border-border-default rounded-2xl p-4 shadow-xl transition-all duration-500 ease-out flex flex-col gap-2 ${offsets[idx]} ${hoverOffsets[idx]}`}
                          >
                            <h5 className="text-xs font-bold text-text-primary truncate">{note.title || 'Untitled'}</h5>
                            <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                              {getContentPreview(note.content) || 'No content...'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-text-placeholder opacity-40">
                      <FileText size={40} strokeWidth={1} />
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
                        <Star size={15} fill={nb.isStarred ? 'currentColor' : 'none'} />
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); openRenameModal(nb.bookId, nb.bookTitle); }}
                        className="p-2 text-text-tertiary hover:text-accent-primary transition-colors rounded-xl"
                      >
                        <Pencil size={14} />
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
          <div className="bg-bg-elevated rounded-[32px] p-8 w-full max-w-sm shadow-2xl border border-border-default" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-text-primary">Rename</h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="w-full mt-6 bg-bg-subtle border border-border-default rounded-2xl py-4 px-6 text-text-primary focus:outline-none focus:border-accent-primary"
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
