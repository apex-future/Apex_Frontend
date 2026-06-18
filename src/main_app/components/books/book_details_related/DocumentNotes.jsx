import React, { useState, useContext, useMemo } from 'react';
import { BookContext } from '../../../context/BookContextInstance';
import { Trash2, Edit3, Save, X, Plus, Calendar, FileText, Search, StickyNote, Quote } from 'lucide-react';

function DocumentNotes({ book }) {
  const { addNote, updateNote, deleteNote } = useContext(BookContext);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const notes = book?.metadata?.notes || [];

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(note =>
      note.text.toLowerCase().includes(query) ||
      (note.context && note.context.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(book.id, newNoteText.trim());
    setNewNoteText('');
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = (noteId) => {
    if (!editText.trim()) return;
    updateNote(book.id, noteId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(book.id, noteId);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className='flex flex-col h-full gap-8 font-sans'>
      {/* Search & Actions Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
        <div className='relative w-full sm:max-w-md group'>
          <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
            <Search size={18} className='text-text-placeholder dark:text-text-placeholder-dark group-focus-within:text-accent-primary transition-colors' />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search through your notes..."
            className='w-full pl-11 pr-4 py-3.5 bg-bg-subtle/50 dark:bg-bg-dark-elevated/50 border-t border-black/10 dark:border-white/10/50 dark:border-border-default-dark/50 rounded-[2rem] text-sm text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all'
          />
        </div>
      </div>

      {/* New Note Form */}
      <div className='bg-white/40 dark:bg-bg-dark-elevated/40 backdrop-blur-md border-t border-black/10 dark:border-white/10/50 dark:border-border-default-dark/50 rounded-[2.5rem] p-6 sm:p-8 shadow-sm transition-all focus-within:shadow-xl focus-within:shadow-accent-primary/5 focus-within:border-accent-primary/20'>
        <form onSubmit={handleAddNote} className='flex flex-col gap-5'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 rounded-2xl bg-accent-subtle dark:bg-accent-subtle-dark text-accent-primary dark:text-accent-primary-dark'>
              <FileText size={20} />
            </div>
            <h3 className='text-sm font-black text-text-primary dark:text-text-primary-dark uppercase tracking-[0.2em]'>
              New Chapter Note
            </h3>
          </div>
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder='Type your thoughts, summaries, or key takeaways...'
            className='w-full min-h-[150px] bg-bg-subtle/30 dark:bg-bg-dark/30 border-t border-black/10 dark:border-white/10/40 dark:border-border-default-dark/40 rounded-[2rem] p-6 text-text-primary dark:text-text-primary-dark text-[15px] resize-none focus:outline-none focus:bg-white/80 dark:focus:bg-bg-dark-elevated transition-all custom-scrollbar placeholder:text-text-placeholder dark:placeholder:text-text-placeholder-dark leading-premium-relaxed'
          />
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={!newNoteText.trim()}
              className='flex items-center gap-2 bg-accent-primary text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-accent-primary/20'
            >
              <Plus size={16} />
              Commit Note
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className='flex flex-col gap-6 pb-12'>
        {filteredNotes.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-700'>
            <div className='w-24 h-24 bg-bg-subtle/50 dark:bg-bg-dark-elevated/50 text-text-placeholder dark:text-text-placeholder-dark rounded-[3rem] flex items-center justify-center mb-6 border-t border-black/10 dark:border-white/10/30 dark:border-border-default-dark/30 shadow-inner'>
              {searchQuery ? <Search size={40} strokeWidth={1} /> : <StickyNote size={40} strokeWidth={1} />}
            </div>
            <h3 className='text-xl font-black text-text-secondary dark:text-text-secondary-dark uppercase tracking-widest mb-3'>
              {searchQuery ? 'No results found' : 'Empty Notebook'}
            </h3>
            <p className='text-text-placeholder dark:text-text-placeholder-dark max-w-sm text-sm uppercase tracking-tighter leading-relaxed'>
              {searchQuery ? `We couldn't find any note matching "${searchQuery}"` : 'Start taking notes to capture important ideas and summaries from this book.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className='bg-white/50 dark:bg-bg-dark-elevated/50 backdrop-blur-sm border-t border-black/10 dark:border-white/10/40 dark:border-border-default-dark/40 rounded-[2.5rem] p-6 sm:p-10 hover:border-accent-primary/30 transition-all duration-500 group animate-in slide-in-from-bottom-4 relative overflow-hidden'
            >
              {note.type === 'highlight_note' && !editingId && (
                <div className='absolute top-0 right-0 w-20 h-20 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-bl-[4rem] flex items-start justify-end p-6 text-accent-primary/20 dark:text-accent-primary-dark/20 pointer-events-none'>
                  <Quote size={24} />
                </div>
              )}

              {editingId === note.id ? (
                <div className='flex flex-col gap-5'>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className='w-full min-h-[120px] bg-bg-subtle/50 dark:bg-bg-dark/50 border border-accent-primary/30 rounded-[2rem] p-6 text-text-primary dark:text-text-primary-dark text-[15px] resize-none focus:outline-none focus:ring-4 focus:ring-accent-primary/5 transition-all leading-premium-relaxed'
                  />
                  <div className='flex justify-end gap-3'>
                    <button
                      onClick={cancelEdit}
                      className='flex items-center gap-2 px-6 py-2.5 rounded-full text-text-placeholder dark:text-text-placeholder-dark hover:text-text-secondary dark:hover:text-text-secondary-dark hover:bg-bg-subtle dark:hover:bg-bg-dark transition-all font-bold text-xs uppercase tracking-widest'
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={!editText.trim()}
                      className='flex items-center gap-2 px-8 py-2.5 rounded-full bg-accent-primary text-white hover:bg-accent-hover transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-accent-primary/10'
                    >
                      <Save size={14} /> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-6'>
                  {note.context && (
                    <div className='bg-accent-subtle/30 dark:bg-accent-subtle-dark/30 p-5 rounded-[1.5rem] border-l-4 border-accent-primary/40 relative'>
                      <span className='absolute -top-3 left-4 px-3 py-1 bg-accent-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm'>Context Fragment</span>
                      <p className='text-sm text-accent-pressed/80 dark:text-accent-pressed-dark/80 italic leading-premium-relaxed'>"{note.context}"</p>
                    </div>
                  )}

                  <div className='flex justify-between items-start gap-6'>
                    <p className='text-text-primary dark:text-text-primary-dark text-[17px] leading-premium-relaxed whitespace-pre-wrap flex-1 mt-1 font-medium'>
                      {note.text}
                    </p>
                    <div className='flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0'>
                      <button
                        onClick={() => startEdit(note)}
                        className='p-3 rounded-2xl text-text-placeholder dark:text-text-placeholder-dark hover:text-accent-primary dark:hover:text-accent-primary-dark hover:bg-accent-subtle dark:hover:bg-accent-subtle-dark transition-all border border-transparent hover:border-accent-primary/10 shadow-sm hover:shadow-md'
                        title='Edit note'
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className='p-3 rounded-2xl text-text-placeholder dark:text-text-placeholder-dark hover:text-error hover:bg-error/5 transition-all border border-transparent hover:border-error/10 shadow-sm hover:shadow-md'
                        title='Delete note'
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className='flex items-center justify-between pt-6 border-t border-border-default/30 dark:border-border-default-dark/30'>
                    <div className='flex items-center gap-3 text-[10px] font-black text-text-placeholder dark:text-text-placeholder-dark uppercase tracking-[0.2em]'>
                      <Calendar size={14} className='opacity-40' />
                      {formatDate(note.updatedAt || note.createdAt)}
                      {note.updatedAt && note.updatedAt !== note.createdAt && <span className='lowercase opacity-50 font-medium'>(edited)</span>}
                    </div>
                    <span className='text-[9px] font-black text-white px-3 py-1 rounded-full bg-text-placeholder/20 uppercase tracking-widest'>
                      {note.type === 'highlight_note' ? 'Reading Highlight' : 'Manuscript Note'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentNotes;
