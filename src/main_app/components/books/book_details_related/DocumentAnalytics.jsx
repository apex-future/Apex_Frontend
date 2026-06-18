import React from 'react';
import { ChartBar, Clock, Target, TrendUp, Trophy } from '@phosphor-icons/react';
import useQuizStore from '../../../store/quizStore';

function DocumentAnalytics({ book }) {
    const { getAggregatedStatsForBook } = useQuizStore();
    
    const stats = getAggregatedStatsForBook(book.id);

    if (!stats) {
        return (
            <div className="text-center py-20 px-4 border border-dashed border-border-default rounded-3xl">
                <ChartBar size={48} weight="bold" className="mx-auto text-text-placeholder mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-2">No Analytics Yet</h3>
                <p className="text-text-secondary font-medium">Complete some quizzes for this book to see your performance breakdown.</p>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        return `${m} mins`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 bg-accent-primary/10 text-accent-primary rounded-xl flex items-center justify-center">
                    <TrendUp size={24} weight="bold" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary leading-tight">Performance Summary</h3>
                    <p className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Aggregated AI Quiz Data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Average Score */}
                <div className="p-6 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy size={64} weight="bold" />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Avg Score</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${stats.averageScore >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.averageScore}%
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Across all attempts</p>
                </div>

                {/* Total Quizzes */}
                <div className="p-6 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={64} weight="bold" />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Quizzes Taken</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {stats.attemptsCount}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Completed sessions</p>
                </div>

                {/* Total Questions */}
                <div className="p-6 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ChartBar size={64} weight="bold" />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Total Questions</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {stats.totalQuestions}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Answered in total</p>
                </div>

                {/* Time Spent in Quizzes */}
                <div className="p-6 bg-bg-subtle dark:bg-bg-elevated border-t border-black/10 dark:border-white/10 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={64} weight="bold" />
                    </div>
                    <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-4">Time Spent</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-text-primary">
                            {formatTime(stats.totalTime)}
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2 font-medium">Testing knowledge</p>
                </div>
            </div>
        </div>
    );
}

export default DocumentAnalytics;

