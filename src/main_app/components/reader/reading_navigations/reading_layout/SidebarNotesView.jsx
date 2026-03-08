import React, { useState } from 'react';
import { FileText, Plus, Trash2, Edit3, Save, X, Calendar } from 'lucide-react';

/**
 * SidebarNotesView
 * Compact note-taking interface for the reader's left panel.
 */
function SidebarNotesView({ notes = [], addNote, updateNote, deleteNote }) {
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    const handleAdd = () => {
        if (!newNote.trim()) return;
        addNote(newNote.trim());
        setNewNote('');
        setIsAdding(false);
    };

    const handleEdit = (noteId, text) => {
        setEditingId(noteId);
        setEditText(text);
    };

    const handleSaveEdit = (noteId) => {
        if (!editText.trim()) return;
        updateNote(noteId, editText.trim());
        setEditingId(null);
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className='flex flex-col h-full bg-bg-elevated'>
            {/* Create Note Trigger/Form */}
            <div className='p-4 border-b border-border-default/50 bg-bg-subtle/30'>
                {isAdding ? (
                    <div className='flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300'>
                        <textarea
                            autoFocus
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="What's on your mind?..."
                            className='w-full p-3 rounded-xl bg-bg-elevated border border-accent-primary/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[100px] resize-none leading-relaxed'
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => setIsAdding(false)}
                                className='px-3 py-1.5 rounded-lg text-xs font-bold text-text-tertiary hover:bg-bg-subtle transition-all'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newNote.trim()}
                                className='px-4 py-1.5 rounded-lg text-xs font-bold bg-accent-primary text-white shadow-sm hover:bg-accent-hover disabled:opacity-50 transition-all flex items-center gap-1.5'
                            >
                                <Plus size={14} /> Save Note
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className='w-full p-3 rounded-2xl border-2 border-dashed border-border-default text-text-tertiary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-subtle/30 transition-all flex items-center justify-center gap-2 group'
                    >
                        <Pen size={16} className='group-hover:scale-110 transition-transform' />
                        <span className='text-sm font-bold'>Jot down a note</span>
                    </button>
                )}
            </div>

            {/* Notes list */}
            <div className='flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3'>
                {notes.length === 0 && !isAdding ? (
                    <div className='flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500'>
                        <div className='w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center mb-3 text-text-placeholder'>
                            <FileText size={22} strokeWidth={1.5} />
                        </div>
                        <p className='text-sm font-bold text-text-secondary'>Your notebook is empty</p>
                        <p className='text-[11px] text-text-tertiary mt-1 leading-relaxed uppercase tracking-wider'>
                            Take notes while reading to summarize or capture ideas.
                        </p>
                    </div>
                ) : (
                    notes.map(note => (
                        <div
                            key={note.id}
                            className='group flex flex-col gap-2 p-4 rounded-2xl bg-bg-subtle/50 border border-transparent hover:border-border-default transition-all duration-300'
                        >
                            {editingId === note.id ? (
                                <div className='flex flex-col gap-2'>
                                    <textarea
                                        autoFocus
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className='w-full p-3 rounded-xl bg-bg-elevated border border-accent-primary text-xs text-text-primary focus:outline-none min-h-[80px] resize-none'
                                    />
                                    <div className='flex justify-end gap-1.5'>
                                        <button onClick={() => setEditingId(null)} className='p-1.5 rounded-lg text-text-tertiary hover:bg-bg-subtle'><X size={14} /></button>
                                        <button onClick={() => handleSaveEdit(note.id)} className='p-1.5 rounded-lg bg-accent-primary text-white'><Save size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className='flex justify-between items-start gap-2'>
                                        <p className='text-sm text-text-primary leading-relaxed whitespace-pre-wrap flex-1'>
                                            {note.text}
                                        </p>
                                        <div className='flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                            <button onClick={() => handleEdit(note.id, note.text)} className='p-1.5 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-subtle'><Edit3 size={13} /></button>
                                            <button onClick={() => deleteNote(note.id)} className='p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10'><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-1 text-[9px] font-bold text-text-tertiary uppercase tracking-tighter'>
                                        <Calendar size={10} />
                                        {formatDate(note.updatedAt || note.createdAt)}
                                        {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
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

export default SidebarNotesView;
