import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PencilSimple, Alarm, CalendarBlank, BookOpen, X, TextT, Trash, Pause, Play, CaretLeft, CaretRight, Plus, Link, Sparkle, Trophy, Target, Lightning, Bell, CaretDown, Check, WarningCircle } from '@phosphor-icons/react';
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
const CardContainer = ({ children, title, className = "", activeExam, isEditing, examsList, currentIndex, onAdd, onClick, isUnlinked }) => (
    <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-tertiary truncate">
                {title}
            </h2>
            
            <div className="flex items-center gap-2 shrink-0">
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
                        <Plus size={16} weight="bold" />
                    </button>
                )}
            </div>
        </div>
        <Card
            onClick={onClick}
            variant={onClick ? "interactive" : "default"}
            className={`transition-all duration-500 group relative min-h-[14rem] flex-1 flex flex-col p-4 px-6 ${className} ${isEditing ? 'overflow-visible z-[60]' : 'overflow-hidden'} ${(activeExam?.isPaused && !isUnlinked && !isEditing) ? 'opacity-75 grayscale-[0.35]' : ''}`}
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
    const [selectedSpaceId, setSelectedSpaceId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const isCreateSelected = selectedSpaceId === '__create_new__';
    const customSpaces = spaces.filter(s => !s.isSystem);

    // Check all possible book space ID fields (book_space_id, bookSpaceSupabaseId, bookSpaceId)
    const rawTargetSpaceId = activeExam?.book_space_id || activeExam?.bookSpaceSupabaseId || activeExam?.bookSpaceId || null;

    // Resolve the linked Book Space (strict 1:1)
    const linkedSpace = useMemo(() => {
        if (!activeExam) return null;
        if (rawTargetSpaceId) {
            const strId = String(rawTargetSpaceId);
            const found = spaces.find(s => 
                String(s.id) === strId || 
                String(s.local_id) === strId || 
                String(s.supabaseId) === strId
            );
            if (found) return found;
            return { id: rawTargetSpaceId, name: activeExam.name ? `${activeExam.name} Space` : 'Connected Space', isTemporary: true };
        }
        // Fallback for legacy items
        const fallback = spaces.find(s => !s.isSystem && (s.examDate === activeExam.date || s.isLinkedToExam));
        return fallback || null;
    }, [activeExam, spaces, rawTargetSpaceId]);

    // Exam is only unlinked if it has NO attached space ID AND no legacy space matched by date
    const isUnlinked = Boolean(activeExam && !rawTargetSpaceId && !linkedSpace);

    useEffect(() => {
        if (activeExamId) {
            setTempDate(activeExamDate);
            setTempName(activeExamName);
            setSelectedSpaceId(linkedSpace?.id || rawTargetSpaceId || null);
        } else {
            setTempDate('');
            setTempName('');
            setSelectedSpaceId(null);
        }
    }, [activeExamId, activeExamDate, activeExamName, linkedSpace, rawTargetSpaceId, isEditing]);

    const calculateDaysLeft = () => {
        if (!activeExam?.date) return null;
        const diff = new Date(activeExam.date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft();
    const isPaused = activeExam?.isPaused || isUnlinked;

    // Resolve effective bookSpaceId for Study Wrap
    const effectiveBookSpaceId = useMemo(() => {
        if (rawTargetSpaceId) return rawTargetSpaceId;
        if (linkedSpace?.supabaseId) return linkedSpace.supabaseId;
        if (linkedSpace?.id && linkedSpace.id !== 'active-reading' && linkedSpace.id !== 'favorites') return linkedSpace.id;
        return null;
    }, [rawTargetSpaceId, linkedSpace]);

    // Study Wrap state
    const [showWrap, setShowWrap] = useState(false);

    // Evaluate if there is consistent activity in the linked space
    const hasConsistentActivity = linkedSpace && (
        (linkedSpace.activitySummaries?.timeSpent > 0) || 
        (linkedSpace.activitySummaries?.pagesRead > 0)
    );

    let moodColor = 'bg-emerald-500';
    let moodTextColor = 'text-emerald-600 dark:text-emerald-500';
    let moodBgColor = 'bg-emerald-500/10';
    let moodBorderColor = 'border-emerald-500/20';
    let moodLabel = 'On Track';
    let moodGlow = 'shadow-[inset_0_0_12px_rgba(16,185,129,0.2)]';
    let moodAmbientBg = 'bg-emerald-500/5 group-hover:bg-emerald-500/10';

    if (isPaused || isUnlinked) {
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

    const handleSelectCreateNew = () => {
        setSelectedSpaceId('__create_new__');
    };

    const handleSave = async () => {
        if (!tempDate) {
            showToastGlobal("Please specify an exam deadline date", "error");
            return;
        }
        if (!selectedSpaceId) {
            showToastGlobal("Please select or create a Book Space to link with this exam", "error");
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
                finalSpaceSupabaseId = chosenSpace?.supabaseId || null;
            }

            const isNew = !activeExam;

            if (activeExam?.id === 'legacy') {
                // Convert legacy to a new synced exam
                addExam({ 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false
                });
                setExamDate(null); // Clear legacy
                setExamName('');
            } else if (activeExam?.id) {
                // Update existing
                updateExam(activeExam.id, { 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false, // Auto-unpause once space is linked
                    supabaseId: activeExam.supabaseId
                });
            } else {
                // Create new
                addExam({ 
                    name: tempName, 
                    date: tempDate, 
                    book_space_id: finalSpaceSupabaseId || finalSpaceId,
                    bookSpaceSupabaseId: finalSpaceSupabaseId,
                    bookSpaceId: finalSpaceId,
                    isPaused: false
                });
            }

            // Maintain strict 1:1 space relationship
            useSpaceStore.getState().spaces.filter(s => !s.isSystem).forEach(s => {
                const wasLinkedToThis = (s.id === linkedSpace?.id) || (s.examDate === activeExam?.date);
                const isNowSelected = (s.id === finalSpaceId);

                if (isNowSelected) {
                    updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
                } else if (wasLinkedToThis) {
                    updateSpace(s.id, { isLinkedToExam: false, examDate: null });
                }
            });

            setIsEditing(false);
            if (isNew) {
                showToastGlobal("Your exam reminder is set! Stay focused.", "success");
            } else {
                showToastGlobal("Exam details updated.", "success");
            }
        } catch (err) {
            console.error('Failed to save exam reminder:', err);
            showToastGlobal("Failed to save exam reminder", "error");
        } finally {
            setIsSaving(false);
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

    const handleTogglePause = async (e) => {
        e.stopPropagation();
        if (!activeExam) return;
        if (isUnlinked) {
            showToastGlobal("Link a Book Space to activate this exam countdown", "info");
            setIsEditing(true);
            return;
        }
        if (activeExam.id && activeExam.id !== 'legacy') {
            const success = await togglePauseExam(activeExam.id);
            if (!success) {
                showToastGlobal("Please link a Book Space before resuming", "error");
                setIsEditing(true);
            }
        }
    };

    const handleOpenStudyWrap = (e) => {
        e.stopPropagation();
        if (isUnlinked || !effectiveBookSpaceId) {
            showToastGlobal("Connect a Book Space first to view your Study Wrap", "error");
            setIsEditing(true);
            return;
        }
        setShowWrap(true);
    };

    const renderModal = () => {
        return (
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                showCloseButton={true}
                maxWidth="max-w-lg"
                title={activeExam ? "Exam Settings" : "Set Exam Reminder"}
                message="Connect this exam to a Book Space so we can track your progress and generate your Study Wrap."
                actions={[
                    {
                        label: isSaving ? "Saving..." : (activeExam ? "Save Changes" : "Confirm Exam Date"),
                        variant: "primary",
                        disabled: isSaving || !tempDate || !selectedSpaceId,
                        onClick: handleSave,
                    },
                    {
                        label: "Discard Changes",
                        variant: "ghost",
                        disabled: isSaving,
                        onClick: () => setIsEditing(false),
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

                    {/* Link Study Space (Strict 1:1) */}
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
                        
                        {customSpaces.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No existing book spaces"
                                description="Select the option above to auto-create a space for this exam."
                                className="py-5"
                            />
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                                {customSpaces.map(sp => {
                                    const isSelected = selectedSpaceId === sp.id;
                                    return (
                                        <Card
                                            key={sp.id}
                                            variant="interactive"
                                            onClick={() => setSelectedSpaceId(sp.id)}
                                            className={`p-3 rounded-xl border flex items-center gap-3 transition-colors duration-150 cursor-pointer ${
                                                isSelected 
                                                    ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/10' 
                                                    : 'border-border-default hover:border-accent-primary/30'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-lg flex items-center justify-center transition-colors duration-150 shrink-0 ${
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
                                            <div className={`size-5 rounded-full border flex items-center justify-center transition-colors duration-150 shrink-0 ${
                                                isSelected 
                                                    ? 'border-accent-primary bg-accent-primary text-white' 
                                                    : 'border-border-default'
                                            }`}>
                                                {isSelected && <div className="size-2 bg-white rounded-full" />}
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
                isUnlinked={isUnlinked}
                onAdd={() => {
                    setCurrentIndex(examsList.length); // Points to a 'new' state effectively
                    setTempName('');
                    setTempDate('');
                    setSelectedSpaceId(null);
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
                            <div className="flex justify-between items-center w-full mb-2 relative z-40">
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
                                    <button onClick={handleTogglePause} className="p-2 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-xl transition-all" title={isPaused ? "Resume" : "Pause"}>{isPaused ? <Play size={16} weight="fill" /> : <Pause size={16} weight="fill" />}</button>
                                    <button onClick={handleDeleteCurrent} className="p-2 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all" title="Delete"><Trash size={16} weight="regular"/></button>
                                </div>
                            </div>

                            {/* Middle Row: Content */}
                            <div className={`flex flex-col flex-1 items-center justify-center w-full gap-4 transition-all duration-300 ${isUnlinked ? 'opacity-25 blur-[1px] grayscale' : ''}`}>
                                <div className="flex flex-col items-center justify-center">
                                    <span className={`text-6xl lg:text-7xl font-black tabular-nums tracking-tighter leading-none ${isPaused ? 'text-text-tertiary opacity-40' : 'text-text-primary'}`}>
                                        {daysLeft > 0 ? daysLeft : 0}
                                    </span>
                                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-1">Days Left</span>
                                </div>
                                
                                <div className="flex items-center justify-center flex-wrap text-xs font-bold text-text-tertiary gap-2 px-2">
                                    <p className="flex items-center gap-1.5 shrink-0">
                                        <CalendarBlank size={14} weight="regular" className="text-accent-primary" />
                                        {new Date(activeExam?.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {linkedSpace && (
                                        <>
                                            <span className="mx-1 text-text-tertiary/40 shrink-0">•</span>
                                            <p className="flex items-center gap-1.5 min-w-0 max-w-[170px] sm:max-w-[210px]">
                                                <BookOpen size={14} weight="regular" className="text-accent-primary shrink-0" />
                                                <span className="truncate">Space: {linkedSpace.name}</span>
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
                                            onClick={handleOpenStudyWrap}
                                            className="!py-2.5 !text-xs !font-bold !bg-amber-500 hover:!bg-amber-600 !text-white shadow-lg shadow-amber-500/20"
                                        >
                                            <Sparkle size={16} weight="fill" />
                                            <span>Open Study Wrap</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Overlay when unlinked — centered horizontally and covers countdown, info card above button, does not cover top navbar */}
                            {isUnlinked && (
                                <div className="absolute inset-x-0 bottom-0 top-12 z-30 flex flex-col items-center justify-center p-4 bg-surface-card/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-b-card text-center">
                                    {/* Info card above button */}
                                    <div className="flex flex-col items-center gap-1.5 max-w-[260px] mb-3">
                                        <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner shadow-amber-500/20">
                                            <WarningCircle size={22} weight="bold" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-text-primary tracking-tight">
                                                Link a Book Space
                                            </h4>
                                            <p className="text-[11px] font-medium text-text-secondary mt-0.5 leading-snug">
                                                Countdown is paused until a study space is connected to this exam.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Centered button */}
                                    <Button
                                        variant="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                        className="!py-2 !px-5 !text-xs !font-bold !bg-amber-500 hover:!bg-amber-600 !text-white shadow-lg shadow-amber-500/30 rounded-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Link size={15} weight="bold" />
                                        <span>Link Book Space</span>
                                    </Button>
                                </div>
                            )}
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
