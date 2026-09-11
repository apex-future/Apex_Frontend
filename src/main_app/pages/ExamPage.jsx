import React, { useState, useMemo, useEffect } from 'react';
import { 
    Alarm, Plus, ArrowLeft, CalendarBlank, Link, 
    PencilSimple, Trash, Pause, Play, Clock, MagnifyingGlass, SquaresFour, CheckCircle, WarningCircle, X, Sparkle, BookOpen
} from '@phosphor-icons/react';
import useStudyStore from '../store/studyStore';
import useSpaceStore from '../store/spaceStore';
import useThemeStore from '../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { showToastGlobal } from '../hooks/useToast';
import { createPortal } from 'react-dom';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Label from '../components/ui/Label';
import EmptyState from '../components/ui/EmptyState';

const ExamPage = () => {
    const { exams, examDate, examName, addExam, updateExam, deleteExam, togglePauseExam } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const { resolvedTheme } = useThemeStore();
    const navigate = useNavigate();

    // State for filtering and sorting
    const [filterStatus, setFilterStatus] = useState('all'); // all, ongoing, paused, completed
    const [sortBy, setSortBy] = useState('urgency'); // urgency, earliest, latest, name
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examToDelete, setExamToDelete] = useState(null);

    const getLinkedSpace = (exam) => {
        if (!exam) return null;
        const targetId = exam.book_space_id || exam.bookSpaceSupabaseId || exam.bookSpaceId;
        if (targetId) {
            const strId = String(targetId);
            const found = spaces.find(s => 
                String(s.id) === strId || 
                String(s.local_id) === strId || 
                String(s.supabaseId) === strId
            );
            if (found) return found;
            return { id: targetId, name: exam.name ? `${exam.name} Space` : 'Connected Space', isTemporary: true };
        }
        return spaces.find(s => !s.isSystem && (s.examDate === exam.date || (s.isLinkedToExam && !s.examDate))) || null;
    };

    // Map legacy single exam if exams array is empty, otherwise use exams array
    const allExams = useMemo(() => {
        let baseExams = (exams && exams.length > 0) ? [...exams] : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []);
        
        return baseExams.map(exam => {
            const diff = new Date(exam.date) - new Date();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            const rawSpaceId = exam.book_space_id || exam.bookSpaceSupabaseId || exam.bookSpaceId;
            const linkedSpace = getLinkedSpace(exam);
            // ONLY truly unlinked if neither ID nor linkedSpace exist
            const isUnlinked = Boolean(!rawSpaceId && !linkedSpace);
            
            let status = 'on track';
            if (isUnlinked) status = 'unlinked';
            else if (exam.isPaused) status = 'paused';
            else if (daysLeft < 0) status = 'completed';
            else if (daysLeft <= 3) status = 'final push';
            else if (daysLeft <= 7) status = 'critical';
            else if (daysLeft <= 21) status = 'urgent';
            else {
                const hasActivity = linkedSpace && ((linkedSpace.activitySummaries?.timeSpent > 0) || (linkedSpace.activitySummaries?.pagesRead > 0));
                status = hasActivity ? 'steady' : 'on track';
            }

            return { 
                ...exam, 
                daysLeft, 
                status, 
                isUnlinked, 
                linkedSpace,
                isPaused: isUnlinked ? true : Boolean(exam.isPaused) 
            };
        });
    }, [exams, examDate, examName, spaces]);

    // Grouping and Sorting Logic
    const sections = useMemo(() => {
        const filtered = allExams.filter(exam => 
            exam.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {
            ongoing: filtered.filter(e => e.status !== 'completed' && !e.isPaused && !e.isUnlinked),
            paused: filtered.filter(e => (e.isPaused || e.isUnlinked) && e.status !== 'completed'),
            completed: filtered.filter(e => e.status === 'completed')
        };

        // Sort only Ongoing category
        groups.ongoing.sort((a, b) => {
            if (sortBy === 'urgency') return a.daysLeft - b.daysLeft;
            if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

        return groups;
    }, [allExams, searchQuery, sortBy]);

    const getLinkedSpaces = (exam) => {
        return spaces.filter(s => !s.isSystem && (s.examDate === exam.date || (s.isLinkedToExam && !s.examDate)));
    };

    const handleDelete = (exam) => {
        setExamToDelete(exam);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!examToDelete) return;
        deleteExam(examToDelete.id);
        setIsDeleteModalOpen(false);
        setExamToDelete(null);
        showToastGlobal("Exam reminder removed", "info");
    };

    const renderSection = (title, exams, type) => {
        if (filterStatus !== 'all' && filterStatus !== type) return null;

        const emptyConfig = {
            ongoing: {
                title: "No ongoing exams",
                description: "No active exams found. Ready to set a new goal?",
                icon: Clock,
            },
            paused: {
                title: "No paused exams",
                description: "No paused exam timers. Keep up the momentum!",
                icon: Pause,
            },
            completed: {
                title: "No completed exams",
                description: "No completed exams yet. Your milestones will appear here.",
                icon: CheckCircle,
            }
        };

        const config = emptyConfig[type] || {
            title: `No ${type} exams`,
            description: "No exams found in this category.",
            icon: Alarm,
        };

        return (
            <div key={type} className="space-y-6 mb-16 last:mb-0">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em]">{title}</h4>
                        <span className="text-[10px] font-black bg-bg-subtle text-text-tertiary px-2 py-0.5 rounded-full border border-border-default">
                            {exams.length}
                        </span>
                    </div>
                    {type === 'ongoing' && exams.length > 0 && (
                        <span className="text-[10px] font-bold text-accent-primary flex items-center gap-1.5">
                            <Clock size={12} weight="bold" />
                            Sorting Active
                        </span>
                    )}
                </div>

                {exams.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {exams.map(exam => (
                                <ExamCard 
                                    key={exam.id} 
                                    exam={exam} 
                                    linkedSpace={exam.linkedSpace}
                                    onEdit={() => { setSelectedExam(exam); setIsEditModalOpen(true); }}
                                    onDelete={() => handleDelete(exam)}
                                    onTogglePause={async () => {
                                        if (exam.isUnlinked) {
                                            showToastGlobal("Link a study shelf before resuming this countdown", "info");
                                            setSelectedExam(exam);
                                            setIsEditModalOpen(true);
                                            return;
                                        }
                                        const success = await togglePauseExam(exam.id);
                                        if (!success) {
                                            showToastGlobal("Link a study shelf to resume this countdown", "error");
                                            setSelectedExam(exam);
                                            setIsEditModalOpen(true);
                                        }
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <EmptyState
                        icon={config.icon}
                        title={config.title}
                        description={config.description}
                        className="py-10"
                    />
                )}
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-bg-primary pb-20 ${resolvedTheme}`}>
            {/* Standardized Sticky Header */}
            <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
                        >
                            <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform text-text-primary" />
                        </button>
                    </div>

                    <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <h3 className='text-base md:text-lg font-bold font-display text-text-primary'>Exam Reminders</h3>
                    </div>

                    <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                        <button 
                            onClick={() => { setSelectedExam(null); setIsEditModalOpen(true); }}
                            className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-accent-primary rounded-full transition-all flex items-center justify-center"
                            title="Create New Exam"
                        >
                            <Plus size={20} weight="bold" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
                {/* Responsive Controls Bar */}
                <div className="flex flex-col gap-6 mb-12">
                    {/* Search Bar - Consistent with Dictionary page */}
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary group-focus-within:text-accent-primary transition-colors flex items-center">
                            <MagnifyingGlass size={20} weight="regular" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search your exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-14 pr-12 bg-surface-sunken border border-border-default rounded-2xl text-base font-medium text-text-primary focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/5 transition-all shadow-sm placeholder:text-sm placeholder:text-text-placeholder group-hover:border-accent-primary/30"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                title="Clear search"
                            >
                                <X size={16} weight="bold" />
                            </button>
                        )}
                    </div>
                    
                    {/* Filter & Sort Bar - Styled similar to NotificationDrawer */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center p-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-w-max">
                            {['all', 'ongoing', 'paused', 'completed'].map((status) => {
                                const isActive = filterStatus === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                                            isActive 
                                                ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/25' 
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center p-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-w-max">
                            {[
                                { id: 'urgency', label: 'Urgency', icon: WarningCircle },
                                { id: 'newest', label: 'Newest', icon: Plus },
                                { id: 'oldest', label: 'Oldest', icon: Clock },
                                { id: 'name', label: 'A-Z', icon: MagnifyingGlass }
                            ].map((sort) => {
                                const Icon = sort.icon;
                                const isActive = sortBy === sort.id;
                                return (
                                    <button
                                        key={sort.id}
                                        onClick={() => setSortBy(sort.id)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                            isActive 
                                                ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/25' 
                                                : 'text-text-tertiary hover:text-text-secondary'
                                        }`}
                                    >
                                        <Icon size={14} weight={isActive ? "bold" : "regular"} />
                                        <span>{sort.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sectioned Content */}
                <div className="space-y-12">
                    {allExams.length === 0 ? (
                        <EmptyState
                            icon={Alarm}
                            title="No exams found"
                            description={searchQuery ? `No exams match "${searchQuery}". Try a different search term.` : "Create your first exam reminder to start tracking your deadlines."}
                            action={!searchQuery ? {
                                label: 'Set Exam Reminder',
                                onClick: () => { setSelectedExam(null); setIsEditModalOpen(true); }
                            } : undefined}
                            className="py-16"
                        />
                    ) : (
                        <>
                            {renderSection('Ongoing', sections.ongoing, 'ongoing')}
                            {renderSection('Paused', sections.paused, 'paused')}
                            {renderSection('Completed', sections.completed, 'completed')}
                        </>
                    )}
                </div>
            </main>

            {isEditModalOpen && (
                <ExamEditModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    exam={selectedExam}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Reminder?"
                message={`This will permanently remove "${examToDelete?.name || 'this exam'}" and unlink its study shelves.`}
                actions={[
                    {
                        label: 'Yes, Delete',
                        variant: 'danger',
                        onClick: confirmDelete,
                    },
                    {
                        label: 'Cancel',
                        variant: 'ghost',
                        onClick: () => setIsDeleteModalOpen(false),
                    }
                ]}
            />
        </div>
    );
};

const ExamCard = ({ exam, linkedSpace, onEdit, onDelete, onTogglePause }) => {
    const isPaused = exam.isPaused;
    const isUnlinked = exam.isUnlinked;
    const daysLeft = exam.daysLeft;

    // Mood Logic (Synced with ExamReminder.jsx)
    let moodLabel = 'On Track';
    let moodColor = 'bg-emerald-500';
    let moodBgColor = 'bg-emerald-500/10';
    let moodTextColor = 'text-emerald-500';
    let moodBorderColor = 'border-emerald-500/20';
    let moodAmbientBg = 'from-emerald-500/20 to-transparent';
    let moodGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.15)]';

    if (isPaused || isUnlinked) {
        moodLabel = 'Paused';
        moodColor = 'bg-zinc-400';
        moodBgColor = 'bg-zinc-500/10';
        moodTextColor = 'text-zinc-500';
        moodBorderColor = 'border-zinc-500/10';
        moodAmbientBg = 'from-zinc-500/10 to-transparent';
        moodGlow = '';
    } else if (daysLeft < 0) {
        moodLabel = 'Goal Met';
        moodColor = 'bg-blue-500';
        moodBgColor = 'bg-blue-500/10';
        moodTextColor = 'text-blue-500';
        moodBorderColor = 'border-blue-500/20';
        moodAmbientBg = 'from-blue-500/20 to-transparent';
    } else if (daysLeft === 0) {
        moodLabel = 'D-Day';
        moodColor = 'bg-amber-400';
        moodBgColor = 'bg-amber-400/20';
        moodTextColor = 'text-amber-500 dark:text-amber-400';
        moodBorderColor = 'border-amber-400/35';
        moodAmbientBg = 'from-amber-400/35 to-transparent';
        moodGlow = 'shadow-[0_0_25px_rgba(251,191,36,0.35)]';
    } else if (daysLeft <= 3) {
        moodLabel = 'Final Push';
        moodColor = 'bg-red-500';
        moodBgColor = 'bg-red-500/15';
        moodTextColor = 'text-red-500';
        moodBorderColor = 'border-red-500/30';
        moodAmbientBg = 'from-red-500/30 to-transparent';
        moodGlow = 'shadow-[0_0_25px_rgba(239,68,68,0.25)]';
    } else if (daysLeft <= 7) {
        moodLabel = 'Critical';
        moodColor = 'bg-orange-500';
        moodBgColor = 'bg-orange-500/15';
        moodTextColor = 'text-orange-500';
        moodBorderColor = 'border-orange-500/30';
        moodAmbientBg = 'from-orange-500/30 to-transparent';
        moodGlow = 'shadow-[0_0_25px_rgba(249,115,22,0.2)]';
    } else if (daysLeft <= 21) {
        moodLabel = 'Urgent';
        moodColor = 'bg-amber-500';
        moodBgColor = 'bg-amber-500/10';
        moodTextColor = 'text-amber-500';
        moodBorderColor = 'border-amber-500/20';
        moodAmbientBg = 'from-amber-500/20 to-transparent';
    } else if (exam.status === 'steady') {
        moodLabel = 'Steady';
        moodColor = 'bg-blue-500';
        moodBgColor = 'bg-blue-500/10';
        moodTextColor = 'text-blue-500';
        moodBorderColor = 'border-blue-500/20';
        moodAmbientBg = 'from-blue-500/20 to-transparent';
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full"
        >
            <Card
                className={`group relative overflow-hidden h-full flex flex-col p-6 sm:p-7 transition-all ${isPaused && !isUnlinked ? 'opacity-75 grayscale-[0.35]' : ''}`}
            >
                {/* Ambient Background Glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-16 blur-3xl opacity-30 transition-all duration-700 pointer-events-none bg-gradient-to-br ${moodAmbientBg}`} />

                <div className="flex flex-col w-full h-full relative z-10 justify-between">
                    {/* Top Row: Status and Actions */}
                    <div className="flex justify-between items-center w-full mb-6 relative z-40">
                        <div className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5 transition-all duration-500 whitespace-nowrap ${moodBgColor} ${moodTextColor} ${moodBorderColor} ${moodGlow}`}>
                            <div className={`size-1.5 rounded-full ${moodColor} ${!isPaused && daysLeft >= 0 ? 'animate-pulse' : ''}`} />
                            {moodLabel}
                        </div>
                        
                        <div className="flex gap-1 backdrop-blur-xl bg-white/50 dark:bg-black/20 rounded-xl p-0.5 shadow-sm transition-all">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-lg transition-all" title="Edit"><PencilSimple size={14} weight="regular"/></button>
                            <button onClick={(e) => { e.stopPropagation(); onTogglePause(); }} className="p-1.5 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-lg transition-all" title={isPaused ? "Resume" : "Pause"}>{isPaused ? <Play size={14} weight="fill" /> : <Pause size={14} weight="fill" />}</button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-lg transition-all" title="Delete"><Trash size={14} weight="regular"/></button>
                        </div>
                    </div>

                    {/* Middle Row & Info: Content */}
                    <div className={`flex flex-col flex-1 justify-between transition-all duration-300 ${isUnlinked ? 'opacity-25 blur-[1px] grayscale' : ''}`}>
                        {/* Middle Row: Content */}
                        <div className="flex flex-col flex-1 items-center justify-center w-full gap-2 mb-6">
                            <div className="flex flex-col items-center justify-center">
                                <span className={`text-6xl sm:text-7xl font-black tabular-nums tracking-tighter leading-none ${isPaused ? 'text-text-tertiary opacity-40' : 'text-text-primary'}`}>
                                    {daysLeft > 0 ? daysLeft : 0}
                                </span>
                                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-2">Days Left</span>
                            </div>
                        </div>

                        {/* Info Row: Title and Date */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-black text-text-primary tracking-tight leading-tight group-hover:text-accent-primary transition-colors line-clamp-1">{exam.name || 'Untitled Exam'}</h3>
                                <p className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary mt-1">
                                    <CalendarBlank size={13} weight="regular" className="text-accent-primary" />
                                    {new Date(exam.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Bottom Row: Linked Space (Strict 1:1) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-text-tertiary uppercase tracking-widest opacity-70">
                                        <Link size={10} weight="bold" />
                                        Connected Space
                                    </div>
                                </div>
                                
                                {linkedSpace ? (
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1.5 bg-surface-sunken text-[11px] font-semibold text-text-secondary rounded-lg border border-border-default/50 truncate max-w-full flex items-center gap-1.5">
                                            <SquaresFour size={13} weight="regular" className="text-accent-primary shrink-0" />
                                            <span className="truncate">Space: {linkedSpace.name}</span>
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold text-text-tertiary px-0.5">No space linked.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay for Unlinked Exam — centered horizontally and covers countdown, does not cover top navbar */}
                {isUnlinked && (
                    <div className="absolute inset-x-0 bottom-0 top-16 z-30 flex flex-col items-center justify-center p-6 bg-surface-card/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-b-card text-center">
                        {/* Info card telling them what's going on above the button */}
                        <div className="flex flex-col items-center gap-2 max-w-[260px] mb-4">
                            <div className="size-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner shadow-amber-500/20">
                                <WarningCircle size={24} weight="bold" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-text-primary tracking-tight">
                                    Link a Book Space
                                </h4>
                                <p className="text-xs font-medium text-text-secondary mt-1 leading-snug">
                                    Countdown is paused until a study space is connected to this exam.
                                </p>
                            </div>
                        </div>

                        {/* Centered button below the info card */}
                        <Button
                            variant="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="!py-2.5 !px-6 !text-xs !font-bold !bg-amber-500 hover:!bg-amber-600 !text-white shadow-lg shadow-amber-500/30 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Link size={16} weight="bold" />
                            <span>Link Book Space</span>
                        </Button>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};
const ExamEditModal = ({ isOpen, onClose, exam }) => {
    const { updateExam, addExam, exams, examDate, examName } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    
    const [tempName, setTempName] = useState(exam?.name || '');
    const [tempDate, setTempDate] = useState(exam?.date || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const allCustomSpaces = spaces.filter(s => !s.isSystem);

    const examsList = useMemo(() => {
        if (exams && exams.length > 0) return exams;
        if (examDate) return [{ id: 'legacy', name: examName, date: examDate, isPaused: false }];
        return [];
    }, [exams, examDate, examName]);

    // Helper to find another exam already connected to a given space
    const getOtherExamLinkedToSpace = (space, currentExamId) => {
        if (!space) return null;
        const spaceIdStr = String(space.id);
        const localIdStr = space.local_id ? String(space.local_id) : null;
        const supabaseIdStr = space.supabaseId ? String(space.supabaseId) : null;

        return examsList.find(e => {
            if (!e) return false;
            // Exclude current active exam being edited
            if (currentExamId && (String(e.id) === String(currentExamId) || (e.supabaseId && String(e.supabaseId) === String(currentExamId)))) {
                return false;
            }
            const targetId = e.book_space_id || e.bookSpaceSupabaseId || e.bookSpaceId;
            if (targetId) {
                const strTarget = String(targetId);
                if (strTarget === spaceIdStr || (localIdStr && strTarget === localIdStr) || (supabaseIdStr && strTarget === supabaseIdStr)) {
                    return true;
                }
            }
            if (space.examDate && e.date && space.examDate === e.date) {
                return true;
            }
            return false;
        });
    };

    // Sort custom spaces: available spaces first, spaces already linked to another exam at the bottom
    const sortedCustomSpaces = useMemo(() => {
        const list = spaces.filter(s => !s.isSystem);
        return [...list].sort((a, b) => {
            const aOther = Boolean(getOtherExamLinkedToSpace(a, exam?.id));
            const bOther = Boolean(getOtherExamLinkedToSpace(b, exam?.id));
            if (aOther === bOther) return 0;
            return aOther ? 1 : -1;
        });
    }, [spaces, exam, examsList]);

    const initialSpaceId = useMemo(() => {
        if (!exam) return null;
        const targetSpaceId = exam.book_space_id || exam.bookSpaceSupabaseId || exam.bookSpaceId;
        if (targetSpaceId) {
            const strId = String(targetSpaceId);
            const found = allCustomSpaces.find(s => 
                String(s.id) === strId || 
                String(s.local_id) === strId || 
                String(s.supabaseId) === strId
            );
            if (found) return found.id;
        }
        if (exam.bookSpaceSupabaseId) {
            const found = allCustomSpaces.find(s => s.supabaseId === exam.bookSpaceSupabaseId);
            if (found) return found.id;
        }
        if (exam.bookSpaceId) {
            const found = allCustomSpaces.find(s => s.id === exam.bookSpaceId || s.local_id === exam.bookSpaceId);
            if (found) return found.id;
        }
        const fallback = allCustomSpaces.find(s => s.examDate === exam.date || (s.isLinkedToExam && !s.examDate));
        return fallback?.id || null;
    }, [exam, allCustomSpaces]);

    const [selectedSpaceId, setSelectedSpaceId] = useState(initialSpaceId);

    const isCreateSelected = selectedSpaceId === '__create_new__';

    useEffect(() => {
        if (isOpen) {
            setTempName(exam?.name || '');
            setTempDate(exam?.date || '');
            setSelectedSpaceId(initialSpaceId);
        }
    }, [isOpen, exam, initialSpaceId]);

    const handleSelectCreateNew = () => {
        setSelectedSpaceId('__create_new__');
    };

    const handleSave = async () => {
        if (!tempDate) {
            showToastGlobal("Please specify an exam deadline date", "error");
            return;
        }
        if (!selectedSpaceId) {
            showToastGlobal("A Book Space must be linked to this exam", "error");
            return;
        }

        setIsSaving(true);
        try {
            let finalSpaceId = selectedSpaceId;
            let finalSpaceSupabaseId = null;

            // Only write to Supabase and Dexie/local storage when user confirms/saves
            if (selectedSpaceId === '__create_new__') {
                const spaceName = tempName.trim() || 'Exam Study Space';
                finalSpaceId = await useSpaceStore.getState().createSpace(spaceName);
                const created = useSpaceStore.getState().spaces.find(s => s.id === finalSpaceId || s.local_id === finalSpaceId);
                finalSpaceSupabaseId = created?.supabaseId || null;
                showToastGlobal(`Created and linked "${spaceName}"!`, "success");
            } else {
                const chosenSpace = spaces.find(s => s.id === selectedSpaceId || s.local_id === selectedSpaceId);
                const conflictExam = getOtherExamLinkedToSpace(chosenSpace, exam?.id);
                if (conflictExam) {
                    showToastGlobal(`"${chosenSpace?.name}" is already linked to "${conflictExam.name}". Each exam must have its own Book Space.`, "error");
                    setIsSaving(false);
                    return;
                }
                finalSpaceSupabaseId = chosenSpace?.supabaseId || null;
            }
            
            let examId = exam?.id;
            if (examId === 'legacy') {
                addExam({ 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false
                });
                useStudyStore.getState().setExamDate(null);
                useStudyStore.getState().setExamName('');
            } else if (examId) {
                updateExam(examId, { 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false, // Unpause once space is connected
                    supabaseId: exam.supabaseId
                });
            } else {
                addExam({ 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false
                });
            }

            // Strict 1:1 update
            useSpaceStore.getState().spaces.filter(s => !s.isSystem).forEach(s => {
                const wasLinkedToThis = (s.id === initialSpaceId) || (s.examDate === exam?.date);
                const isNowSelected = (s.id === finalSpaceId);

                if (isNowSelected) {
                    updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
                } else if (wasLinkedToThis) {
                    updateSpace(s.id, { isLinkedToExam: false, examDate: null });
                }
            });

            onClose();
            showToastGlobal(exam ? "Exam updated" : "Exam added", "success");
        } catch (err) {
            console.error('Failed to save exam:', err);
            showToastGlobal("Failed to save exam", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={true}
            maxWidth="max-w-lg"
            title={exam ? "Edit Exam" : "Set Exam Reminder"}
            message="Connect this exam to a Book Space so we can track reading, quizzes, and Study Wrap."
            actions={[
                {
                    label: isSaving ? "Saving..." : (exam ? "Save Changes" : "Confirm Exam Date"),
                    variant: "primary",
                    disabled: isSaving || !tempDate || !selectedSpaceId,
                    onClick: handleSave,
                },
                {
                    label: "Discard Changes",
                    variant: "ghost",
                    disabled: isSaving,
                    onClick: onClose,
                }
            ]}
        >
            <div className="space-y-6 pt-1 px-1">
                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-0.5">
                            Exam Title
                        </label>
                        <div className="flex bg-bg-subtle dark:bg-bg-dark-elevated border border-border-default rounded-xl px-3.5 py-2.5 items-center gap-2.5 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all group">
                            <PencilSimple size={18} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary shrink-0" />
                            <input 
                                type="text" 
                                value={tempName} 
                                onChange={e => setTempName(e.target.value)} 
                                placeholder="e.g. Finals 2026" 
                                className="w-full bg-transparent outline-none text-sm font-semibold text-text-primary placeholder:text-text-tertiary/40" 
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-0.5">
                            Deadline Date
                        </label>
                        <div className="flex bg-bg-subtle dark:bg-bg-dark-elevated border border-border-default rounded-xl px-3.5 py-2.5 items-center gap-2.5 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all group">
                            <CalendarBlank size={18} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary shrink-0" />
                            <input 
                                type="date" 
                                value={tempDate} 
                                onChange={e => setTempDate(e.target.value)} 
                                className="w-full bg-transparent outline-none text-sm font-semibold text-text-primary" 
                            />
                        </div>
                    </div>
                </div>

                {/* Link Book Space (Strict 1:1) */}
                <div className="space-y-3">
                    <div className="px-0.5">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                            Link Book Space <span className="text-amber-500 font-bold">*Required</span>
                        </label>
                    </div>

                    {/* Quick Auto-Create Space Matching Exam Name */}
                    <Card
                        variant="interactive"
                        onClick={handleSelectCreateNew}
                        className={`group p-3 rounded-xl border flex items-center gap-3 transition-colors duration-150 cursor-pointer ${
                            isCreateSelected
                                ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/10'
                                : 'border-dashed border-border-default hover:border-accent-primary/40 bg-transparent hover:bg-accent-primary/5'
                        }`}
                    >
                        <div className={`size-8 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
                            isCreateSelected
                                ? 'bg-accent-primary/20 text-accent-primary scale-105'
                                : 'bg-bg-subtle text-text-tertiary group-hover:text-accent-primary group-hover:bg-accent-primary/10'
                        }`}>
                            <Sparkle size={16} weight={isCreateSelected ? "fill" : "bold"} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isCreateSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {`Create "${tempName.trim() || 'New Exam Space'}"`}
                            </p>
                            <p className="text-[10px] font-medium text-text-tertiary truncate">
                                Auto-generate & link new space on save
                            </p>
                        </div>
                        <div className={`size-5 rounded-full border flex items-center justify-center transition-colors duration-150 shrink-0 ${
                            isCreateSelected
                                ? 'border-accent-primary bg-accent-primary text-white shadow-xs'
                                : 'border-border-default text-text-tertiary group-hover:border-accent-primary/50 group-hover:text-accent-primary'
                        }`}>
                            {isCreateSelected ? (
                                <div className="size-2 bg-white rounded-full" />
                            ) : (
                                <Plus size={11} weight="bold" />
                            )}
                        </div>
                    </Card>

                    {sortedCustomSpaces.length === 0 ? (
                        <EmptyState
                            icon={BookOpen}
                            title="No existing book spaces"
                            description="Select the option above to auto-create a space for this exam."
                            className="py-5"
                        />
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                            {sortedCustomSpaces.map(sp => {
                                const isSelected = selectedSpaceId === sp.id;
                                const otherExam = getOtherExamLinkedToSpace(sp, exam?.id);
                                const isLinkedToOther = Boolean(otherExam);

                                return (
                                    <Card 
                                        key={sp.id}
                                        variant={isLinkedToOther ? "default" : "interactive"}
                                        onClick={!isLinkedToOther ? () => setSelectedSpaceId(sp.id) : undefined}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-colors duration-150 ${
                                            isLinkedToOther
                                                ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-dashed border-border-default select-none'
                                                : isSelected 
                                                    ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/10 cursor-pointer' 
                                                    : 'border-border-default hover:border-accent-primary/30 cursor-pointer'
                                        }`}
                                    >
                                        <div className={`size-8 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
                                            isLinkedToOther
                                                ? 'bg-transparent text-text-tertiary/60'
                                                : isSelected 
                                                    ? 'bg-accent-primary/20 text-accent-primary scale-105' 
                                                    : 'bg-bg-subtle text-text-tertiary'
                                        }`}>
                                            <BookOpen size={16} weight="regular" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${
                                                isLinkedToOther
                                                    ? 'text-text-tertiary'
                                                    : isSelected 
                                                        ? 'text-text-primary' 
                                                        : 'text-text-secondary'
                                            }`}>
                                                {sp.name}
                                            </p>
                                            <p className="text-[10px] font-medium text-text-tertiary truncate">
                                                {isLinkedToOther
                                                    ? `Linked to "${otherExam?.name || 'Another Exam'}"`
                                                    : `${sp.bookIds?.length || 0} ${sp.bookIds?.length === 1 ? 'Book' : 'Books'}`}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {isLinkedToOther ? (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                                    In Use
                                                </span>
                                            ) : (
                                                <div className={`size-5 rounded-full border flex items-center justify-center transition-colors duration-150 ${
                                                    isSelected 
                                                        ? 'border-accent-primary bg-accent-primary text-white' 
                                                        : 'border-border-default'
                                                }`}>
                                                    {isSelected && <div className="size-2 bg-white rounded-full" />}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ExamPage;
