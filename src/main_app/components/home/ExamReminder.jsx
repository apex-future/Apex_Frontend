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
import Modal from '../ui/Modal';
import Label from '../ui/Label';
import EmptyState from '../ui/EmptyState';
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

    const daysLeft = calculateDaysLeft();
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
        return (
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                showCloseButton={true}
                maxWidth="max-w-lg"
                title={activeExam ? "Exam Settings" : "Set Exam Reminder"}
                message="Configure your countdown and study links to stay on track."
                actions={[
                    {
                        label: activeExam ? "Save Changes" : "Confirm Exam Date",
                        variant: "primary",
                        disabled: !tempDate,
                        onClick: handleSave,
                    },
                    {
                        label: "Discard Changes",
                        variant: "ghost",
                        onClick: () => setIsEditing(false),
                    }
                ]}
            >
                <div className="space-y-6 pt-1">
                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-0.5">
                                Exam Title
                            </label>
                            <div className="flex bg-bg-subtle dark:bg-bg-dark-elevated border border-border-default rounded-xl px-3.5 py-2.5 items-center gap-2.5 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all group">
                                <TextT size={18} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary shrink-0" />
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

                    {/* Link Study Spaces */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-0.5">
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                Link Study Spaces
                            </label>
                            <Label variant="primary" size="sm">
                                {selectedSpaceIds.length} Selected
                            </Label>
                        </div>
                        
                        {customSpaces.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No custom study spaces"
                                description="Create spaces to organize books and connect them with this exam."
                                className="py-6"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                                {customSpaces.map(sp => {
                                    const isSelected = selectedSpaceIds.includes(sp.id);
                                    return (
                                        <Card
                                            key={sp.id}
                                            variant="interactive"
                                            onClick={() => toggleSpace(sp.id)}
                                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/10' 
                                                    : 'border-border-default hover:border-accent-primary/30'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                                isSelected 
                                                    ? 'bg-accent-primary/20 text-accent-primary scale-105' 
                                                    : 'bg-bg-subtle text-text-tertiary'
                                            }`}>
                                                <BookOpen size={16} weight="regular" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {sp.name}
                                                </p>
                                                <p className="text-[10px] font-medium text-text-tertiary truncate">
                                                    {sp.bookIds?.length || 0} {sp.bookIds?.length === 1 ? 'Book' : 'Books'}
                                                </p>
                                            </div>
                                            <div className={`size-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                                isSelected 
                                                    ? 'border-accent-primary bg-accent-primary text-white' 
                                                    : 'border-border-default'
                                            }`}>
                                                {isSelected && <Check size={12} weight="bold" />}
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

    const renderDeleteModal = () => {
        return (
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Reminder?"
                message={`This will permanently remove the reminder for "${activeExam?.name || 'this exam'}" and unlink its study spaces.`}
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
