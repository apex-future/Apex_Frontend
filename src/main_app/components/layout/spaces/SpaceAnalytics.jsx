import React from 'react';
import { Clock, FileText, Highlighter, CheckSquare, Target, Trophy } from 'lucide-react';

function SpaceAnalytics({ space, spaceQuizStats }) {
    if (!space) return null;

    const books = space.books || [];

    // Calculate aggregated metrics
    const totalHighlights = books.reduce((acc, book) => {
        return acc + (book.metadata?.highlights?.length || 0);
    }, 0);

    const completedBooksCount = books.reduce((acc, book) => {
        return acc + (Math.round(book.progress || 0) >= 100 ? 1 : 0);
    }, 0);

    const totalNotes = books.reduce((acc, book) => {
        return acc + (book.metadata?.notes?.length || 0);
    }, 0);

    const timeSpent = space.activitySummaries?.timeSpent || 0;
    const pagesRead = space.activitySummaries?.pagesRead || 0;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        return `${m} mins`;
    };

    return (
        <div className="space-y-6 pt-4 px-2">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary leading-tight">Space Analytics</h3>
                    <p className="text-xs text-text-tertiary font-semibold uppercase tracking-wider mt-1">
                        Aggregate stats from {books.length} {books.length === 1 ? 'book' : 'books'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                
                {/* Completed Books */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckSquare size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Books Completed</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {completedBooksCount}
                        </span>
                        <span className="text-text-tertiary font-medium">/{books.length}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Fully read documents</p>
                </div>

                {/* Total Highlights */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Highlighter size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Total Highlights</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {totalHighlights}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Points of interest saved</p>
                </div>

                {/* Pages Read */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Pages Read</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {pagesRead}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Within this space</p>
                </div>

                {/* Time Spent */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Time Spent</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {timeSpent}
                        </span>
                        <span className="text-sm font-semibold text-text-tertiary">min</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Total reading time</p>
                </div>

                {/* Quizzes Taken */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Quizzes Done</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {spaceQuizStats ? spaceQuizStats.attemptsCount : 0}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Aggregated AI quizzes</p>
                </div>

                {/* Average Score */}
                <div className="p-6 bg-white dark:bg-zinc-900 border border-border-default rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy size={64} />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Avg Quiz Score</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${(spaceQuizStats?.averageScore || 0) >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {spaceQuizStats ? `${spaceQuizStats.averageScore}%` : 'N/A'}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Overall space mastery</p>
                </div>

            </div>
        </div>
    );
}

export default SpaceAnalytics;
