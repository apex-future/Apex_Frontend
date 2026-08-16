import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PencilSimple, Alarm, CalendarBlank, BookOpen, X, TextT, Trash, Pause, Play, CaretLeft, CaretRight, Plus, Link, Sparkle, Trophy, Target, Lightning, Bell, CaretDown, Check } from '@phosphor-icons/react';
import useStudyStore from '../../store/studyStore';
import useSpaceStore from '../../store/spaceStore';
import useThemeStore from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { showToastGlobal } from '../../hooks/useToast';
import examBgPattern from '../../../assets/exam-bg-pattern.png';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StudyWrap from '../study-wrap/StudyWrap';
const CardContainer = ({ children, onClick, className = '', title = '', activeExam, isEditing, examsList, currentIndex, onAdd }) => (
    <div className="w-full h-full relative group/container flex flex-col">
        <div className="flex justify-between items-center mb-2 px-2">
            <h2 className='text-xs font-bold uppercase tracking-wider text-text-tertiary'>{title || activeExam?.name || 'Exam Timer'}</h2>
            
            <div className="flex items-center gap-3">
                {examsList?.length > 1 && !isEditing && (
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest bg-bg-subtle px-2 py-0.5 rounded-full border border-border-default">
                        {currentIndex + 1} / {examsList.length}
                    </span>
                )}
                {!isEditing && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
                        className="p-1.5 hover:bg-accent-primary/10 text-accent-primary rounded-xl transition-all active:scale-90"
                        title="Add New Exam"
                    >
                        <Plus size={18} weight="bold" />
                    </button>
                )}
            </div>
        </div>
        <Card
            onClick={onClick}
            variant={onClick ? "interactive" : "default"}
            className={`transition-all duration-500 group relative min-h-[14rem] flex-1 flex flex-col p-4 px-6 ${className} ${isEditing ? 'overflow-visible z-[60]' : 'overflow-hidden'} ${(activeExam?.isPaused && !isEditing) ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            {/* Background effects layer - clipped */}
            <div className="absolute inset-0 rounded-card overflow-hidden pointer-events-none">
                <div 
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.05]"
                    style={{ backgroundImage: `url(${examBgPattern})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }}
                />
            </div>
            
            {/* Content layer - can overflow when editing */}
            <div className="relative z-10 flex-1 flex flex-col">
                {children}
            </div>
        </Card>
    </div>
);

const ExamReminder = () => {
    const { exams, examDate, setExamDate, examName, setExamName, addExam, updateExam, deleteExam, togglePauseExam } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const navigate = useNavigate();

    // Combine multi exams array with legacy fallback (memoized — inline [] recreated every render)
    const examsList = useMemo(
        () => (exams && exams.length > 0)
            ? exams
            : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []),
        [exams, examDate, examName]
    );

    // States
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeExam = examsList[currentIndex] || null;
    const activeExamId = activeExam?.id ?? null;
    const activeExamDate = activeExam?.date ?? '';
    const activeExamName = activeExam?.name ?? '';
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { resolvedTheme } = useThemeStore();

    // Form temps
    const [tempDate, setTempDate] = useState('');
    const [tempName, setTempName] = useState('');
    const [selectedSpaceIds, setSelectedSpaceIds] = useState([]);

    const customSpaces = spaces.filter(s => !s.isSystem);
    const linkedSpaces = customSpaces.filter(s => selectedSpaceIds.includes(s.id));

    useEffect(() => {
        if (activeExamId) {
            setTempDate(activeExamDate);
            setTempName(activeExamName);
            const linked = spaces.filter(
                s => !s.isSystem && (s.examDate === activeExamDate || (s.isLinkedToExam && !s.examDate))
            );
            setSelectedSpaceIds(linked.map(s => s.id));
        } else {
            setTempDate('');
            setTempName('');
            setSelectedSpaceIds([]);
        }
    }, [activeExamId, activeExamDate, activeExamName, isEditing, spaces]);

    const calculateDaysLeft = () => {
        if (!activeExam?.date) return null;
        const diff = new Date(activeExam.date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // TEMP: hardcoded for Study Wrap testing — remove when live
    const daysLeft = 0;
    const isPaused = activeExam?.isPaused;

    // Resolve the best bookSpaceId for Study Wrap
    const effectiveBookSpaceId = useMemo(() => {
        if (activeExam?.bookSpaceSupabaseId) return activeExam.bookSpaceSupabaseId;
        if (activeExam?.bookSpaceId) return activeExam.bookSpaceId;

        const linked = spaces.find(s => !s.isSystem && (s.examDate === activeExam?.date || s.isLinkedToExam));
        if (linked?.supabaseId) return linked.supabaseId;
        if (linked?.id && linked.id !== 'active-reading' && linked.id !== 'favorites') return linked.id;

        const custom = spaces.find(s => !s.isSystem && s.supabaseId);
        if (custom?.supabaseId) return custom.supabaseId;

        const anyCustom = spaces.find(s => !s.isSystem);
        if (anyCustom?.id) return anyCustom.id;

        const anySpace = spaces.find(s => s.supabaseId);
        if (anySpace?.supabaseId) return anySpace.supabaseId;

        return 'default';
    }, [activeExam, spaces]);

    // Study Wrap state
    const [showWrap, setShowWrap] = useState(false);

    // Evaluate if there is consistent activity across any linked space
    const hasConsistentActivity = linkedSpaces.some(s => 
        (s.activitySummaries?.timeSpent > 0) || 
        (s.activitySummaries?.pagesRead > 0)
    );

    let moodColor = 'bg-emerald-500';
    let moodTextColor = 'text-emerald-600 dark:text-emerald-500';
    let moodBgColor = 'bg-emerald-500/10';
    let moodBorderColor = 'border-emerald-500/20';
    let moodLabel = 'On Track';
    let moodGlow = 'shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]';
    let moodAmbientBg = 'bg-emerald-500/5 group-hover:bg-emerald-500/10';

    if (isPaused) {
        moodColor = 'bg-neutral-500';
        moodTextColor = 'text-neutral-500';
        moodBgColor = 'bg-neutral-500/10';
        moodBorderColor = 'border-neutral-500/20';
        moodLabel = 'Paused';
        moodGlow = 'shadow-[inset_0_0_8px_rgba(115,115,115,0.15)]';
        moodAmbientBg = 'bg-neutral-500/5 group-hover:bg-neutral-500/10';
    } else if (daysLeft !== null) {
        if (daysLeft < 0) {
            moodColor = 'bg-blue-600';
            moodTextColor = 'text-blue-600 dark:text-blue-500';
            moodBgColor = 'bg-blue-600/10';
            moodBorderColor = 'border-blue-600/20';
            moodLabel = 'Completed';
            moodGlow = 'shadow-[inset_0_0_15px_rgba(37,99,235,0.25)]';
            moodAmbientBg = 'bg-blue-600/5 group-hover:bg-blue-600/10';
        } else if (daysLeft === 0) {
            moodColor = 'bg-amber-400';
            moodTextColor = 'text-amber-600 dark:text-amber-400';
            moodBgColor = 'bg-amber-400/15';
            moodBorderColor = 'border-amber-400/30';
            moodLabel = 'D-Day';
            moodGlow = 'shadow-[inset_0_0_15px_rgba(251,191,36,0.35)]';
            moodAmbientBg = 'bg-amber-400/15 group-hover:bg-amber-400/25';
        } else if (daysLeft <= 3) {
            moodColor = 'bg-gradient-to-r from-orange-500 to-red-600';
            moodTextColor = 'text-red-600 dark:text-red-500';
            moodBgColor = 'bg-red-500/10';
            moodBorderColor = 'border-red-500/20';
            moodLabel = 'Final Push';
            moodGlow = 'shadow-[inset_0_0_15px_rgba(239,68,68,0.25)]';
            moodAmbientBg = 'bg-red-500/5 group-hover:bg-red-500/10';
        } else if (daysLeft <= 7) {
            moodColor = 'bg-red-500';
            moodTextColor = 'text-red-600 dark:text-red-500';
            moodBgColor = 'bg-red-500/10';
            moodBorderColor = 'border-red-500/20';
            moodLabel = 'Critical';
            moodGlow = 'shadow-[inset_0_0_15px_rgba(239,68,68,0.25)]';
            moodAmbientBg = 'bg-red-500/5 group-hover:bg-red-500/10';
        } else if (daysLeft <= 21) {
            moodColor = 'bg-amber-500';
            moodTextColor = 'text-amber-600 dark:text-amber-500';
            moodBgColor = 'bg-amber-500/10';
            moodBorderColor = 'border-amber-500/20';
            moodLabel = 'Urgent';
            moodGlow = 'shadow-[inset_0_0_15px_rgba(245,158,11,0.2)]';
            moodAmbientBg = 'bg-amber-500/5 group-hover:bg-amber-500/10';
        } else {
            if (hasConsistentActivity) {
                moodColor = 'bg-blue-500';
                moodTextColor = 'text-blue-600 dark:text-blue-500';
                moodBgColor = 'bg-blue-500/10';
                moodBorderColor = 'border-blue-500/20';
                moodLabel = 'Steady';
                moodGlow = 'shadow-[inset_0_0_12px_rgba(59,130,246,0.2)]';
                moodAmbientBg = 'bg-blue-500/5 group-hover:bg-blue-500/10';
            } else {
                moodColor = 'bg-emerald-500';
                moodTextColor = 'text-emerald-600 dark:text-emerald-500';
                moodBgColor = 'bg-emerald-500/10';
                moodBorderColor = 'border-emerald-500/20';
                moodLabel = 'On Track';
                moodGlow = 'shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]';
                moodAmbientBg = 'bg-emerald-500/5 group-hover:bg-emerald-500/10';
            }
        }
    }

    const nextExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s + 1) % examsList.length); };
    const prevExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s - 1 + examsList.length) % examsList.length); };

    const handleSave = () => {
        if (!tempDate) return;
        
        const isNew = !activeExam;

        // Resolve the supabaseId of the first selected space for Supabase persistence
        const linkedSpaceSupabaseId = selectedSpaceIds.length > 0
            ? customSpaces.find(s => s.id === selectedSpaceIds[0])?.supabaseId || null
            : null;

        if (activeExam?.id === 'legacy') {
            // Convert legacy to a new synced exam
            addExam({ name: tempName, date: tempDate, bookSpaceSupabaseId: linkedSpaceSupabaseId });
            setExamDate(null); // Clear legacy
            setExamName('');
        } else if (activeExam?.id) {
            // Update existing
            updateExam(activeExam.id, { 
                name: tempName, 
                date: tempDate, 
                bookSpaceSupabaseId: linkedSpaceSupabaseId,
                supabaseId: activeExam.supabaseId // Ensure we pass this for PUT logic in syncService
            });
        } else {
            // Create new
            addExam({ name: tempName, date: tempDate, bookSpaceSupabaseId: linkedSpaceSupabaseId });
        }

        // Only update spaces that changed
        customSpaces.forEach(s => {
            const wasLinked = s.examDate === activeExam?.date || (s.isLinkedToExam && activeExam?.id === 'legacy');
            const isSelected = selectedSpaceIds.includes(s.id);

            if (isSelected && !wasLinked) {
                // Newly linked
                updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
            } else if (!isSelected && wasLinked) {
                // Newly unlinked
                updateSpace(s.id, { isLinkedToExam: false, examDate: null });
            } else if (isSelected && wasLinked && tempDate !== activeExam?.date) {
                // Still linked but date changed
                updateSpace(s.id, { examDate: tempDate });
            }
        });

        setIsEditing(false);
        if (isNew) {
            showToastGlobal("Your exam reminder is set! Stay focused.", "success");
        } else {
            showToastGlobal("Exam details updated.", "success");
        }
    };

    const handleDeleteCurrent = (e) => {
        e.stopPropagation();
        if (!activeExam) return;
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!activeExam) return;
        if (activeExam.id === 'legacy') {
            setExamDate(null);
            setExamName('');
        } else {
            deleteExam(activeExam.id);
        }
        setCurrentIndex(0);
        setIsDeleteModalOpen(false);
        showToastGlobal("Reminder deleted.", "info");
    };



    const toggleSpace = (id) => {
        setSelectedSpaceIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const renderModal = () => {
        if (!isEditing) return null;

        return createPortal(
            <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 overflow-hidden ${resolvedTheme}`}>
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsEditing(false)}
                />
                
                {/* Modal Container */}
                <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] bg-bg-elevated/95 sm:bg-bg-elevated/90 backdrop-blur-2xl sm:rounded-[2.5rem] border-0 sm:border-2 border-border-default shadow-2xl flex flex-col overflow-hidden animate-in sm:zoom-in-95 fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6">
                        <h2 className="text-xl font-black text-text-primary tracking-tight">Exam Settings</h2>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="p-2.5 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>

                    {/* Explanation */}
                    <div className="px-8 pb-2">
                        <p className="text-xs font-bold text-text-tertiary">Configure your countdown and study links to stay on track.</p>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Exam Title</label>
                                <div className="flex bg-bg-elevated border-2 border-border-default rounded-2xl px-5 py-4 items-center gap-4 focus-within:border-accent-primary/40 transition-all group shadow-sm">
                                    <TextT size={20} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary" />
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
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Link Study Spaces</label>
                                <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                                    {selectedSpaceIds.length} Selected
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {customSpaces.length === 0 ? (
                                    <div className="col-span-full py-8 text-center bg-bg-subtle/50 rounded-3xl border-2 border-dashed border-border-default">
                                        <p className="text-sm font-bold text-text-tertiary">No custom book spaces found.</p>
                                    </div>
                                ) : (
                                    customSpaces.map(sp => {
                                        const isSelected = selectedSpaceIds.includes(sp.id);
                                        return (
                                            <div 
                                                key={sp.id}
                                                onClick={() => toggleSpace(sp.id)}
                                                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 group/item ${isSelected ? 'border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent-primary/10' : 'border-border-default bg-bg-elevated hover:border-accent-primary/30'}`}
                                            >
                                                <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-accent-primary/20 text-accent-primary scale-110' : 'bg-bg-subtle text-text-tertiary group-hover/item:text-accent-primary'}`}>
                                                    <BookOpen size={20} weight="regular" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-black truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{sp.name}</p>
                                                    <p className="text-[10px] font-bold text-text-tertiary truncate">
                                                        {sp.bookIds?.length || 0} {sp.bookIds?.length === 1 ? 'Book' : 'Books'}
                                                    </p>
                                                </div>
                                                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-accent-primary bg-accent-primary' : 'border-border-default'}`}>
                                                    {isSelected && <Check size={14} weight="bold" className="text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Actions in Flow */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <button 
                                onClick={handleSave} 
                                disabled={!tempDate} 
                                className="w-full sm:flex-[1.5] py-4 font-black text-white bg-accent-primary rounded-3xl disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-accent-primary/40 hover:brightness-110 active:scale-[0.98] transition-all order-1 sm:order-2"
                            >
                                Confirm Exam Date
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                className="w-full sm:flex-1 py-4 font-black text-text-secondary bg-bg-elevated hover:bg-bg-subtle transition-all active:scale-95 border-2 border-border-default rounded-3xl order-2 sm:order-1"
                            >
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };



    const renderDeleteModal = () => {
        if (!isDeleteModalOpen) return null;

        return createPortal(
            <div className={`fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ${resolvedTheme}`}>
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsDeleteModalOpen(false)}
                />
                <div className="relative w-full max-w-md bg-bg-elevated/95 backdrop-blur-2xl rounded-[2.5rem] border-2 border-border-default shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
                    <div className="size-16 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mb-6">
                        <Trash size={32} weight="regular" />
                    </div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">Delete Reminder?</h2>
                    <p className="text-sm font-bold text-text-tertiary mb-8">This will permanently remove the reminder for <span className="text-text-primary">"{activeExam?.name}"</span> and unlink its study spaces.</p>
                    
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
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            <CardContainer 
                title={activeExam ? (isEditing ? "Update Reminder" : (activeExam.name || 'Upcoming Exam')) : "Ready to start?"} 
                className={`relative overflow-hidden group ${!activeExam ? 'border-dashed hover:bg-accent-primary/5' : ''}`}
                activeExam={activeExam}
                isEditing={isEditing}
                examsList={examsList}
                currentIndex={currentIndex}
                onAdd={() => {
                    setCurrentIndex(examsList.length); // Points to a 'new' state effectively
                    setTempName('');
                    setTempDate('');
                    setSelectedSpaceIds([]);
                    setIsEditing(true);
                }}
                onClick={!activeExam ? () => setIsEditing(true) : () => navigate('/exams')}
            >
                {!activeExam ? (
                    <>
                        <div className="absolute -bottom-10 -left-10 size-60 text-accent-primary/5 rotate-12 group-hover:rotate-6 transition-all duration-1000 pointer-events-none">
                            <Alarm size="100%" weight="thin" />
                        </div>
                        <div className="flex flex-col items-center justify-center w-full h-full relative z-10 text-center gap-6">
                            <div className="size-16 bg-accent-primary/10 rounded-[2rem] flex items-center justify-center text-accent-primary shadow-inner border border-accent-primary/20 group-hover:scale-110 transition-transform">
                                <Plus size={32} weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-text-primary tracking-tight mb-2">Set Exam Deadline</h3>
                                <p className="text-sm text-text-tertiary font-medium max-w-[240px]">Track your milestones and get smart reading reminders.</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-16 blur-3xl transition-all duration-700 pointer-events-none ${moodAmbientBg}`} />

                        <div className="flex flex-col w-full h-full relative z-10 justify-between">
                            {/* Top Row: NavigationArrow and Action Buttons */}
                            <div className="flex justify-between items-center w-full mb-2">
                                <div className="flex gap-2 items-center flex-1">
                                    {examsList.length > 1 && (
                                        <div className="flex gap-1.5 mr-2">
                                            <button onClick={prevExam} className="p-1.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl shadow-sm border border-border-default text-text-secondary hover:text-accent-primary transition-all active:scale-90"><CaretLeft size={14} weight="bold"/></button>
                                            <button onClick={nextExam} className="p-1.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl shadow-sm border border-border-default text-text-secondary hover:text-accent-primary transition-all active:scale-90"><CaretRight size={14} weight="bold"/></button>
                                        </div>
                                    )}
                                    <div className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5 transition-all duration-500 whitespace-nowrap ${moodBgColor} ${moodTextColor} ${moodBorderColor} ${moodGlow}`}>
                                        <div className={`size-1.5 rounded-full ${moodColor} ${!isPaused ? 'animate-pulse' : ''}`} />
                                        {moodLabel}
                                    </div>
                                </div>
                                
                                <div className="flex gap-1 backdrop-blur-xl bg-white/50 dark:bg-black/20 rounded-[1.25rem] p-1 shadow-sm transition-all z-20">
                                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-2 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-xl transition-all" title="Edit"><PencilSimple size={16} weight="regular"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); if (activeExam?.id && activeExam.id !== 'legacy') togglePauseExam(activeExam.id); }} className="p-2 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-xl transition-all" title={activeExam?.isPaused ? "Resume" : "Pause"}>{activeExam?.isPaused ? <Play size={16} weight="fill" /> : <Pause size={16} weight="fill" />}</button>
                                    <button onClick={handleDeleteCurrent} className="p-2 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all" title="Delete"><Trash size={16} weight="regular"/></button>
                                </div>
                            </div>

                            {/* Middle Row: Content */}
                            <div className="flex flex-col flex-1 items-center justify-center w-full gap-4">
                                <div className="flex flex-col items-center justify-center">
                                    <span className={`text-6xl lg:text-7xl font-black tabular-nums tracking-tighter leading-none ${activeExam?.isPaused ? 'text-text-tertiary opacity-40' : 'text-text-primary'}`}>
                                        {daysLeft > 0 ? daysLeft : 0}
                                    </span>
                                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-1">Days Left</span>
                                </div>
                                
                                <div className="flex items-center justify-center flex-wrap text-xs font-bold text-text-tertiary gap-2">
                                    <p className="flex items-center gap-1.5">
                                        <CalendarBlank size={14} weight="regular" className="text-accent-primary" />
                                        {new Date(activeExam?.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {selectedSpaceIds.length > 0 && (
                                        <>
                                            <span className="mx-1 text-text-tertiary/40">•</span>
                                            <p className="flex items-center gap-1.5">
                                                <Link size={14} weight="regular" className="text-accent-primary" />
                                                <span>Linked to {selectedSpaceIds.length} {selectedSpaceIds.length === 1 ? 'Space' : 'Spaces'}</span>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Study Wrap button when daysLeft === 0 */}
                                {daysLeft !== null && daysLeft <= 0 && (
                                    <div className="w-full mt-2 px-1">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('[StudyWrap] Triggered from dashboard');
                                                setShowWrap(true);
                                            }}
                                            className="!py-2.5 md:!py-3 !font-bold !text-xs md:!text-sm !shadow-lg shadow-purple-900/40 hover:brightness-110 active:scale-[0.98] transition-all"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                        >
                                            Watch your Study Wrap
                                        </Button>
                                    </div>
                                )}

                            </div>
                        </div>
                    </>
                )}
            </CardContainer>
            {renderModal()}
            {renderDeleteModal()}
            <StudyWrap
                isOpen={showWrap}
                onClose={() => setShowWrap(false)}
                daysLeft={daysLeft}
                bookSpaceId={effectiveBookSpaceId}
            />
        </>
    );
};

export default ExamReminder;
