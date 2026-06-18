import React, { useState, useMemo } from 'react';
import { 
    Alarm, Plus, ArrowLeft, CalendarBlank, Link, 
    PencilSimple, Trash, Pause, Play, Clock, MagnifyingGlass, SquaresFour, CheckCircle, WarningCircle, X
} from '@phosphor-icons/react';
import useStudyStore from '../store/studyStore';
import useSpaceStore from '../store/spaceStore';
import useThemeStore from '../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { showToastGlobal } from '../hooks/useToast';
import { createPortal } from 'react-dom';

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

    // Map legacy single exam if exams array is empty, otherwise use exams array
    const allExams = useMemo(() => {
        let baseExams = (exams && exams.length > 0) ? [...exams] : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []);
        
        return baseExams.map(exam => {
            const diff = new Date(exam.date) - new Date();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            let status = 'on track';
            if (exam.isPaused) status = 'paused';
            else if (daysLeft < 0) status = 'completed';
            else if (daysLeft <= 3) status = 'final push';
            else if (daysLeft <= 7) status = 'critical';
            else if (daysLeft <= 21) status = 'urgent';
            else {
                // Determine if 'Steady' or 'On Track' based on linked shelf activity
                const linked = spaces.filter(s => !s.isSystem && (s.examDate === exam.date || (s.isLinkedToExam && !s.examDate)));
                const hasActivity = linked.some(s => (s.activitySummaries?.timeSpent > 0) || (s.activitySummaries?.pagesRead > 0));
                status = hasActivity ? 'steady' : 'on track';
            }

            return { ...exam, daysLeft, status };
        });
    }, [exams, examDate, examName, spaces]);

    // Grouping and Sorting Logic
    const sections = useMemo(() => {
        const filtered = allExams.filter(exam => 
            exam.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {
            ongoing: filtered.filter(e => e.status !== 'completed' && !e.isPaused),
            paused: filtered.filter(e => e.isPaused),
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

        const emptyMessages = {
            ongoing: "No active exams found. Ready to set a new goal?",
            paused: "No paused exam timers. Keep up the momentum!",
            completed: "No completed exams yet. Your milestones will appear here."
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
                                    linkedSpaces={getLinkedSpaces(exam)}
                                    onEdit={() => { setSelectedExam(exam); setIsEditModalOpen(true); }}
                                    onDelete={() => handleDelete(exam)}
                                    onTogglePause={() => togglePauseExam(exam.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-bg-elevated/30 rounded-[2.5rem] border-2 border-dashed border-border-default/50">
                        <p className="text-xs font-bold text-text-tertiary">{emptyMessages[type]}</p>
                    </div>
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
                    {/* Search Bar */}
                    <div className="relative group">
                        <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors" size={20} weight="regular" />
                        <input 
                            type="text"
                            placeholder="Search your exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-bg-elevated border-2 border-border-default rounded-3xl outline-none focus:border-accent-primary/40 text-sm font-bold text-text-primary transition-all shadow-sm"
                        />
                    </div>
                    
                    {/* Filter & Sort Bar */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-wrap bg-bg-elevated p-1 rounded-[1.5rem] border-2 border-border-default shadow-sm min-w-max">
                            {['all', 'ongoing', 'paused', 'completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-5 py-2.5 rounded-2xl text-xs font-black capitalize transition-all ${filterStatus === status ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' : 'text-text-tertiary hover:bg-bg-subtle'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap bg-bg-elevated p-1 rounded-[1.5rem] border-2 border-border-default shadow-sm min-w-max">
                            {[
                                { id: 'urgency', label: 'Urgency', icon: WarningCircle },
                                { id: 'newest', label: 'Newest Set', icon: Plus },
                                { id: 'oldest', label: 'Oldest Set', icon: Clock },
                                { id: 'name', label: 'A-Z', icon: MagnifyingGlass }
                            ].map((sort) => (
                                <button
                                    key={sort.id}
                                    onClick={() => setSortBy(sort.id)}
                                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${sortBy === sort.id ? 'bg-bg-subtle text-accent-primary' : 'text-text-tertiary hover:bg-bg-subtle'}`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sectioned Content */}
                <div className="space-y-12">
                    {renderSection('Ongoing', sections.ongoing, 'ongoing')}
                    {renderSection('Paused', sections.paused, 'paused')}
                    {renderSection('Completed', sections.completed, 'completed')}

                    {allExams.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center bg-bg-elevated/50 rounded-[3rem] border-2 border-dashed border-border-default">
                            <div className="size-20 bg-bg-subtle rounded-full flex items-center justify-center text-text-tertiary mb-6">
                                <Alarm size={40} weight="thin" />
                            </div>
                            <h3 className="text-xl font-black text-text-primary mb-2">No exams found</h3>
                            <p className="text-sm font-bold text-text-tertiary max-w-xs">Create your first exam reminder to start tracking.</p>
                        </div>
                    )}
                </div>
            </main>

            {isEditModalOpen && (
                <ExamEditModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    exam={selectedExam}
                    resolvedTheme={resolvedTheme}
                />
            )}

            {isDeleteModalOpen && (
                <div className={`fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ${resolvedTheme}`}>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsDeleteModalOpen(false)}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-md bg-bg-elevated/95 backdrop-blur-2xl rounded-[2.5rem] border-2 border-border-default shadow-2xl p-8 flex flex-col items-center text-center"
                    >
                        <div className="size-16 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mb-6">
                            <Trash size={32} weight="regular" />
                        </div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">Delete Reminder?</h2>
                        <p className="text-sm font-bold text-text-tertiary mb-8">This will permanently remove <span className="text-text-primary">"{examToDelete?.name}"</span> and unlink its study shelves.</p>
                        
                        <div className="flex flex-col w-full gap-3">
                            <button 
                                onClick={confirmDelete}
                                className="w-full py-4 font-black text-white bg-red-500 rounded-3xl shadow-xl shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all"
                            >
                                Yes, Delete
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-4 font-black text-text-secondary bg-bg-elevated hover:bg-bg-subtle transition-all active:scale-95 border-2 border-border-default rounded-3xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const ExamCard = ({ exam, linkedSpaces, onEdit, onDelete, onTogglePause }) => {
    const isPaused = exam.isPaused;
    const daysLeft = exam.daysLeft;

    // Mood Logic (Synced with ExamReminder.jsx)
    let moodLabel = 'On Track';
    let moodColor = 'bg-emerald-500';
    let moodBgColor = 'bg-emerald-500/10';
    let moodTextColor = 'text-emerald-500';
    let moodBorderColor = 'border-emerald-500/20';
    let moodAmbientBg = 'from-emerald-500/20 to-transparent';
    let moodGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.15)]';

    if (isPaused) {
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
            className={`group bg-bg-subtle/80 dark:bg-bg-elevated/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col transition-all shadow-sm hover:shadow-md relative overflow-hidden h-full ${isPaused ? 'opacity-80' : ''}`}
        >
            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-16 blur-3xl opacity-30 transition-all duration-700 pointer-events-none bg-gradient-to-br ${moodAmbientBg}`} />

            <div className="flex flex-col w-full h-full relative z-10 justify-between">
                {/* Top Row: Status and Actions */}
                <div className="flex justify-between items-center w-full mb-8">
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

                {/* Middle Row: Content */}
                <div className="flex flex-col flex-1 items-center justify-center w-full gap-2 mb-8">
                    <div className="flex flex-col items-center justify-center">
                        <span className={`text-7xl sm:text-8xl font-black tabular-nums tracking-tighter leading-none ${isPaused ? 'text-text-tertiary opacity-40' : 'text-text-primary'}`}>
                            {daysLeft > 0 ? daysLeft : 0}
                        </span>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-2">Days Left</span>
                    </div>
                </div>

                {/* Info Row: Title and Date */}
                <div className="space-y-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-text-primary tracking-tight leading-tight group-hover:text-accent-primary transition-colors line-clamp-1">{exam.name || 'Untitled Exam'}</h3>
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-text-tertiary mt-1">
                            <CalendarBlank size={12} weight="regular" className="text-accent-primary" />
                            {new Date(exam.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Bottom Row: Linked Shelves */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-[9px] font-black text-text-tertiary uppercase tracking-widest opacity-60">
                                <Link size={10} weight="regular" />
                                Connected Shelves
                            </div>
                            {linkedSpaces.length > 0 && (
                                <span className="text-[9px] font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                                    {linkedSpaces.length}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                            {linkedSpaces.length > 0 ? (
                                linkedSpaces.map(space => (
                                    <span key={space.id} className="px-2.5 py-1.5 bg-bg-subtle/50 text-[10px] font-bold text-text-secondary rounded-xl border border-border-default/50 backdrop-blur-sm truncate max-w-[140px]">
                                        {space.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-[10px] font-bold text-text-tertiary px-1">No shelves linked.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ExamEditModal = ({ isOpen, onClose, exam, resolvedTheme }) => {
    const { updateExam, addExam } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    
    const [tempName, setTempName] = useState(exam?.name || '');
    const [tempDate, setTempDate] = useState(exam?.date || '');
    
    const customSpaces = spaces.filter(s => !s.isSystem);
    const initialLinked = customSpaces.filter(s => s.examDate === exam?.date || (s.isLinkedToExam && !s.examDate)).map(s => s.id);
    const [selectedSpaceIds, setSelectedSpaceIds] = useState(initialLinked);

    const handleSave = () => {
        if (!tempDate) return;
        
        let examId = exam?.id;
        if (examId === 'legacy') {
            useStudyStore.getState().setExamDate(tempDate);
            useStudyStore.getState().setExamName(tempName);
        } else if (examId) {
            updateExam(examId, { name: tempName, date: tempDate });
        } else {
            addExam({ name: tempName, date: tempDate });
        }

        // Only update spaces that changed
        customSpaces.forEach(s => {
            const wasLinked = s.examDate === exam?.date || (s.isLinkedToExam && exam?.id === 'legacy');
            const isSelected = selectedSpaceIds.includes(s.id);

            if (isSelected && !wasLinked) {
                // Newly linked
                updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
            } else if (!isSelected && wasLinked) {
                // Newly unlinked
                updateSpace(s.id, { isLinkedToExam: false, examDate: null });
            } else if (isSelected && wasLinked && tempDate !== exam?.date) {
                // Still linked but date changed
                updateSpace(s.id, { examDate: tempDate });
            }
        });

        onClose();
        showToastGlobal(exam ? "Exam updated" : "Exam added", "success");
    };

    const toggleSpace = (id) => {
        setSelectedSpaceIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 overflow-hidden ${resolvedTheme}`}>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] bg-bg-elevated/95 sm:bg-bg-elevated/90 backdrop-blur-2xl sm:rounded-[2.5rem] border-0 sm:border-2 border-border-default shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6">
                    <h2 className="text-xl font-black text-text-primary tracking-tight">{exam ? 'Edit Exam' : 'New Exam'}</h2>
                    <button onClick={onClose} className="p-2.5 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all">
                        <X size={20} weight="bold" className="rotate-45" />
                    </button>
                </div>

                {/* Explanation */}
                <div className="px-8 pb-2">
                    <p className="text-xs font-bold text-text-tertiary">Configure your countdown and study links to stay on track.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Exam Title</label>
                            <div className="flex bg-bg-elevated border-2 border-border-default rounded-2xl px-5 py-4 items-center gap-4 focus-within:border-accent-primary/40 transition-all group shadow-sm">
                                <PencilSimple size={20} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary" />
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={e=>setTempName(e.target.value)} 
                                    placeholder="e.g. Finals 2026" 
                                    className="w-full bg-transparent outline-none text-sm font-bold text-text-primary" 
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Deadline Date</label>
                            <div className="flex bg-bg-elevated border-2 border-border-default rounded-2xl px-5 py-4 items-center gap-4 focus-within:border-accent-primary/40 transition-all group shadow-sm">
                                <CalendarBlank size={20} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary" />
                                <input 
                                    type="date" 
                                    value={tempDate} 
                                    onChange={e=>setTempDate(e.target.value)} 
                                    className="w-full bg-transparent outline-none text-sm font-bold text-text-primary" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest px-1">Link Study Shelves</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {customSpaces.map(sp => {
                                const isSelected = selectedSpaceIds.includes(sp.id);
                                return (
                                    <div 
                                        key={sp.id}
                                        onClick={() => toggleSpace(sp.id)}
                                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 group/item ${isSelected ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10' : 'border-border-default bg-bg-elevated hover:border-accent-primary/30'}`}
                                    >
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-accent-primary/20 text-accent-primary scale-110' : 'bg-bg-subtle text-text-tertiary group-hover/item:text-accent-primary'}`}>
                                            <SquaresFour size={20} weight="regular" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{sp.name}</p>
                                            <p className="text-[10px] font-bold text-text-tertiary">{sp.bookIds?.length || 0} Books</p>
                                        </div>
                                        <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-accent-primary bg-accent-primary' : 'border-border-default'}`}>
                                            {isSelected && <Plus size={14} weight="bold" className="text-white rotate-45" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions in Flow */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button 
                            onClick={handleSave} 
                            disabled={!tempDate} 
                            className="w-full sm:flex-[1.5] py-4 font-black text-white bg-accent-primary rounded-3xl disabled:opacity-30 shadow-xl shadow-accent-primary/20 hover:brightness-110 active:scale-95 transition-all order-1 sm:order-2"
                        >
                            Save Reminder
                        </button>
                        <button onClick={onClose} className="w-full sm:flex-1 py-4 font-black text-text-secondary bg-bg-elevated hover:bg-bg-subtle transition-all active:scale-95 border-2 border-border-default rounded-3xl order-2 sm:order-1">Discard</button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default ExamPage;
