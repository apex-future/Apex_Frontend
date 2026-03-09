import React, { useContext, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { BookContext } from '../../context/BookContextInstance';
import { ArrowLeft, Share2, CheckCircle2, Trash2 } from 'lucide-react';

import BookCover from './BookCover';
import DocumentChatHistory from './book_details_related/DocumentChatHistory';
import DocumentNotes from './book_details_related/DocumentNotes';
import DocumentsWords from './book_details_related/DocumentsWords';
import DocumentsReviews from './book_details_related/DocumentsReviews';
import DocumentsAdvanced from './book_details_related/DocumentsAdvanced';

function BookDetails() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const { books, deleteBookFromShelves } = useContext(BookContext);

    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { id: 'chat', label: 'Chat', component: DocumentChatHistory },
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
                            <div className="bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md border-2 border-border-default rounded-2xl p-6 sm:p-8 hover:border-accent-primary/10 hover:shadow-sm hover:shadow-neutral-200/50 transition-all duration-500 text-text-secondary leading-premium-relaxed text-sm sm:text-base relative overflow-hidden group/desc mb-8">
                                <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary/20 group-hover/desc:bg-accent-primary transition-colors" />
                                {book.description || "No description available for this title."}
                            </div>

                            <div className="book-actions flex flex-col items-center md:items-start gap-8">
                                <div className="book-icons flex items-center justify-center md:justify-start gap-3">
                                    <button className="p-3.5 text-text-placeholder rounded-2xl hover:text-success hover:bg-success/5 transition-all border border-border-default/50 hover:border-success/30 shadow-sm active:scale-95">
                                        <CheckCircle2 size={22} />
                                    </button>
                                    <button className="p-3.5 text-text-placeholder rounded-2xl hover:text-accent-primary hover:bg-accent-subtle transition-all border border-border-default/50 hover:border-accent-primary/30 shadow-sm active:scale-95">
                                        <Share2 size={22} />
                                    </button>
                                    <button onClick={handleDelete} className="p-3.5 text-text-placeholder rounded-2xl hover:text-error hover:bg-error/5 transition-all border border-border-default/50 hover:border-error/30 shadow-sm active:scale-95">
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <button
                                        onClick={() => navigate(`/reader/${book.id}`)}
                                        className="w-full sm:w-auto px-16 py-4.5 bg-accent-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-accent-primary/40 hover:-translate-y-1.5 active:translate-y-0 transition-all text-xs"
                                    >
                                        Continue Reading
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden max-w-[850px] mx-auto w-full bg-gradient-to-br from-neutral-100/90 to-neutral-50/60 backdrop-blur-xl p-2.5 border border-border-default/50 rounded-[3rem] shadow-2xl">
                    <ul className="flex gap-2 overflow-x-auto py-2.5 bg-white/60 backdrop-blur-md px-2.5 rounded-full items-center no-scrollbar">
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-[10px] font-black transition-all p-3.5 px-9 rounded-full cursor-pointer whitespace-nowrap uppercase tracking-[0.25em]
                                    ${activeTab === tab.id
                                        ? 'text-accent-primary bg-accent-subtle shadow-inner'
                                        : 'text-text-placeholder hover:text-text-primary hover:bg-neutral-50/50'
                                    }`}
                            >
                                {tab.label}
                            </li>
                        ))}
                    </ul>

                    <div className="selected-section mt-6 min-h-[500px] p-6">
                        <ActiveComponent book={book} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookDetails;
