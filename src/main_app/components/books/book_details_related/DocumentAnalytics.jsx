import React, { useState, useEffect, useMemo } from 'react';
import { CalendarActivityCard, StudyTimeCard, QuizCard, PARTS_STYLES } from '../../layout/spaces/SpaceAnalyticsParts';
import apiClient from '../../../services/apiClient';
import useQuizStore from '../../../store/quizStore';
import useStudyStore from '../../../store/studyStore';
import { Spinner } from '@phosphor-icons/react';

function DocumentAnalytics({ book }) {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const quizHistory = useQuizStore((state) => state.quizHistory) || [];
    const streakCount = useStudyStore((state) => state.streakCount) || 0;
    const streakHistory = useStudyStore((state) => state.streakHistory) || [];

    // Local quiz history for this specific book
    const bookQuizHistory = useMemo(() => {
        if (!book?.id) return [];
        return quizHistory.filter(q => String(q.bookId) === String(book.id));
    }, [quizHistory, book?.id]);

    const localQuizStats = useMemo(() => {
        if (bookQuizHistory.length === 0) return null;
        const totalScore = bookQuizHistory.reduce((acc, curr) => acc + (curr.score || 0), 0);
        return {
            attemptsCount: bookQuizHistory.length,
            averageScore: Math.round(totalScore / bookQuizHistory.length),
        };
    }, [bookQuizHistory]);

    const localBestScore = useMemo(() => {
        if (bookQuizHistory.length === 0) return 0;
        return Math.max(...bookQuizHistory.map(q => q.score || 0));
    }, [bookQuizHistory]);

    const localBookTrend = useMemo(() => {
        return bookQuizHistory.map(q => ({
            score: q.score || 0,
            date: q.createdAt || new Date().toISOString(),
        }));
    }, [bookQuizHistory]);

    const localActivity = useMemo(() => {
        const bookId = book?.supabaseId || book?.recordId || String(book?.id);
        const activity = [];
        if (book?.lastReadAt) {
            activity.push({
                book_id: bookId,
                timestamp: book.lastReadAt,
                type: 'reading',
                detail: `Completed ${Math.round(book.progress || 0)}% of book`
            });
        }
        bookQuizHistory.forEach(q => {
            activity.push({
                book_id: bookId,
                timestamp: q.createdAt,
                type: 'quiz',
                detail: `Scored ${q.score}% on quiz attempt`
            });
        });
        return activity;
    }, [book, bookQuizHistory]);

    // Fetch individual book analytics from backend
    useEffect(() => {
        let isMounted = true;
        const bookUuid = book?.supabaseId || book?.recordId;

        const fetchAnalytics = async () => {
            if (!bookUuid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await apiClient.post('/api/spaces/analytics', { book_ids: [bookUuid] });
                if (isMounted && response?.data) {
                    setAnalyticsData(response.data);
                }
            } catch (err) {
                console.warn('[DocumentAnalytics] Fallback to local store stats for book:', book?.title, err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAnalytics();
        return () => { isMounted = false; };
    }, [book?.id, book?.supabaseId, book?.recordId]);

    // Normalize enriched book data for QuizCard
    const enrichedBook = useMemo(() => {
        const bookAnalytics = analyticsData?.books_analytics?.find(
            a => a.book_id === (book?.supabaseId || book?.recordId)
        );

        return {
            ...book,
            progress: bookAnalytics?.progress_percentage ?? book?.progress ?? 0,
            timeSpent: bookAnalytics?.time_read_minutes ?? book?.timeSpent ?? 0,
            averageScore: bookAnalytics?.average_score ?? localQuizStats?.averageScore ?? 0,
            bestScore: bookAnalytics?.best_score ?? localBestScore ?? 0,
            quizAttempts: bookAnalytics?.quiz_attempts ?? localQuizStats?.attemptsCount ?? 0,
            lastReadAt: bookAnalytics?.last_read_at ?? book?.lastReadAt ?? null,
        };
    }, [book, analyticsData, localQuizStats, localBestScore]);

    // Normalize quiz stats
    const normalizedQuizStats = useMemo(() => {
        if (analyticsData?.quiz_stats) {
            return analyticsData.quiz_stats;
        }
        return {
            attempts_count: localQuizStats?.attemptsCount || 0,
            average_score: localQuizStats?.averageScore || 0,
            best_score: localBestScore || 0,
            book_trends: {
                overall: localBookTrend,
                [book?.id]: localBookTrend,
            }
        };
    }, [analyticsData, localQuizStats, localBestScore, localBookTrend, book?.id]);

    // Normalize local book trends mapping
    const localBookTrends = useMemo(() => {
        const trends = {
            overall: normalizedQuizStats.book_trends?.overall ?? localBookTrend,
            [book?.id]: normalizedQuizStats.book_trends?.[book?.supabaseId || book?.id] ?? localBookTrend,
        };
        return trends;
    }, [normalizedQuizStats, localBookTrend, book]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[220px]">
                <Spinner size={24} weight="bold" className="animate-spin text-accent-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {PARTS_STYLES}

            {/* 1. Study Consistency Card (Calendar Activity Card) on top */}
            <CalendarActivityCard
                streakHistory={analyticsData?.streak_history ?? streakHistory}
                currentStreak={analyticsData?.current_streak ?? streakCount}
                rawActivity={analyticsData?.recent_activity ?? localActivity}
                spaceBooks={[book]}
            />

            {/* 2. Side-by-side on Desktop (lg:grid-cols-2), stacked on Mobile (grid-cols-1) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* Study Time This Week */}
                <StudyTimeCard
                    weeklyTime={analyticsData?.weekly_time ?? []}
                    rawActivity={analyticsData?.recent_activity ?? localActivity}
                    spaceBooks={[book]}
                />

                {/* Quiz Performance (no dropdown needed for single book view) */}
                <QuizCard
                    enrichedBooks={[enrichedBook]}
                    quizStats={normalizedQuizStats}
                    localBookTrends={localBookTrends}
                    spaceBooks={[book]}
                    showSelect={false}
                />
            </div>
        </div>
    );
}

export default DocumentAnalytics;
