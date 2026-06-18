import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X, Plus, FileText, BookmarkSimple, TextAlignLeft, HighlighterCircle, Pencil,
  Trash, Warning, PencilSimple, FloppyDisk, MagnifyingGlass, Note, Quotes, CalendarBlank
} from '@phosphor-icons/react';
import useBookNotesStore from '../../../../store/bookNotesStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TEMPLATE_STYLES = {
  blank: 'bg-bg-elevated text-text-tertiary border border-border-default',
  cornell: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  summary: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  feynman: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
};
function getTemplateStyle(template) {
  return TEMPLATE_STYLES[template] || TEMPLATE_STYLES.blank;
}

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

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ noteTitle, onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-bg-elevated border border-border-default rounded-[24px] p-6 w-full max-w-xs shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Warning size={20} weight="fill" className="text-red-500" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-base font-bold text-text-primary">Delete Note</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">&ldquo;{noteTitle || 'Untitled'}&rdquo;</span>{' '}
            will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-text-secondary bg-bg-subtle hover:bg-border-default transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ bookId, onAddNote }) {
  const { notes, deleteNote, loading } = useBookNotesStore();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const pendingNote = notes.find(n => n.local_id === pendingDeleteId);

  const requestDelete = useCallback((e, localId) => {
    e.stopPropagation();
    setPendingDeleteId(localId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    try { await deleteNote(pendingDeleteId); } catch (err) { console.error(err); }
    finally { setPendingDeleteId(null); }
  }, [pendingDeleteId, deleteNote]);

  return (
    <div className="flex flex-col h-full relative">
      {loading ? (
        <div className="flex flex-col gap-3 p-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-bg-subtle animate-pulse rounded-2xl" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-3xl bg-bg-subtle flex items-center justify-center mb-4 text-text-placeholder border border-border-default/40">
            <FileText size={26} weight="bold" />
          </div>
          <h4 className="text-sm font-bold text-text-secondary">No notes yet</h4>
          <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed max-w-[180px]">
            Tap "Add Note" to start writing while you read.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          {notes.map((note) => {
            const preview = getContentPreview(note.content);
            const template = note.template || 'blank';
            const wordCount = note.word_count || 0;
            return (
              <div
                key={note.local_id}
                className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden hover:border-accent-primary/30 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex flex-col"
                onClick={() => onAddNote(note.local_id)}
              >
                <div className="p-4 pb-3">
                  <h4 className="font-display text-sm font-semibold text-text-primary leading-snug line-clamp-2">
                    {note.title || <span className="text-text-tertiary italic">Untitled note</span>}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-1 mt-1.5">
                    {preview || <span className="text-text-tertiary italic">No content yet…</span>}
                  </p>
                </div>
                <div className="border-t border-border-default/60" />
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${getTemplateStyle(template)}`}>
                      {template}
                    </span>
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <TextAlignLeft size={10} weight="bold" /> {wordCount}w
                    </span>
                    <button
                      onClick={(e) => requestDelete(e, note.local_id)}
                      className="p-1 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash size={11} weight="bold" />
                    </button>
                  </div>
                  <span className="text-[10px] text-text-tertiary">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pendingDeleteId && (
        <DeleteConfirmModal
          noteTitle={pendingNote?.title}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Tabs Section ─────────────────────────────────────────────────────────────

function TabsSection({ tabs, addTab, updateTab, deleteTab, isAdding, setIsAdding }) {
  const [newTab, setNewTab] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs;
    const query = searchQuery.toLowerCase();
    return tabs.filter(tab =>
      tab.text.toLowerCase().includes(query) ||
      (tab.context && tab.context.toLowerCase().includes(query))
    );
  }, [tabs, searchQuery]);

  const handleAdd = () => {
    if (!newTab.trim()) return;
    addTab(newTab.trim());
    setNewTab('');
    setIsAdding(false);
  };

  const handleSaveEdit = (tabId) => {
    if (!editText.trim()) return;
    updateTab(tabId, editText.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative group">
          <MagnifyingGlass size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tabs…"
            className="w-full pl-8 pr-3 py-2 bg-bg-subtle/50 border border-border-default/60 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Inline Add Tab Form */}
      {isAdding && (
        <div className="px-3 pb-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-bg-subtle border border-accent-primary/30 shadow-inner">
            <textarea
              autoFocus
              value={newTab}
              onChange={(e) => setNewTab(e.target.value)}
              placeholder="What's on your mind?…"
              className="w-full bg-transparent text-sm text-text-primary focus:outline-none min-h-[80px] resize-none leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-text-tertiary hover:bg-border-default/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTab.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-accent-primary text-white shadow-md shadow-accent-primary/20 hover:bg-accent-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <FloppyDisk size={12} weight="bold" /> Save Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {filteredTabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-bg-subtle flex items-center justify-center mb-4 text-text-placeholder border border-border-default/40">
              {searchQuery ? <MagnifyingGlass size={26} weight="bold" /> : <Note size={26} weight="bold" />}
            </div>
            <h4 className="text-sm font-bold text-text-secondary">
              {searchQuery ? 'No matches' : 'No tabs yet'}
            </h4>
            <p className="text-[11px] text-text-tertiary mt-2 leading-relaxed max-w-[180px]">
              {searchQuery ? `No tab matching "${searchQuery}"` : 'Capture ideas or quotes from your reading.'}
            </p>
          </div>
        ) : (
          filteredTabs.map(tab => (
            <div
              key={tab.id}
              className="group flex flex-col gap-3 p-4 rounded-2xl bg-bg-elevated border border-border-default/50 hover:border-accent-primary/20 transition-all duration-300 relative overflow-hidden"
            >
              {tab.type === 'highlight_note' && !editingId && (
                <div className="absolute top-0 right-0 w-10 h-10 bg-accent-primary/5 rounded-bl-[2rem] flex items-start justify-end p-1.5 text-accent-primary opacity-20 pointer-events-none">
                  <Quotes size={10} weight="fill" />
                </div>
              )}
              {editingId === tab.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-bg-subtle border border-accent-primary text-sm text-text-primary focus:outline-none min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-text-tertiary hover:bg-bg-subtle transition-all"><X size={14} weight="bold" /></button>
                    <button onClick={() => handleSaveEdit(tab.id)} className="p-1.5 px-3 rounded-lg bg-accent-primary text-white font-bold text-xs flex items-center gap-1.5"><FloppyDisk size={12} weight="bold" /> Save</button>
                  </div>
                </div>
              ) : (
                <>
                  {tab.context && (
                    <div className="bg-bg-subtle/50 p-2.5 rounded-xl border-l-4 border-accent-primary/30">
                      <p className="text-[9px] text-accent-primary font-black uppercase tracking-widest mb-1 opacity-60">Context</p>
                      <p className="text-[12px] text-text-secondary italic line-clamp-2">&ldquo;{tab.context}&rdquo;</p>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-[13px] text-text-primary leading-relaxed font-medium flex-1">{tab.text}</p>
                    <div className="flex flex-col gap-1 transition-all duration-300">
                      <button onClick={() => { setEditingId(tab.id); setEditText(tab.text); }} className="p-1.5 rounded-lg bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-accent-primary transition-all"><PencilSimple size={12} weight="bold" /></button>
                      <button onClick={() => deleteTab(tab.id)} className="p-1.5 rounded-lg bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-red-500 transition-all"><Trash size={12} weight="bold" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border-default/30">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-tertiary uppercase tracking-wider">
                      <CalendarBlank size={10} weight="bold" className="opacity-40" />
                      {tab.updatedAt ? new Date(tab.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </div>
                    <span className="text-[9px] font-black text-text-placeholder uppercase tracking-tighter">
                      {tab.type === 'highlight_note' ? 'Highlight' : 'Manual'}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

function ReaderNotebookPanel({ setNotebookPanel, onAddNote, readerControls, bookId }) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'tabs'
  const [isAddingTab, setIsAddingTab] = useState(false);
  const { fetchNotesByBook, notes } = useBookNotesStore();

  const {
    tabs = [],
    addTab,
    updateTab,
    deleteTab,
  } = readerControls || {};

  useEffect(() => {
    if (bookId) fetchNotesByBook(bookId);
  }, [bookId, fetchNotesByBook]);

  const notesCount = notes.length;
  const tabsCount = tabs.length;

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[200] bg-bg-elevated md:relative md:inset-auto md:w-80 md:h-full md:border-r md:border-border-default md:shrink-0 font-sans shadow-2xl md:shadow-none animate-in slide-in-from-left duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border-default shrink-0">
        <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">Notebook</h2>
        <button
          onClick={() => setNotebookPanel(false)}
          className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex items-center gap-1 bg-bg-subtle rounded-full p-1">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === 'notes'
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Notes
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'notes' ? 'bg-accent-primary text-white' : 'bg-border-default text-text-tertiary'}`}>
              {notesCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tabs')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === 'tabs'
                ? 'bg-bg-elevated text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Tabs
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'tabs' ? 'bg-accent-primary text-white' : 'bg-border-default text-text-tertiary'}`}>
              {tabsCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── Add Button ── */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        {activeTab === 'notes' ? (
          <button
            onClick={() => {
              setNotebookPanel(false);
              onAddNote('new');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-primary text-white text-xs font-bold hover:bg-accent-primary/90 active:scale-95 transition-all shadow-md shadow-accent-primary/20"
          >
            <Plus size={14} weight="bold" /> Add Note
          </button>
        ) : (
          <button
            onClick={() => {
              setActiveTab('tabs');
              setIsAddingTab(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border-default text-text-tertiary text-xs font-bold hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5 active:scale-95 transition-all"
          >
            <Plus size={14} weight="bold" /> Add Tab
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'notes' ? (
          <NotesSection bookId={bookId} onAddNote={(noteId) => { setNotebookPanel(false); onAddNote(noteId); }} />
        ) : (
          <TabsSection 
            tabs={tabs} 
            addTab={addTab} 
            updateTab={updateTab} 
            deleteTab={deleteTab} 
            isAdding={isAddingTab}
            setIsAdding={setIsAddingTab}
          />
        )}
      </div>
    </aside>
  );
}

export default ReaderNotebookPanel;
