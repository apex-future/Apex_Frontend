import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from '../ui/BookCover';
import Card from '../ui/Card';
import WeeklyGoldenBar from '../quests/WeeklyGoldenBar';
import useOnboardingStore from '../../store/useOnboardingStore';
import { isValidAuthor } from '../../utils/documentMetadata';

const LastReadCard = ({ book, isLoading }) => {
    const navigate = useNavigate();
    const { hasSeenDashboardTour, completeTour } = useOnboardingStore();

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col gap-3">
                <div className="flex flex-col">
                    <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Last Read</h2>
                    <Card className="p-4 flex flex-col">
                        <div className="flex flex-row gap-4">
                            <div className="w-28 h-40 rounded-lg flex-shrink-0 bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div className="flex flex-col gap-2">
                                    <div className="h-5 w-3/4 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
                                    <div className="h-3 w-1/2 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
                                    <div className="mt-3 h-1 w-full rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
                                    <div className="h-3 w-1/3 rounded-full bg-neutral-200 dark:bg-bg-subtle animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                <WeeklyGoldenBar />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="w-full h-full flex flex-col gap-3">
                <div className="flex flex-col">
                    <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary px-2 mb-2'>Last Read</h2>
                    <Card className="p-4 flex items-center justify-center min-h-[8rem]">
                        <p className="text-text-tertiary font-medium">No recent books</p>
                    </Card>
                </div>
                <WeeklyGoldenBar />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col justify-between gap-3">
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center mb-2 px-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Last Read</h2>
                </div>
                <Card
                    onClick={() => {
                        if (!hasSeenDashboardTour) completeTour('Dashboard');
                        navigate(`/reader/${book.id}`);
                    }}
                    variant="interactive"
                    className="group relative flex flex-col flex-1 p-4 transition-all duration-300 cursor-pointer justify-between"
                >
                    <div className="flex flex-row gap-4">
                        {/* Cover - Left Side */}
                        <BookCover book={book} size="md" className="flex-shrink-0" />

                        {/* Info - Right Side */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-base sm:text-lg md:text-xl font-display text-text-primary truncate mb-1 group-hover:text-accent-primary transition-colors">
                                    {book.title}
                                </h3>
                                {isValidAuthor(book.author) && (
                                    <p className="text-sm text-text-tertiary mb-3 text-left">by {book.author}</p>
                                )}
                            </div>

                            {/* Progress section — pushed down */}
                            <div className="mt-auto">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-text-tertiary text-left">
                                        Page {book.currentPage || 0} of {book.totalPages || 0}
                                    </p>
                                    <span className="text-xs font-bold text-accent-primary tabular-nums">
                                        {book.progress || 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1">
                                    <div
                                        className="bg-accent-primary h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${book.progress || 0}%` }}
                                    />
                                </div>
                                {book.lastAccessed && (
                                    <p className="text-[10px] text-text-placeholder mt-1 text-left">
                                        Last read: {new Date(book.lastAccessed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            <WeeklyGoldenBar />
        </div>
    );
};

export default LastReadCard;

