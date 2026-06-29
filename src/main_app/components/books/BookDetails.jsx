import React, { useContext, useState } from 'react'
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import { ArrowLeft, Heart, ShareNetwork, FolderSimplePlus, CheckCircle, Trash, X, PencilSimple } from '@phosphor-icons/react';
import useSpaceStore from '../../store/spaceStore';
import useThemeStore from '../../store/themeStore';

import BookCover from './BookCover';
import DocumentChatHistory from './book_details_related/DocumentChatHistory';
import DocumentBookmarks from './book_details_related/DocumentBookmarks';
import DocumentNotes from './book_details_related/DocumentNotes';
import DocumentsWords from './book_details_related/DocumentsWords';
import DocumentsReviews from './book_details_related/DocumentsReviews';
import DocumentsAdvanced from './book_details_related/DocumentsAdvanced';
import DocumentQuizzes from './book_details_related/DocumentQuizzes';
import DocumentAnalytics from './book_details_related/DocumentAnalytics';

function BookDetails() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { books = [], toggleFavorite, deleteBookFromShelves } = useContext(BookContext) || {};
    const { spaces, addBookToSpace, removeBookFromSpace } = useSpaceStore();
    const { resolvedTheme } = useThemeStore();

    const [activeTab, setActiveTab] = useState('chat');
    const [showSpaceModal, setShowSpaceModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Find the book first
    const book = books.find(b => String(b.id) === bookId);
    const isInAnySpace = spaces.filter(s => !s.isSystem).some(s => s.bookIds.includes(book?.id));

    const handleBookmarkClick = (e) => {
        e.stopPropagation();
        if (!book) return;
        const currentIds = [];
        spaces.filter(s => !s.isSystem).forEach(s => {
            if (s.bookIds.includes(book.id)) currentIds.push(s.id);
        });
        setSelectedIds(currentIds);
        setShowSpaceModal(true);
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleConfirmAddToSpace = async () => {
        if (!book) return;
        // Close modal immediately so user doesn't see states change while syncing
        setShowSpaceModal(false);

        // Sync Custom Spaces
        for (const space of spaces.filter(s => !s.isSystem)) {
            const wasIn = space.bookIds.includes(book.id);
            const shouldBeIn = selectedIds.includes(space.id);
            
            if (shouldBeIn && !wasIn) {
                await addBookToSpace(space.id, book.id);
            } else if (!shouldBeIn && wasIn) {
                await removeBookFromSpace(space.id, book.id);
            }
        }
    };

    const tabs = [
        { id: 'chat', label: 'Chat', component: DocumentChatHistory },
        { id: 'bookmarks', label: 'Bookmarks', component: DocumentBookmarks },
        { id: 'notes', label: 'Notes', component: DocumentNotes },
        { id: 'words', label: 'Words', component: DocumentsWords },
        { id: 'review', label: 'Review', component: DocumentsReviews },
        { id: 'advanced', label: 'Advanced', component: DocumentsAdvanced },
        { id: 'quiz', label: 'Quizzes', component: DocumentQuizzes },
        { id: 'analytics', label: 'Analytics', component: DocumentAnalytics }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || tabs[0].component;



    if (!book) {
        return (
            <div className="p-8 text-center text-gray-500 min-h-[50vh] flex flex-col items-center justify-center">
                <p className="text-xl font-medium mb-4">Book not found</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                    Return Home
                </button>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this book from your library?")) {
            deleteBookFromShelves(book.id);
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
            {/* Page Header */}
            <div className="relative flex justify-between items-center py-4 px-2 gap-3">
                <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
                    >
                        <ArrowLeft size={20} weight="bold" className="text-text-primary group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                    <h3 className='text-base font-bold font-display text-text-primary'>Book Details</h3>
                </div>

                <div className="w-[42px]" />
            </div>

            <div className="flex flex-col pt-8 items-start">
                <div className="book-header flex md:flex-row gap-8 lg:gap-12 flex-col w-full mb-12">
                    <div className='img-wrapper flex flex-col items-center justify-start gap-6'>
                        <div className="w-60 h-80 sm:w-64 sm:h-84 flex-shrink-0 rounded-2xl overflow-hidden mx-auto md:mx-0 border-4 border-white shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                            {book.cover ? (
                                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <BookCover title={book.title} author={book.author} className="w-full h-full" />
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="bg-accent-subtle text-accent-pressed dark:text-accent-pressed text-xs font-semibold px-4 py-1.5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 rounded-full tracking-widest transition-all">
                                {book.status || 'Library'}
                            </span>
                            <span className="bg-bg-subtle dark:bg-bg-dark-elevated text-text-tertiary dark:text-text-tertiary-dark text-xs font-semibold px-4 py-1.5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 rounded-full tracking-widest transition-all">
                                {Math.round(book.progress || 0)}% Completed
                            </span>
                        </div>
                    </div>

                    <div className="book-main-info flex flex-col gap-6 md:gap-8 md:w-full">
                        <div className="book-title text-center md:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-3 tracking-tightest break-all md:break-words leading-premium-tight">
                                {book.title}
                            </h1>
                            <p className="text-base sm:text-lg text-text-tertiary dark:text-text-tertiary-dark font-medium tracking-tight italic">by {book.author || "N/A"}</p>
                        </div>

                        <div className="max-w-2xl">
                            <h2 className="text-xs sm:text-sm font-bold text-text-placeholder dark:text-text-placeholder-dark uppercase tracking-[0.2em] mb-4">About this book</h2>
                            <div className="bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-card p-6 sm:p-8 hover:border-text-tertiary/20 dark:hover:border-text-tertiary-dark/20 transition-all duration-300 shadow-sm hover:shadow-md text-text-secondary dark:text-text-secondary-dark leading-premium-relaxed text-sm sm:text-base relative overflow-hidden group/desc mb-8">
                               
                                {book.description || "No description available for this title."}

                                {/* Quick Bookmarks / Status Section under description */}
                                {/* {(book.isFavorite || book.isBookmarked || (book.metadata?.bookmarks?.length > 0)) && (
                                    <div className="mt-6 pt-6 border-t border-border-default/50 flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-text-placeholder uppercase tracking-widest">Collections:</span>
                                            <div className="flex items-center gap-2">
                                                {book.isFavorite && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-500 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                                                        <Heart size={10} fill="currentColor" />
                                                        Favorite
                                                    </div>
                                                )}
                                                {book.isBookmarked && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-subtle text-accent-primary border border-accent-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                                                        <Bookmark size={10} fill="currentColor" />
                                                        Bookmarked
                                                    </div>
                                                )}
                                                {!book.isFavorite && !book.isBookmarked && (
                                                    <span className="text-[10px] font-medium text-text-tertiary">Not in any collections</span>
                                                )}
                                            </div>
                                        </div>

                                        {book.metadata?.bookmarks?.length > 0 && (
                                            <div className="flex items-center gap-2 ml-auto group/stats">
                                                <div className="flex items-center gap-1.5 text-text-tertiary group-hover/stats:text-accent-primary transition-colors">
                                                    <Bookmark size={12} className="opacity-60" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                        {book.metadata.bookmarks.length} Page Bookmarks
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )} */}
                            </div>
                        </div>

                        <div className="book-actions flex flex-col items-center md:items-start gap-4">

                            <div className="book-icons flex flex-wrap justify-center md:justify-start">
                                <button
                                    onClick={() => toggleFavorite(book.id)}
                                    className={`p-3 rounded-xl transition-all ${book.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-gray-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated/50'}`}
                                >
                                    <Heart size={20} weight={book.isFavorite ? 'fill' : 'regular'} />
                                </button>
                                <button className="p-3 text-gray-400 rounded-xl hover:text-success hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated/50 transition-all">
                                    <CheckCircle size={20} weight="bold" />
                                </button>
                                <button
                                    onClick={handleBookmarkClick}
                                    className={`p-3 rounded-xl transition-all ${isInAnySpace ? 'text-accent-primary bg-accent-subtle dark:bg-accent-subtle-dark hover:bg-accent-primary/20' : 'text-gray-400 hover:text-accent-primary hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated/50'}`}
                                    title="Add to Bookspace"
                                >
                                    <FolderSimplePlus size={20} weight={isInAnySpace ? 'fill' : 'regular'} />
                                </button>
                                <button className="p-3 text-gray-400 rounded-xl hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated/50 transition-all">
                                    <ShareNetwork size={20} weight="bold" />
                                </button>
                                <button onClick={handleDelete} className="p-3 text-gray-400 rounded-xl hover:text-error hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated/50 transition-all">
                                    <Trash size={20} weight="bold" />
                                </button>
                            </div>
                            <div className="w-full sm:w-auto text-center">
                                <button
                                    onClick={() => navigate(`/reader/${book.id}`)}
                                    className="w-full sm:w-auto px-12 py-3.5 bg-accent-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-0.5 transition-all text-center"
                                >
                                    Continue Reading
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="overflow-hidden max-w-[850px] mx-auto w-full bg-bg-subtle dark:bg-bg-elevated p-2.5 border-t border-black/10 dark:border-white/10 rounded-[3rem] shadow-sm">
                    <ul className="flex gap-2 overflow-x-auto py-2.5 bg-black/5 dark:bg-white/5 px-2.5 rounded-full items-center no-scrollbar border border-black/5 dark:border-white/5">
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-base font-medium transition-all p-2 px-4 rounded-full cursor-pointer whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'text-accent-primary dark:text-accent-primary-dark bg-accent-subtle dark:bg-accent-subtle-dark hover:border border-accent-hover dark:border-accent-hover-dark'
                                        : 'text-text-primary dark:text-text-primary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark hover:bg-neutral-50 dark:hover:bg-bg-dark-elevated'
                                    }`}
                            >
                                {tab.label}
                            </li>
                        ))}
                    </ul>

                    <div className="selected-section mt-2 min-h-[400px]">
                        <ActiveComponent book={book} />
                    </div>
                </div>
            </div>
            {/* Save to Space Modal */}
            {showSpaceModal && createPortal(
                <div className={resolvedTheme}>
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
                    onClick={(e) => { e.stopPropagation(); setShowSpaceModal(false); }}
                >
                    <div 
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-100 dark:border-neutral-800 flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 font-display">Save to Space</h3>
                            <button 
                                onClick={() => setShowSpaceModal(false)} 
                                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                            >
                                <X size={18} weight="bold" />
                            </button>
                        </div>
                        
                        <div className="p-3 max-h-[50vh] overflow-y-auto space-y-1 custom-scrollbar">
                            {/* Custom Spaces */}
                            {spaces.filter(s => !s.isSystem).map(space => {
                                const isSelected = selectedIds.includes(space.id);
                                return (
                                    <div 
                                        key={space.id}
                                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all group ${isSelected ? 'bg-accent-primary/5 border border-accent-primary/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'}`}
                                        onClick={() => toggleSelection(space.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold uppercase text-xs border border-indigo-100/50 dark:border-indigo-500/20">
                                                {space.name.substring(0, 2)}
                                            </div>
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-200 text-sm block">{space.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-accent-primary border-accent-primary' : 'border-neutral-300 dark:border-neutral-600 group-hover:border-accent-primary/50'}`}>
                                            {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {spaces.filter(s => !s.isSystem).length === 0 && (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FolderSimplePlus size={20} weight="bold" className="text-neutral-400" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No custom spaces yet</p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Create spaces to organize your library.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Action Button */}
                        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <button
                                onClick={handleConfirmAddToSpace}
                                className="w-full py-3.5 px-4 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-accent-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isInAnySpace ? <PencilSimple size={18} weight="fill" /> : <FolderSimplePlus size={18} weight="fill" />}
                                <span>{isInAnySpace ? "PencilSimple" : "Add to Bookspace"}</span>
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            , document.body)}
        </div>
    );
}

export default BookDetails;
