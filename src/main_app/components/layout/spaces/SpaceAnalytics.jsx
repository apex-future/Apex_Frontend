import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCover from '../../books/BookCover';
import apiClient from '../../../services/apiClient';
import { CoverageCard, StudyTimeCard, QuizCard, CalendarActivityCard } from './SpaceAnalyticsParts';

const EMPTY_WEEKLY_TIME = [];
const EMPTY_RECENT_ACTIVITY = [];
const DEFAULT_QUIZ_STATS = {
    attempts_count: 0,
    average_score: 0,
    best_score: 0,
    book_trends: { overall: [] },
};

// --- HELPER ---
function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

// --- MAIN COMPONENT ---

function SpaceAnalytics({ space, spaceQuizStats }) {
    const [selectedTrendBook, setSelectedTrendBook] = useState('overall');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Stable key — space.books is a new array whenever shelves recompute in BookContext
    const analyticsBookIdsKey = useMemo(() => {
        if (!space?.books?.length) return '';
        return space.books
            .map(b => b.supabaseId || b.recordId)
            .filter(Boolean)
            .sort()
            .join(',');
    }, [space?.books]);

    useEffect(() => {
        if (!analyticsBookIdsKey) {
            if (!space?.books) return;
            console.log('[SpaceAnalytics] No synced books in space — skipping fetch');
            setAnalyticsData(null);
            setAnalyticsLoading(false);
            return;
        }

        const bookIds = analyticsBookIdsKey.split(',');

        console.log('[SpaceAnalytics] Book UUIDs for analytics:', bookIds);

        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            setAnalyticsError(null);
            console.log('[SpaceAnalytics] Fetching real analytics for', bookIds.length, 'books');
            try {
                // POST book UUIDs — spaces are local-only, backend has no space table
                const response = await apiClient.post('/api/spaces/analytics', { book_ids: bookIds });
                console.log('[SpaceAnalytics] Analytics data received:', response.data);
                setAnalyticsData(response.data);
            } catch (err) {
                console.error('[SpaceAnalytics] Failed to fetch analytics:', err);
                setAnalyticsError('Failed to load analytics');
            } finally {
                setAnalyticsLoading(false);
            }
        };

        fetchAnalytics();
    }, [analyticsBookIdsKey, retryCount]);

    // Merge per-book analytics into the books array from props
    // space.books provides title and local id; analyticsData provides real stats
    const enrichedBooks = useMemo(() => {
        if (!analyticsData || !space?.books) return space?.books || [];
        return space.books.map(book => {
            // Match by supabaseId — space.books entries should carry supabaseId or recordId
            const analytics = analyticsData.books_analytics?.find(
                a => a.book_id === (book.supabaseId || book.recordId)
            );
            return {
                ...book,
                progress: analytics?.progress_percentage ?? book.progress ?? 0,
                timeSpent: analytics?.time_read_minutes ?? book.timeSpent ?? 0,
                highlightsCount: analytics?.highlights_count ?? 0,
                aiUsesCount: analytics?.ai_uses_count ?? 0,
                quizAttempts: analytics?.quiz_attempts ?? 0,
                averageScore: analytics?.average_score ?? null,
                bestScore: analytics?.best_score ?? null,
                lastReadAt: analytics?.last_read_at ?? null,
            };
        });
    }, [analyticsData, space?.books]);

    const streakHistory = analyticsData?.streak_history ?? [];
    const currentStreak = analyticsData?.current_streak ?? 0;

    const totalMinutes = analyticsData?.total_time_minutes ?? 0;
    const timeSpent = useMemo(() => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return { h, m };
    }, [totalMinutes]);

    const quizStats = analyticsData?.quiz_stats ?? DEFAULT_QUIZ_STATS;

    // Map book_trends keys: backend uses supabase UUIDs, TrendMaker uses local book ids
    // Backend now returns [{score, date}, ...] objects per book
    const localBookTrends = useMemo(() => {
        const trends = { overall: quizStats.book_trends?.overall ?? [] };
        if (space?.books && quizStats.book_trends) {
            space.books.forEach(book => {
                const supabaseId = book.supabaseId || book.recordId;
                if (supabaseId && quizStats.book_trends[supabaseId]) {
                    trends[book.id] = quizStats.book_trends[supabaseId];
                } else {
                    trends[book.id] = [];
                }
            });
        }
        return trends;
    }, [space?.books, quizStats.book_trends]);

    // Recent activity — enrich with book titles from space.books
    const recentActivity = useMemo(() => {
        if (!analyticsData?.recent_activity) return [];
        return analyticsData.recent_activity.map((event, i) => {
            const book = space?.books?.find(
                b => (b.supabaseId || b.recordId) === event.book_id
            );
            return {
                id: i,
                title: book?.title ?? 'Unknown Book',
                timestamp: formatRelativeTime(event.timestamp),
                action: event.detail,
                type: event.type,
            };
        });
    }, [analyticsData?.recent_activity, space?.books]);

    const avgScore = quizStats.average_score;

    if (!space) return null;

    // Loading state
    if (analyticsLoading) {
        return (
            <div style={{ width:'100%', padding:'32px 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: 400, gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius:'50%', border:'2px solid #7F77DD', borderTopColor:'transparent', animation:'spin 1s linear infinite' }} />
                <p style={{ fontSize: 11, fontWeight: 700, color:'rgb(var(--text-tertiary))', textTransform:'uppercase', letterSpacing:'0.12em' }}>Loading analytics...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Error state
    if (analyticsError) {
        return (
            <div style={{ width:'100%', padding:'32px 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: 400, gap: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color:'rgb(var(--text-tertiary))' }}>{analyticsError}</p>
                <button 
                    onClick={() => setRetryCount(c => c + 1)}
                    style={{ fontSize: 12, fontWeight: 700, color:'#7F77DD', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ width:'100%', padding:'32px 0' }}>
            {/* Two-column grid */}
            <div className="sa-grid">
                {/* Left column */}
                <div className="sa-left" style={{ display:'flex', flexDirection:'column', gap: 20 }}>
                    <div className="sa-card-limit">
                        <CoverageCard enrichedBooks={enrichedBooks} />
                    </div>
                    <div className="sa-card-limit">
                        <StudyTimeCard
                            weeklyTime={analyticsData?.weekly_time ?? EMPTY_WEEKLY_TIME}
                            rawActivity={analyticsData?.recent_activity ?? EMPTY_RECENT_ACTIVITY}
                            spaceBooks={space?.books}
                        />
                    </div>
                    <div className="sa-card-limit">
                        <QuizCard 
                            enrichedBooks={enrichedBooks} 
                            quizStats={quizStats} 
                            localBookTrends={localBookTrends}
                            spaceBooks={space?.books}
                        />
                    </div>
                </div>

                {/* Right column */}
                <div className="sa-right" style={{ display:'flex', flexDirection:'column', gap: 20 }}>
                    <div className="sa-card-limit">
                        <CalendarActivityCard 
                            streakHistory={streakHistory}
                            currentStreak={currentStreak}
                            rawActivity={analyticsData?.recent_activity ?? EMPTY_RECENT_ACTIVITY}
                            spaceBooks={space?.books}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .sa-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    align-items: start;
                    gap: 24px;
                    width: 100%;
                }
                
                .sa-card-limit {
                    width: 100%;
                    max-width: 680px;
                    margin: 0 auto;
                    min-width: 0;
                }

                .sa-left, .sa-right {
                    min-width: 0;
                    width: 100%;
                }

                @media (min-width: 1024px) {
                    .sa-grid {
                        grid-template-columns: minmax(0, 60fr) minmax(0, 40fr);
                        gap: 20px;
                    }
                    .sa-card-limit {
                        max-width: none;
                        margin: 0;
                    }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--text-tertiary), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--text-tertiary), 0.2);
                }
            `}
            </style>
        </div>
    );
}

export default React.memo(SpaceAnalytics);
