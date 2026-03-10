import React, { useContext, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import { ArrowLeft, Heart, Share2, Bookmark, CheckCircle2, Trash2 } from 'lucide-react';

import BookCover from './BookCover';
import DocumentChatHistory from './book_details_related/DocumentChatHistory';
import DocumentBookmarks from './book_details_related/DocumentBookmarks';
import DocumentNotes from './book_details_related/DocumentNotes';
import DocumentsWords from './book_details_related/DocumentsWords';
import DocumentsReviews from './book_details_related/DocumentsReviews';
import DocumentsAdvanced from './book_details_related/DocumentsAdvanced';

function BookDetails() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { books, toggleFavorite, toggleBookmarkedBook, deleteBookFromShelves } = useContext(BookContext);

    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { id: 'chat', label: 'Chat', component: DocumentChatHistory },
        { id: 'bookmarks', label: 'Bookmarks', component: DocumentBookmarks },
        { id: 'notes', label: 'Notes', component: DocumentNotes },
        { id: 'words', label: 'Words', component: DocumentsWords },
        { id: 'review', label: 'Review', component: DocumentsReviews },
        { id: 'advanced', label: 'Advanced', component: DocumentsAdvanced }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || tabs[0].component;

    // Find the book by converting ID to string for comparison (as useParams returns strings)
    const book = books.find(b => String(b.id) === bookId);

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
            <div className="relative flex justify-between items-center py-4 px-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-all group"
                >
                    <ArrowLeft size={20} className="text-text-primary group-hover:-translate-x-1 transition-transform" />
                </button>

                <h3 className='text-lg font-semibold text-text-tertiary tracking-tight'>Book Details</h3>

                <div className="w-9" />
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
                            <span className="bg-accent-subtle text-accent-pressed text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                {book.status || 'Library'}
                            </span>
                            <span className="bg-neutral-100 text-text-tertiary text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                {Math.round(book.progress || 0)}% Completed
                            </span>
                        </div>
                    </div>

                    <div className="book-main-info flex flex-col gap-6 md:gap-8 md:w-full">
                        <div className="book-title text-center md:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display text-text-primary mb-3 tracking-tightest break-all md:break-words leading-premium-tight">
                                {book.title}
                            </h1>
                            <p className="text-base sm:text-lg text-text-tertiary font-medium tracking-tight italic">by {book.author || "N/A"}</p>
                        </div>

                        <div className="max-w-2xl">
                            <h2 className="text-xs sm:text-sm font-bold text-text-placeholder uppercase tracking-[0.2em] mb-4">About this book</h2>
                            <div className="bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md border-2 border-border-default rounded-2xl p-6 sm:p-8 hover:border-accent-primary/10 hover:shadow-sm hover:shadow-neutral-200/50 transition-all duration-500 text-text-secondary leading-premium-relaxed text-sm sm:text-base relative overflow-hidden group/desc">
                            
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
                                    className={`p-3 rounded-xl transition-all ${book.isFavorite ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-neutral-100'}`}
                                >
                                    <Heart size={20} fill={book.isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                <button className="p-3 text-gray-400 rounded-xl hover:text-success hover:bg-neutral-100 transition-all">
                                    <CheckCircle2 size={20} />
                                </button>
                                <button
                                    onClick={() => toggleBookmarkedBook(book.id)}
                                    className={`p-3 rounded-xl transition-all ${book.isBookmarked ? 'text-accent-primary bg-accent-subtle hover:bg-accent-primary/20' : 'text-gray-400 hover:text-accent-primary hover:bg-neutral-100'}`}
                                >
                                    <Bookmark size={20} fill={book.isBookmarked ? 'currentColor' : 'none'} />
                                </button>
                                <button className="p-3 text-gray-400 rounded-xl hover:text-blue-500 hover:bg-neutral-100 transition-all">
                                    <Share2 size={20} />
                                </button>
                                <button onClick={handleDelete} className="p-3 text-gray-400 rounded-xl hover:text-error hover:bg-neutral-100 transition-all">
                                    <Trash2 size={20} />
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

                <div className="overflow-hidden max-w-[750px] mx-auto w-full bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md p-2 border-2 border-border-default rounded-2xl">
                    <ul className="flex gap-6 overflow-x-auto py-2 bg-white px-2 rounded-full items-center ">
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-base font-medium transition-all p-2 px-4 rounded-full cursor-pointer whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'text-accent-primary bg-accent-subtle hover:border border-accent-hover'
                                        : 'text-text-primary hover:text-text-secondary hover:bg-neutral-50'
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
        </div>
    );
}

export default BookDetails;
