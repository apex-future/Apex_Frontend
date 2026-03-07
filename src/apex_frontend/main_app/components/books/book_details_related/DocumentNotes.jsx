import React, { useState, useContext } from 'react';
import { BookContext } from '../../../context/BookContextInstance';
import { Trash2, Edit2, Save, X, Plus, Calendar, FileText } from 'lucide-react';

function DocumentNotes({ book }) {
  const { addNote, updateNote, deleteNote } = useContext(BookContext);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const notes = book?.metadata?.notes || [];

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className='flex flex-col h-full gap-6'>
      {/* New Note Form */}
      <div className='bg-bg-elevated border-2 border-border-default rounded-3xl p-5 md:p-6 shadow-sm transition-all focus-within:border-accent-primary focus-within:shadow-md'>
        <form onSubmit={handleAddNote} className='flex flex-col gap-4'>
          <h3 className='text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2'>
            <FileText size={16} className='text-accent-primary' />
            Create Note
          </h3>
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder='Type your thoughts, summaries, or key takeaways...'
            className='w-full min-h-[120px] bg-bg-subtle border border-border-default rounded-2xl p-4 text-text-primary text-[15px] resize-y focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all custom-scrollbar placeholder:text-text-placeholder leading-relaxed'
          />
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={!newNoteText.trim()}
              className='flex items-center gap-2 bg-accent-primary text-bg-elevated px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-accent-primary/20'
            >
              <Plus size={18} />
              Save Note
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className='flex flex-col gap-4'>
        {notes.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500'>
            <div className='w-16 h-16 bg-bg-subtle text-text-tertiary rounded-2xl flex items-center justify-center mb-4 border border-border-default/50'>
              <FileText size={28} />
            </div>
            <h3 className='text-xl font-bold text-text-primary mb-2'>No notes yet</h3>
            <p className='text-text-secondary max-w-sm'>
              Start taking notes to capture important ideas and summaries from this book.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className='bg-bg-elevated border border-border-default rounded-2xl p-5 hover:border-text-tertiary transition-all group animate-in slide-in-from-bottom-2'
            >
              {editingId === note.id ? (
                <div className='flex flex-col gap-4'>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className='w-full min-h-[100px] bg-bg-subtle border border-border-default rounded-xl p-4 text-text-primary text-[15px] resize-y focus:outline-none focus:ring-2 focus:ring-accent-primary/20 custom-scrollbar leading-relaxed'
                  />
                  <div className='flex justify-end gap-3'>
                    <button
                      onClick={cancelEdit}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary hover:bg-bg-subtle transition-all font-medium'
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={!editText.trim()}
                      className='flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-bg-elevated hover:bg-accent-hover transition-all font-medium shadow-md shadow-accent-primary/20'
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  <div className='flex justify-between items-start gap-4'>
                    <p className='text-text-primary text-[15px] leading-relaxed whitespace-pre-wrap flex-1 mt-1'>
                      {note.text}
                    </p>
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
                      <button
                        onClick={() => startEdit(note)}
                        className='p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-subtle transition-all'
                        title='Edit note'
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className='p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-all'
                        title='Delete note'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider pt-2 border-t border-border-default/50'>
                    <Calendar size={12} />
                    {formatDate(note.updatedAt || note.createdAt)}
                    {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
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