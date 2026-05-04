import React, { useMemo, useEffect, useState } from 'react';
import { 
    Clock, 
    FileText, 
    Highlighter, 
    CheckSquare, 
    Target, 
    Trophy, 
    Calendar as CalendarIcon, 
    TrendingUp, 
    ArrowUpRight,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookCover from '../../books/BookCover';
import apiClient from '../../../services/apiClient';

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

// --- SUB-COMPONENTS ---

const BentoCard = React.memo(({ children, className = '', delay = 0, noPadding = false }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
        className={`bg-card-glass backdrop-blur-md border border-card-glass-border rounded-card shadow-sm overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}
    >
        {children}
    </motion.div>
));

const IntegratedCalendar = React.memo(({ streakHistory }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const todayStr = new Date().toISOString().split('T')[0];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, dateStr });
    }

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <CalendarIcon size={16} className="text-orange-500" />
                    Study Consistency
                </h4>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-bg-subtle rounded-md transition-colors"><ChevronLeft size={14} /></button>
                    <span className="text-[10px] font-bold text-text-primary min-w-[80px] text-center">{monthName}</span>
                    <button onClick={nextMonth} className="p-1 hover:bg-bg-subtle rounded-md transition-colors"><ChevronRight size={14} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-text-tertiary uppercase">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                    if (!cell) return <div key={`e-${i}`} className="aspect-square" />;
                    const isToday = cell.dateStr === todayStr;
                    const hasStreak = streakHistory.includes(cell.dateStr);
                    
                    return (
                        <div 
                            key={cell.dateStr}
                            className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all
                                ${hasStreak 
                                    ? 'bg-orange-500 text-white shadow-[0_2px_8_rgba(249,115,22,0.3)]' 
                                    : isToday 
                                        ? 'border-2 border-orange-500 text-orange-500' 
                                        : 'text-text-tertiary hover:bg-bg-subtle'
                                }`}
                        >
                            {cell.day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const IntegratedActivityLog = React.memo(({ activities }) => (
    <div className="border-t border-border-subtle/50 p-6 pt-8">
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <BookOpen size={16} className="text-orange-500" />
                Recent Activity
            </h4>
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Today</span>
        </div>
        <div className="space-y-6">
            {activities.map((item, i) => (
                <div key={i} className="flex gap-4 relative group cursor-pointer">
                    {/* Timeline line */}
                    {i !== activities.length - 1 && (
                        <div className="absolute left-[5px] top-[24px] bottom-[-24px] w-[2px] bg-border-subtle/30" />
                    )}
                    
                    {/* Activity indicator */}
                    <div className={`w-3 h-3 rounded-full mt-1.5 z-10 border-2 border-bg-elevated ${item.type === 'quiz' ? 'bg-orange-500' : 'bg-orange-300'}`} />
                    
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                        <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-sm border border-border-subtle group-hover:scale-105 transition-transform duration-300">
                            <BookCover title={item.title} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-text-primary truncate group-hover:text-orange-500 transition-colors">{item.title}</p>
                                <span className="text-[9px] font-bold text-text-tertiary whitespace-nowrap ml-2">{item.timestamp}</span>
                            </div>
                            <p className="text-[10px] text-text-tertiary font-medium mt-1">{item.action}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <button className="w-full mt-8 py-2 text-[10px] font-bold text-orange-500 hover:text-orange-600 transition-colors border border-orange-500/20 rounded-xl hover:bg-orange-50/50">
            View all activity
        </button>
    </div>
));

const CoverageList = React.memo(({ books }) => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Target size={16} className="text-accent-primary" />
                Course Coverage
            </h4>
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{books.length} Active Materials</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-10 overflow-y-auto pr-2 max-h-[440px] custom-scrollbar">
            {books.map((book, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer items-start">
                    {/* Left: Bigger Book Cover */}
                    <div className="w-14 h-20 rounded-md overflow-hidden flex-shrink-0 border border-border-subtle shadow-md group-hover:scale-105 transition-transform duration-300">
                        <BookCover title={book.title} className="w-full h-full" />
                    </div>

                    {/* Right: Data (Title + Progress) */}
                    <div className="flex-1 flex flex-col justify-center h-20 min-w-0">
                        <div className="flex justify-between items-center mb-2 min-w-0">
                            <h5 className="text-[11px] sm:text-xs font-bold text-text-primary truncate pr-2">{book.title}</h5>
                        </div>
                        
                        <div className="w-full bg-bg-subtle rounded-full h-1.5 overflow-hidden border border-border-subtle/30 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${book.progress || 0}%` }}
                                transition={{ duration: 0.4, delay: 0.2 + (i * 0.05), ease: "easeOut" }}
                                className="h-full bg-accent-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                            />
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <span className="text-[9px] font-black text-accent-primary tabular-nums uppercase tracking-wider">
                                {Math.round(book.progress || 0)}% Completed
                            </span>
                            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                Continue
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const Sparkline = ({ data, color = "#8B5CF6" }) => {
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - d}`).join(' ');
    return (
        <svg viewBox="0 0 100 100" className="w-full h-12 preserve-3d" preserveAspectRatio="none">
            <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                key={points} // Force re-animation when data changes
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            <path 
                d={`M 0 100 L ${points} L 100 100 Z`}
                fill="url(#sparkline-grad)"
                className="opacity-40"
            />
        </svg>
    );
};

const TrendMaker = React.memo(({ books, trends, onBookSelect, selectedBookId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedBook = books.find(b => b.id === selectedBookId);
    const selectedTitle = selectedBook ? selectedBook.title : 'Overall Space';
    const currentTrendData = trends[selectedBookId] || trends['overall'];

    return (
        <div className="mt-auto pt-6 border-t border-border-subtle/30">
            <h4 className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-4">Performance Trends</h4>
            <div className="mb-4">
                <div className="relative">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between gap-2 text-[10px] font-bold text-text-primary hover:text-accent-primary transition-colors uppercase tracking-wider bg-bg-subtle/50 px-3 py-2 rounded-lg border border-border-subtle/30 group"
                    >
                        <span className="truncate max-w-[85%]">{selectedTitle}</span>
                        <ChevronDown size={12} className={`transition-transform duration-300 group-hover:text-accent-primary ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                        {isOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-2 w-full bg-bg-elevated border border-border-default rounded-xl shadow-xl z-50 overflow-y-auto max-h-48 custom-scrollbar py-1"
                                >
                                    <button 
                                        onClick={() => { onBookSelect('overall'); setIsOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-colors ${selectedBookId === 'overall' ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-subtle text-text-secondary'}`}
                                    >
                                        Overall Space
                                    </button>
                                    <div className="h-px bg-border-subtle/50 my-1" />
                                    {books.map(book => (
                                        <button 
                                            key={book.id}
                                            onClick={() => { onBookSelect(book.id); setIsOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase truncate transition-colors ${selectedBookId === book.id ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-subtle text-text-secondary'}`}
                                        >
                                            {book.title}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <Sparkline data={currentTrendData} />
        </div>
    );
});

// --- MAIN COMPONENT ---

function SpaceAnalytics({ space, spaceQuizStats }) {
    const [selectedTrendBook, setSelectedTrendBook] = useState('overall');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!space?.books) return;

        // Extract Supabase UUIDs from the space's books — skip unsynced local-only books
        const bookIds = space.books
            .map(b => b.supabaseId || b.recordId)
            .filter(Boolean);

        console.log('[SpaceAnalytics] Book UUIDs for analytics:', bookIds);

        if (bookIds.length === 0) {
            console.log('[SpaceAnalytics] No synced books in space — skipping fetch');
            setAnalyticsData(null);
            setAnalyticsLoading(false);
            return;
        }

        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            setAnalyticsError(null);
            console.log('[SpaceAnalytics] Fetching real analytics for', bookIds.length, 'books');
            try {
                // POST book UUIDs — spaces are local-only, backend has no space table
                const response = await apiClient.post('/api/ai/space/analytics', { book_ids: bookIds });
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
    }, [space?.books, retryCount]);

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

    const quizStats = analyticsData?.quiz_stats ?? {
        attempts_count: 0,
        average_score: 0,
        best_score: 0,
        book_trends: { overall: [0, 0, 0, 0, 0, 0, 0] }
    };

    // Map book_trends keys: backend uses supabase UUIDs, TrendMaker uses local book ids
    // Build a local-id-keyed trends object
    const localBookTrends = useMemo(() => {
        const trends = { overall: quizStats.book_trends?.overall ?? [0,0,0,0,0,0,0] };
        if (space?.books && quizStats.book_trends) {
            space.books.forEach(book => {
                const supabaseId = book.supabaseId || book.recordId;
                if (supabaseId && quizStats.book_trends[supabaseId]) {
                    trends[book.id] = quizStats.book_trends[supabaseId];
                } else {
                    trends[book.id] = [0, 0, 0, 0, 0, 0, 0];
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
            <div className="w-full py-8 flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Loading analytics...</p>
            </div>
        );
    }

    // Error state
    if (analyticsError) {
        return (
            <div className="w-full py-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-sm font-bold text-text-tertiary">{analyticsError}</p>
                <button 
                    onClick={() => setRetryCount(c => c + 1)}
                    className="text-xs font-bold text-accent-primary hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="w-full py-8 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="mb-8 px-2 flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black text-text-primary tracking-tight font-display">
                        Space <span className="text-accent-primary">Performance</span>
                    </h3>
                    <p className="text-xs text-text-tertiary font-bold uppercase tracking-[0.2em] mt-1">
                        Analytics Overview • {space.name || 'Core'}
                    </p>
                </div>
            </div>

            {/* Bento Grid Layout - Side-by-side on LG+ only */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                
                {/* LEFT COLUMN (70% equivalent on LG) */}
                <div className="lg:col-span-8 flex flex-col gap-8 lg:gap-10">
                    
                    {/* Row 1: Coverage */}
                    <BentoCard delay={0.1} className="flex-1">
                        <CoverageList books={enrichedBooks} />
                    </BentoCard>

                    {/* Row 2: Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                        {/* Time Spent */}
                        <BentoCard delay={0.2} className="flex flex-col min-h-[220px]">
                            <div className="flex items-center gap-2 mb-6">
                                <Clock size={16} className="text-accent-primary" />
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Time Spent</span>
                            </div>
                            <div className="mb-8 flex flex-col items-center justify-center">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-text-primary">{timeSpent.h}</span>
                                    <span className="text-xl font-bold text-text-tertiary">hr</span>
                                    <span className="text-5xl font-black text-text-primary ml-2">{timeSpent.m}</span>
                                    <span className="text-xl font-bold text-text-tertiary">min</span>
                                </div>
                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-4">Total study time</p>
                            </div>
                            <div className="mt-auto space-y-4">
                                {enrichedBooks.slice(0, 2).map((book, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                                        <div className="flex items-center gap-3 max-w-[75%]">
                                            <div className="w-5 h-7 rounded-sm overflow-hidden flex-shrink-0 border border-border-subtle">
                                                <BookCover title={book.title} className="w-full h-full" />
                                            </div>
                                            <span className="text-text-secondary truncate">{book.title}</span>
                                        </div>
                                        <span className="text-text-primary">{(book.timeSpent || 0)}m</span>
                                    </div>
                                ))}
                            </div>
                        </BentoCard>

                        {/* Quiz Performance */}
                        <BentoCard delay={0.3} className="flex flex-col relative overflow-hidden min-h-[220px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} className="text-accent-primary" />
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Mastery Score</span>
                                </div>
                                {/* TODO: trend delta */}
                            </div>
                            
                            <div className="flex items-center gap-10 mb-8">
                                <div className="text-6xl font-black text-text-primary">{avgScore}%
                                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-4">Average Score</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider mb-0.5">Quizzes Attempted</p>
                                        <p className="text-base font-black text-text-secondary">{quizStats.attempts_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider mb-0.5">Best Score</p>
                                        <p className="text-base font-black text-text-secondary">
                                            {quizStats.best_score ? `${quizStats.best_score}%` : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <TrendMaker 
                                books={enrichedBooks} 
                                trends={localBookTrends} 
                                onBookSelect={setSelectedTrendBook}
                                selectedBookId={selectedTrendBook}
                            />
                        </BentoCard>
                    </div>
                </div>

                {/* RIGHT COLUMN (30% equivalent on LG) - Unified Activity & Calendar */}
                <div className="lg:col-span-4">
                    <BentoCard delay={0.4} noPadding className="h-full">
                        <IntegratedCalendar streakHistory={streakHistory} />
                        <IntegratedActivityLog activities={recentActivity} />
                    </BentoCard>
                </div>

            </div>

            <style>{`
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
