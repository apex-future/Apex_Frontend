import React, { useState, useMemo } from 'react';
import { FileText, Plus, Trash2, Edit3, Save, X, Calendar, Search, StickyNote, Quote } from 'lucide-react';

/**
 * SidebarNotesView
 * Enhanced note-taking interface with search and context support.
 */
function SidebarNotesView({ notes = [], addNote, updateNote, deleteNote }) {
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notes;
        const query = searchQuery.toLowerCase();
        return notes.filter(note =>
            note.text.toLowerCase().includes(query) ||
            (note.context && note.context.toLowerCase().includes(query))
        );
    }, [notes, searchQuery]);

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
        updateNote(noteId, editingId === noteId ? editText.trim() : notes.find(n => n.id === noteId).text);
        setEditingId(null);
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className='flex flex-col h-full bg-bg-elevated font-sans'>
            {/* Search Bar */}
            <div className='px-4 pt-4 pb-2'>
                <div className='relative group'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Search size={14} className='text-text-placeholder group-focus-within:text-accent-primary transition-colors' />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className='w-full pl-9 pr-4 py-2 bg-bg-subtle/50 border border-border-default/60 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/10 focus:bg-bg-elevated transition-all'
                    />
                </div>
            </div>

            {/* Create Note Trigger/Form */}
            <div className='p-4 pt-2 border-b border-border-default/30'>
                {isAdding ? (
                    <div className='flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300'>
                        <textarea
                            autoFocus
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="What's on your mind?..."
                            className='w-full p-4 rounded-2xl bg-bg-elevated border border-accent-primary/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[120px] resize-none leading-relaxed shadow-inner'
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => setIsAdding(false)}
                                className='px-4 py-2 rounded-xl text-xs font-bold text-text-tertiary hover:bg-bg-subtle transition-all'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newNote.trim()}
                                className='px-5 py-2 rounded-xl text-xs font-bold bg-accent-primary text-white shadow-lg shadow-accent-primary/20 hover:bg-accent-hover disabled:opacity-50 transition-all flex items-center gap-2'
                            >
                                <Plus size={14} /> Save Note
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className='w-full p-3 rounded-2xl border-2 border-dashed border-border-default text-text-tertiary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-subtle/20 transition-all flex items-center justify-center gap-2 group'
                    >
                        <Plus size={16} className='group-hover:scale-110 transition-transform' />
                        <span className='text-sm font-bold'>Jot down a note</span>
                    </button>
                )}
            </div>

            {/* Notes list */}
            <div className='flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-4'>
                {filteredNotes.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500'>
                        <div className='w-16 h-16 rounded-3xl bg-bg-subtle/50 flex items-center justify-center mb-4 text-text-placeholder border border-border-default/40'>
                            {searchQuery ? <Search size={28} strokeWidth={1.5} /> : <StickyNote size={28} strokeWidth={1.5} />}
                        </div>
                        <h4 className='text-sm font-bold text-text-secondary'>
                            {searchQuery ? 'No matches found' : 'Your notebook is empty'}
                        </h4>
                        <p className='text-[11px] text-text-tertiary mt-2 leading-relaxed uppercase tracking-wider max-w-[200px]'>
                            {searchQuery ? `We couldn't find any note matching "${searchQuery}"` : 'Capture ideas, quotes or summaries from your reading.'}
                        </p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className='group flex flex-col gap-3 p-5 rounded-3xl bg-bg-elevated border border-border-default/50 hover:border-accent-primary/20 hover:shadow-xl hover:shadow-accent-primary/5 transition-all duration-500 relative overflow-hidden'
                        >
                            {note.type === 'highlight_note' && !editingId && (
                                <div className='absolute top-0 right-0 w-12 h-12 bg-accent-primary/5 rounded-bl-[2.5rem] flex items-start justify-end p-2 text-accent-primary opacity-20 pointer-events-none'>
                                    <Quote size={12} />
                                </div>
                            )}

                            {editingId === note.id ? (
                                <div className='flex flex-col gap-3'>
                                    <textarea
                                        autoFocus
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className='w-full p-4 rounded-2xl bg-bg-subtle border border-accent-primary text-sm text-text-primary focus:outline-none min-h-[100px] resize-none shadow-inner'
                                    />
                                    <div className='flex justify-end gap-2'>
                                        <button onClick={() => setEditingId(null)} className='p-2 rounded-xl text-text-tertiary hover:bg-bg-subtle transition-all'><X size={16} /></button>
                                        <button onClick={() => handleSaveEdit(note.id)} className='p-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-accent-primary/20'><Save size={14} /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {note.context && (
                                        <div className='bg-bg-subtle/50 p-3 rounded-2xl border-l-4 border-accent-primary/30'>
                                            <p className='text-[10px] text-accent-primary font-black uppercase tracking-widest mb-1.5 opacity-60'>Linked Context</p>
                                            <p className='text-[13px] text-text-secondary italic line-clamp-3 leading-relaxed'>"{note.context}"</p>
                                        </div>
                                    )}

                                    <div className='flex justify-between items-start gap-4'>
                                        <p className='text-[15px] text-text-primary leading-relaxed font-medium flex-1'>
                                            {note.text}
                                        </p>
                                        <div className='flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-2 scale-90'>
                                            <button onClick={() => handleEdit(note.id, note.text)} className='p-2 rounded-xl bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-accent-primary hover:border-accent-primary/20 transition-all'><Edit3 size={14} /></button>
                                            <button onClick={() => deleteNote(note.id)} className='p-2 rounded-xl bg-bg-elevated border border-border-default shadow-sm text-text-tertiary hover:text-red-500 hover:border-red-100 transition-all'><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className='flex items-center justify-between pt-3 border-t border-border-default/30'>
                                        <div className='flex items-center gap-2 text-[10px] font-bold text-text-tertiary uppercase tracking-wider'>
                                            <Calendar size={12} className='opacity-40' />
                                            {formatDate(note.updatedAt || note.createdAt)}
                                            {note.updatedAt && note.updatedAt !== note.createdAt && <span className='lowercase opacity-50 font-medium'>(edited)</span>}
                                        </div>
                                        <span className='text-[9px] font-black text-text-placeholder uppercase tracking-tighter'>
                                            {note.type === 'highlight_note' ? 'Highlight Note' : 'Manual Note'}
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

export default SidebarNotesView;
