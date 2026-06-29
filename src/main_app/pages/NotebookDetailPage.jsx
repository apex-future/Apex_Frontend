import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookContext } from '../context/BookContextInstance';
import useBookNotesStore from '../store/bookNotesStore';
import {
  ArrowLeft, Plus, FileText, BookmarkSimple, TextAlignLeft,
  Highlighter, PencilSimple, MagnifyingGlass, Trash, Warning
} from '@phosphor-icons/react';

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

// Template badge styles
const TEMPLATE_STYLES = {
  blank: 'bg-bg-elevated text-text-tertiary border border-border-default',
  cornell:
    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  summary:
    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  feynman:
    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
};

function getTemplateStyle(template) {
  return TEMPLATE_STYLES[template] || TEMPLATE_STYLES.blank;
}

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

// ─── Delete Confirmation Modal ──────────────────────────────────────────────

function DeleteConfirmModal({ noteTitle, onConfirm, onCancel }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-bg-elevated border border-border-default rounded-[28px] p-8 w-full max-w-sm shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Warning size={22} weight="fill" className="text-red-500" />
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-lg font-bold text-text-primary">Delete Note</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">
              &ldquo;{noteTitle || 'Untitled'}&rdquo;
            </span>{' '}
            will be permanently deleted. This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-text-secondary bg-bg-subtle hover:bg-border-default transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function NotebookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { books, deleteTab } = useContext(BookContext);
  const { notes, fetchNotesByBook, deleteNote, loading } = useBookNotesStore();

  // Custom delete modal state
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const pendingNote = notes.find(n => n.local_id === pendingDeleteId);

  const requestDelete = useCallback((e, localId) => {
    e.stopPropagation();
    setPendingDeleteId(localId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteNote(pendingDeleteId);
    } catch (err) {
      console.error('[NotebookDetailPage] delete failed:', err);
    } finally {
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, deleteNote]);

  const cancelDelete = useCallback(() => setPendingDeleteId(null), []);

  const parsedBookId = useMemo(() => {
    const n = parseInt(bookId, 10);
    return isNaN(n) ? bookId : n;
  }, [bookId]);

  const book = useMemo(
    () => (books || []).find((b) => b.id === parsedBookId || String(b.id) === String(bookId)),
    [books, parsedBookId, bookId]
  );

  // Fetch notes for this book.
  // fetchNotesByBook is defined inside Zustand create() so its reference is
  // stable across renders — but we guard with an eslint disable just in case.
  useEffect(() => {
    if (bookId) {
      fetchNotesByBook(bookId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Tabs from book metadata
  const tabs = useMemo(() => {
    return book?.metadata?.tabs || [];
  }, [book]);

  const bookTitle = book?.title || 'Unknown Book';
  const notesCount = notes.length;
  const tabsCount = tabs.length;

  return (
    <div className="min-h-screen bg-bg-elevated w-full overflow-x-hidden">
      {/* Header — standard Apex glassmorphic pattern */}
      <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
            >
              <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform text-text-primary" />
            </button>
          </div>

          {/* Centre — two-line block */}
          <div className="px-5 py-2.5 rounded-[20px] bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-center min-w-0 flex-1 max-w-md">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary tracking-wide">
              <span>Notes</span>
              <span className="opacity-40">/</span>
              <span className="truncate max-w-[150px] md:max-w-[200px] font-bold text-text-primary">{bookTitle}</span>
            </div>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {notesCount} notes · {tabsCount} tabs
            </p>
          </div>

          {/* Right spacer for balance */}
          <div className="w-[42px] shrink-0" />
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Actions Bar */}
        <div className="flex justify-end items-center">
          <button
            onClick={() => navigate(`/notes/${bookId}/new`)}
            className="flex items-center gap-2 bg-accent-primary text-white text-sm font-bold px-6 py-3 rounded-2xl hover:bg-accent-primary/90 active:scale-95 transition-all shadow-lg shadow-accent-primary/20"
          >
            <Plus size={18} weight="bold" />
            New Note
          </button>
        </div>
        {/* ═══ SECTION 1 — NOTES ═══ */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display text-text-primary">Notes</h2>
            <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-2.5 py-1 rounded-full">
              {notesCount}
            </span>
          </div>

          {/* Notes grid */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {[1,2,3].map(i => <div key={i} className="h-40 bg-bg-subtle animate-pulse rounded-card" />)}
             </div>
          ) : notes.length === 0 ? (
            <div className="border border-dashed border-border-default rounded-card p-10 text-center flex flex-col items-center gap-3">
              <FileText size={28} weight="fill" className="text-text-placeholder" />
              <h4 className="font-display text-lg font-bold text-text-primary">No notes yet</h4>
              <p className="text-sm text-text-secondary">Tap New Note to start writing.</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
              {notes.map((note) => {
                const preview = getContentPreview(note.content);
                const template = note.template || 'blank';
                const wordCount = note.word_count || 0;

                return (
                  <div
                    key={note.local_id}
                    className="break-inside-avoid bg-bg-subtle border border-border-default rounded-card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col"
                    onClick={() => navigate(`/notes/${bookId}/${note.local_id}`)}
                  >
                    {/* Card top — title area */}
                    <div className="p-5 pb-4">
                      <h4 className="font-display text-base font-semibold text-text-primary leading-snug line-clamp-2">
                        {note.title ? (
                          note.title
                        ) : (
                          <span className="text-text-tertiary italic">Untitled note</span>
                        )}
                      </h4>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-1 mt-2">
                        {preview ? (
                          preview
                        ) : (
                          <span className="text-text-tertiary italic">No content yet...</span>
                        )}
                      </p>
                    </div>

                    {/* Card divider */}
                    <div className="border-t border-border-default/60" />

                    {/* Card footer */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      {/* Left group */}
                      <div className="flex items-center gap-2">
                        {/* Template badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${getTemplateStyle(template)}`}
                        >
                          {template}
                        </span>
                        {/* Word count */}
                        <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                          <TextAlignLeft size={11} weight="bold" /> {wordCount} words
                        </span>
                        <button
                          onClick={(e) => requestDelete(e, note.local_id)}
                          title="Delete note"
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>

                      {/* Right — last edited */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-tertiary">
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ DIVIDER ═══ */}
        <div className="border-t border-border-default my-8" />

        {/* ═══ SECTION 2 — TABS ═══ */}
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-display text-text-primary">Tabs</h2>
            <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-2.5 py-1 rounded-full">
              {tabsCount}
            </span>
          </div>

          {/* Tabs list */}
          {tabs.length === 0 ? (
            <div className="border border-dashed border-border-default rounded-card p-10 text-center flex flex-col items-center gap-3">
              <BookmarkSimple size={28} weight="fill" className="text-text-placeholder" />
              <h4 className="font-display text-lg font-bold text-text-primary">No tabs yet</h4>
              <p className="text-sm text-text-secondary">Highlight text while reading to create tabs.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tabs.map((tab) => {
                const noteType = tab.noteType || tab.type || 'manual_note';
                const isHighlight = noteType === 'highlight_note';

                return (
                  <div
                    key={tab.id || tab.dexieId}
                    className="bg-bg-subtle border border-border-default rounded-card p-4 hover:border-accent-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col gap-3"
                    onClick={() => navigate(`/book/${parsedBookId}`)}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      {/* Note type badge */}
                      {isHighlight ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                          <Highlighter size={10} weight="bold" /> Highlight
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                          <PencilSimple size={10} weight="bold" /> Manual
                        </span>
                      )}

                      {/* Timestamp & Actions */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-text-tertiary">
                          {formatDate(tab.updatedAt || tab.createdAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTab(book.id, tab.id || tab.dexieId);
                          }}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Delete tab"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {tab.text}
                    </p>

                    {/* Bottom row — context (highlighted source text) */}
                    {tab.context && (
                      <div className="border-t border-border-default/60 pt-3 flex items-start gap-2">
                        <div className="w-0.5 bg-accent-primary/40 rounded-full self-stretch min-h-[1rem]" />
                        <p className="text-xs text-text-secondary italic line-clamp-2">
                          {tab.context}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* ─── Delete Confirmation Modal ─── */}
      {pendingDeleteId && (
        <DeleteConfirmModal
          noteTitle={pendingNote?.title}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

export default NotebookDetailPage;
