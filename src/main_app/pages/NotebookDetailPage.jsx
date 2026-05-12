import { useContext, useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookContext } from '../context/BookContextInstance';
import useBookNotesStore from '../store/bookNotesStore';
import {
  ArrowLeft, Plus, FileText, Bookmark, AlignLeft,
  Highlighter, Pen, Search
} from 'lucide-react';

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

function NotebookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { books } = useContext(BookContext);
  const { notes, fetchNotesByBook, loading } = useBookNotesStore();

  const parsedBookId = useMemo(() => {
    const n = parseInt(bookId, 10);
    return isNaN(n) ? bookId : n;
  }, [bookId]);

  const book = useMemo(
    () => (books || []).find((b) => b.id === parsedBookId || String(b.id) === String(bookId)),
    [books, parsedBookId, bookId]
  );

  // Fetch notes for this book
  useEffect(() => {
    if (bookId) {
      fetchNotesByBook(bookId);
    }
  }, [bookId, fetchNotesByBook]);

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
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/notes')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Centre — two-line block */}
          <div className="text-center">
            <p className="text-xs text-text-secondary tracking-wide">
              Notes / {bookTitle}
            </p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {notesCount} notes · {tabsCount} tabs
            </p>
          </div>

          {/* Right — New Note button */}
          <button
            onClick={() => {
              console.log('[NotebookDetailPage] open note panel — navigating to editor');
              navigate(`/notes/${bookId}/new`);
            }}
            className="flex items-center gap-1.5 bg-accent-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-sm shadow-accent-primary/20"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <FileText size={28} className="text-text-placeholder" />
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
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mt-2">
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
                          <AlignLeft size={11} /> {wordCount} words
                        </span>
                      </div>

                      {/* Right — last edited */}
                      <span className="text-[11px] text-text-tertiary">
                        {formatDate(note.updatedAt)}
                      </span>
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
              <Bookmark size={28} className="text-text-placeholder" />
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
                          <Highlighter size={10} /> Highlight
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                          <Pen size={10} /> Manual
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-[11px] text-text-tertiary">
                        {formatDate(tab.updatedAt || tab.createdAt)}
                      </span>
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
    </div>
  );
}

export default NotebookDetailPage;
