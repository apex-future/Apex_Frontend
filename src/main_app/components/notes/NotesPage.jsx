import React, { useContext, useState, useMemo } from 'react';
import { BookContext } from '../../context/BookContextInstance';
import { ArrowLeft, Search, Pen, Clock, BookOpen, ChevronRight, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NotesPage() {
    const { books } = useContext(BookContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'recent'

    // Extract and compile all notes from all books
    const allNotes = useMemo(() => {
        let extracted = [];
        (books || []).forEach(book => {
            const bookNotes = book?.metadata?.notes || [];
            bookNotes.forEach(note => {
                extracted.push({
                    ...note,
                    bookId: book.id,
                    bookTitle: book.title,
                    bookCover: book.cover
                });
            });
        });

        // Sort by most recently updated
        extracted.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        return extracted;
    }, [books]);

    // Filter based on search query
    const filteredNotes = useMemo(() => {
        let filtered = allNotes;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(note =>
                note.text.toLowerCase().includes(q) ||
                note.bookTitle.toLowerCase().includes(q)
            );
        }

        if (activeTab === 'recent') {
            // Just showing the 10 most recent if they prefer that
            filtered = filtered.slice(0, 10);
        }

        return filtered;
    }, [allNotes, searchQuery, activeTab]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

        if (isToday) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className='min-h-screen bg-bg-elevated w-full overflow-x-hidden'>
            {/* Page Header - Glassmorphic with Dark Adaptation */}
            <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
                <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <h3 className='text-xl font-bold font-display text-text-primary'>Notes</h3>

                    <div className="w-10" />
                </div>
            </div>

            <div className='max-w-6xl mx-auto flex flex-col gap-10 px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500'>

                <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                    {/* Filter Tabs moved here for cleaner flow */}
                    <div className='flex gap-2 border-b border-border-default w-full md:w-auto overflow-x-auto custom-scrollbar pb-1'>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-5 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-bg-subtle text-accent-primary border  border-accent-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-subtle/50'}`}
                        >
                            All ({allNotes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('recent')}
                            className={`px-5 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'recent' ? 'bg-bg-subtle text-accent-primary border  border-accent-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-subtle/50'}`}
                        >
                            Recent
                        </button>
                    </div>

                    {/* Search Bar - Underneath header border but aligned to right on desktop */}
                    <div className='relative w-full md:w-80 group'>
                        <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary transition-colors' size={20} />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full bg-bg-subtle border-2 border-border-default rounded-2xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-sm'
                        />
                    </div>
                </div>

                {/* Content Section */}
                {allNotes.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border-default rounded-card bg-bg-subtle/30'>
                        <div className='w-20 h-20 bg-bg-elevated text-text-placeholder rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-border-default'>
                            <Pen size={32} />
                        </div>
                        <h3 className='text-2xl font-bold text-text-primary mb-3 font-display'>Your notebook is empty</h3>
                        <p className='text-text-secondary max-w-md mx-auto leading-relaxed mb-8'>
                            While reading a book, head over to the Notes tab to jot down vital concepts. They will all appear aggregated right here.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className='bg-accent-primary text-bg-elevated px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-accent-primary/20 hover:-translate-y-1 transition-all active:translate-y-0'
                        >
                            Go to Library
                        </button>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-20 text-center'>
                        <Search size={48} className='text-text-placeholder mb-4' />
                        <h3 className='text-xl font-bold text-text-primary mb-2'>No matching notes found</h3>
                        <p className='text-text-secondary'>Try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className='columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'>
                        {filteredNotes.map(note => (
                            <div
                                key={`${note.bookId}-${note.id}`}
                                className='break-inside-avoid bg-bg-subtle border border-border-default rounded-card p-6 hover:shadow-xl hover:shadow-accent-subtle hover:border-accent-primary/30 transition-all duration-300 group flex flex-col gap-4 cursor-pointer'
                                onClick={() => navigate(`/book/${note.bookId}`)}
                            >
                                {/* Book Reference */}
                                <div className='flex items-center gap-3 pb-4 border-b border-border-default/80'>
                                    {note.bookCover ? (
                                        <img src={note.bookCover} alt="Cover" className='w-10 h-14 object-cover rounded-md shadow-sm border border-border-default' />
                                    ) : (
                                        <div className='w-10 h-14 bg-bg-elevated rounded-md flex items-center justify-center border border-border-default shadow-sm'>
                                            <BookOpen size={16} className='text-text-tertiary' />
                                        </div>
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs font-bold text-accent-primary uppercase tracking-widest mb-1 truncate flex items-center gap-1'>
                                            <Hash size={12} /> Book
                                        </p>
                                        <h4 className='text-sm font-semibold text-text-primary truncate'>{note.bookTitle}</h4>
                                    </div>
                                    <div className='w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-tertiary group-hover:bg-accent-primary group-hover:text-bg-elevated group-hover:border-accent-primary transition-all flex-shrink-0'>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>

                                {/* Note Content */}
                                <div>
                                    <p className='text-text-primary leading-relaxed whitespace-pre-wrap text-[15px]'>
                                        {note.text}
                                    </p>
                                </div>

                                {/* Timestamp */}
                                <div className='flex flex-wrap items-center justify-between gap-3 pt-2 mt-auto'>
                                    <span className='flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary uppercase tracking-widest bg-bg-elevated px-2.5 py-1 rounded-md border border-border-default'>
                                        <Clock size={12} />
                                        {formatDate(note.updatedAt || note.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default NotesPage;
