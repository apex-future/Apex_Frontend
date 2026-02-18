import React from 'react'
import BookCover from '../books/BookCover';
import { useNavigate } from 'react-router-dom';

export default function Header({ lastReadBook }) {
    const user = { name: "User" };
    const navigate = useNavigate();

    const currentBook = lastReadBook || {
        title: "Welcome to Apex!",
        author: "Start your first book",
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        cover: null
    };

    return (
        <div className="w-full">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4">
                <div className="welcome-message mb-8">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-2 tracking-tightest leading-premium-tight">
                        Hey, {user.name}
                    </h1>
                    <p className="text-text-secondary font-medium tracking-tight">What's your pick today?</p>
                </div>

                <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Last Read</h2>
                <div
                    onClick={() => lastReadBook && navigate(`/reader/${lastReadBook.id}`)}
                    className={`bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md rounded-2xl p-4 md:p-6 border-2 border-border-default hover:border-text-tertiary hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300 group ${lastReadBook ? 'cursor-pointer' : ''}`}
                >
                    <div className="flex gap-4 md:gap-8">
                        <div className="w-28 h-40 xs:w-32 xs:h-44 rounded-md overflow-hidden shadow-lg flex-shrink-0 bg-neutral-100 border border-border-subtle group-hover:scale-[1.02] transition-transform duration-300">
                            {currentBook.cover ? (
                                <img src={currentBook.cover} alt="Book cover" className="w-full h-full object-cover" />
                            ) : (
                                <BookCover title={currentBook.title} author={currentBook.author} className="w-full h-full" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="mb-4">
                                <h2 className="font-display text-xl xs:text-2xl sm:text-3xl font-bold text-text-primary mb-2 line-clamp-2 tracking-tighter leading-premium-tight">
                                    {currentBook.title}
                                </h2>
                                <p className="text-sm sm:text-base text-text-tertiary font-medium line-clamp-1 italic tracking-tight">by {currentBook.author}</p>
                            </div>

                            <div className="mb-2">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-xs sm:text-sm font-medium text-text-tertiary tracking-wide uppercase">
                                        {currentBook.progress > 0 ? `Page ${currentBook.currentPage || '?'} of ${currentBook.totalPages || '?'}` : 'Not started'}
                                    </span>
                                    <span className="text-sm sm:text-base font-bold text-accent-primary tabular-nums">
                                        {currentBook.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-accent-primary h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${currentBook.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
