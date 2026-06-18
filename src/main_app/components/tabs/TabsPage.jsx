import React, { useContext, useState, useMemo } from 'react';
import { BookContext } from '../../context/BookContextInstance';
import { ArrowLeft, MagnifyingGlass, PencilSimple, Clock, BookOpen, CaretRight, Hash } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

function TabsPage() {
    const { books } = useContext(BookContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'recent'

    // Extract and compile all tabs from all books
    const allTabs = useMemo(() => {
        let extracted = [];
        (books || []).forEach(book => {
            const bookTabs = book?.metadata?.tabs || [];
            bookTabs.forEach(tab => {
                extracted.push({
                    ...tab,
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
    const filteredTabs = useMemo(() => {
        let filtered = allTabs;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(tab =>
                tab.text.toLowerCase().includes(q) ||
                tab.bookTitle.toLowerCase().includes(q)
            );
        }

        if (activeTab === 'recent') {
            // Just showing the 10 most recent if they prefer that
            filtered = filtered.slice(0, 10);
        }

        return filtered;
    }, [allTabs, searchQuery, activeTab]);

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
                        <h3 className='text-base md:text-lg font-bold font-display text-text-primary'>Tabs</h3>
                    </div>

                    <div className="w-[42px]" />
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
                            All ({allTabs.length})
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
                        <MagnifyingGlass className='absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder group-focus-within:text-accent-primary transition-colors' size={20} weight="bold" />
                        <input
                            type="text"
                            placeholder="Search tabs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full bg-bg-subtle border-2 border-border-default rounded-2xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-sm'
                        />
                    </div>
                </div>

                {/* Content Section */}
                {allTabs.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border-default rounded-card bg-bg-subtle/30'>
                        <div className='w-20 h-20 bg-bg-elevated text-text-placeholder rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-border-default'>
                            <PencilSimple size={32} weight="fill" />
                        </div>
                        <h3 className='text-2xl font-bold text-text-primary mb-3 font-display'>Your notebook is empty</h3>
                        <p className='text-text-secondary max-w-md mx-auto leading-relaxed mb-8'>
                            While reading a book, head over to the Tabs tab to jot down vital concepts. They will all appear aggregated right here.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className='bg-accent-primary text-bg-elevated px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-accent-primary/20 hover:-translate-y-1 transition-all active:translate-y-0'
                        >
                            Go to Library
                        </button>
                    </div>
                ) : filteredTabs.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-20 text-center'>
                        <MagnifyingGlass size={48} weight="bold" className='text-text-placeholder mb-4' />
                        <h3 className='text-xl font-bold text-text-primary mb-2'>No matching tabs found</h3>
                        <p className='text-text-secondary'>Try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className='columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6'>
                        {filteredTabs.map(tab => (
                            <div
                                key={`${tab.bookId}-${tab.id}`}
                                className='break-inside-avoid bg-bg-subtle border border-border-default rounded-card p-6 hover:shadow-xl hover:shadow-accent-subtle hover:border-accent-primary/30 transition-all duration-300 group flex flex-col gap-4 cursor-pointer'
                                onClick={() => navigate(`/book/${tab.bookId}`)}
                            >
                                {/* Book Reference */}
                                <div className='flex items-center gap-3 pb-4 border-b border-border-default/80'>
                                    {tab.bookCover ? (
                                        <img src={tab.bookCover} alt="Cover" className='w-10 h-14 object-cover rounded-md shadow-sm border border-border-default' />
                                    ) : (
                                        <div className='w-10 h-14 bg-bg-elevated rounded-md flex items-center justify-center border border-border-default shadow-sm'>
                                            <BookOpen size={16} weight="fill" className='text-text-tertiary' />
                                        </div>
                                    )}
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs font-bold text-accent-primary uppercase tracking-widest mb-1 truncate flex items-center gap-1'>
                                            <Hash size={12} weight="bold" /> Book
                                        </p>
                                        <h4 className='text-sm font-semibold text-text-primary truncate'>{tab.bookTitle}</h4>
                                    </div>
                                    <div className='w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-tertiary group-hover:bg-accent-primary group-hover:text-bg-elevated group-hover:border-accent-primary transition-all flex-shrink-0'>
                                        <CaretRight size={16} weight="bold" />
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div>
                                    <p className='text-text-primary leading-relaxed whitespace-pre-wrap text-[15px]'>
                                        {tab.text}
                                    </p>
                                </div>

                                {/* Timestamp */}
                                <div className='flex flex-wrap items-center justify-between gap-3 pt-2 mt-auto'>
                                    <span className='flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary uppercase tracking-widest bg-bg-elevated px-2.5 py-1 rounded-md border border-border-default'>
                                        <Clock size={12} weight="bold" />
                                        {formatDate(tab.updatedAt || tab.createdAt)}
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

export default TabsPage;
