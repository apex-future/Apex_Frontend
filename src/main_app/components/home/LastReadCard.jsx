import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../books/BookCover';

const LastReadCard = ({ book, isLoading }) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col">
                <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Last Read</h2>
                <div className="bg-card-glass backdrop-blur-md rounded-card p-4 border border-border-default shadow-sm min-h-[14rem] flex-1 flex flex-col justify-between">
                    <div className="flex gap-4 md:gap-8 flex-1 mb-4">
                        {/* Cover skeleton */}
                        <div className="w-24 h-36 xs:w-32 xs:h-44 rounded-md flex-shrink-0 bg-white/5 animate-pulse" />
                        {/* Info skeleton */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex flex-col gap-3">
                                <div className="h-7 w-3/4 rounded-full bg-white/5 animate-pulse" />
                                <div className="h-4 w-1/2 rounded-full bg-white/5 animate-pulse" />
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                                <div className="flex justify-between">
                                    <div className="h-3 w-1/3 rounded-full bg-white/5 animate-pulse" />
                                    <div className="h-3 w-8 rounded-full bg-white/5 animate-pulse" />
                                </div>
                                <div className="h-1 w-full rounded-full bg-white/5 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    {/* Skeleton buttons */}
                    <div className="flex gap-3 w-full">
                        <div className="flex-1 h-8 rounded-xl bg-white/5 animate-pulse" />
                        <div className="flex-1 h-8 rounded-xl bg-white/5 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="w-full h-full flex flex-col">
                <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Last Read</h2>
                <div className="bg-card-glass backdrop-blur-md rounded-card p-4 border border-border-default min-h-[14rem] flex-1 flex items-center justify-center shadow-sm">
                    <p className="text-text-tertiary font-medium">No recent books</p>
                </div>
            </div>
        );
    }

    const currentBook = book;

    return (
        <div className="w-full h-full flex flex-col">
            <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Last Read</h2>
            <div
                className="bg-card-glass backdrop-blur-md rounded-card p-4 border border-border-default transition-all duration-300 group overflow-hidden shadow-sm relative min-h-[14rem] flex-1 flex flex-col justify-between"
            >
                <div className="flex gap-4 md:gap-8 w-full overflow-hidden flex-1 mb-4">
                    <div className="w-24 h-36 xs:w-32 xs:h-44 rounded-md overflow-hidden shadow-sm flex-shrink-0 bg-bg-subtle border border-border-subtle group-hover:scale-[1.02] transition-transform duration-300">
                        {currentBook.cover ? (
                            <img src={currentBook.cover} alt="Book cover" className="w-full h-full object-cover" />
                        ) : (
                            <BookCover title={currentBook.title} author={currentBook.author} className="w-full h-full" />
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div className="mb-4 min-w-0">
                            <h2 className="font-display text-lg xs:text-2xl sm:text-3xl font-bold text-text-primary mb-2 line-clamp-2 tracking-tighter leading-premium-tight break-words">
                                {currentBook.title}
                            </h2>
                            <p className="text-xs sm:text-base text-text-tertiary font-medium line-clamp-1 italic tracking-tight truncate">by {currentBook.author}</p>
                        </div>

                        <div className="mb-2 w-full">
                            <div className="flex justify-between items-end mb-3 gap-2">
                                <span className="text-[10px] sm:text-sm font-medium text-text-tertiary tracking-wide uppercase truncate">
                                    {currentBook.progress > 0 ? `Page ${currentBook.currentPage || '?'} of ${currentBook.totalPages || '?'}` : 'Not started'}
                                </span>
                                <span className="text-xs sm:text-base font-bold text-accent-primary tabular-nums shrink-0">
                                    {currentBook.progress || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-border-default rounded-full h-1 overflow-hidden">
                                <div
                                    className="bg-accent-primary h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${currentBook.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom buttons row */}
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={() => navigate(`/reader/${currentBook.id}`)}
                        className="flex-1 py-2 px-4 rounded-xl font-bold text-xs bg-accent-primary text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-accent-primary/20 text-center"
                    >
                        Continue
                    </button>
                    <button 
                        onClick={() => navigate(`/book/${currentBook.id}`)}
                        className="flex-1 py-2 px-4 rounded-xl font-bold text-xs bg-bg-subtle hover:bg-bg-elevated text-text-secondary border border-border-default active:scale-95 transition-all text-center"
                    >
                        Practice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LastReadCard;
