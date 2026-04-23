import React, { useState, useEffect } from 'react';
import { Edit2, AlarmClock, Calendar, BookOpen, X, Type, Trash2, Pause, Play, ChevronLeft, ChevronRight, Plus, Link, Sparkles, Trophy, Target, Zap, Bell } from 'lucide-react';
import useStudyStore from '../../store/studyStore';
import useSpaceStore from '../../store/spaceStore';
import { useNavigate } from 'react-router-dom';
import { showToastGlobal } from '../../hooks/useToast';
import examBgPattern from '../../../assets/exam-bg-pattern.png';

const ExamReminder = () => {
    const { exams, examDate, setExamDate, examName, setExamName, addExam, updateExam, deleteExam, togglePauseExam } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const navigate = useNavigate();

    // Combine multi exams array with legacy fallback
    const examsList = (exams && exams.length > 0) ? exams : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []);

    // States
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeExam = examsList[currentIndex] || null;
    const [isEditing, setIsEditing] = useState(false);

    // Form temps
    const [tempDate, setTempDate] = useState('');
    const [tempName, setTempName] = useState('');
    const [selectedSpaceId, setSelectedSpaceId] = useState('');

    const customSpaces = spaces.filter(s => !s.isSystem);
    const linkedSpace = customSpaces.find(s => s.id === selectedSpaceId);

    useEffect(() => {
        if (activeExam) {
            setTempDate(activeExam.date || '');
            setTempName(activeExam.name || '');
            const linked = customSpaces.find(s => s.examDate === activeExam.date) || customSpaces.find(s => s.isLinkedToExam);
            setSelectedSpaceId(linked?.id || '');
        } else {
            setTempDate('');
            setTempName('');
            setSelectedSpaceId('');
        }
    }, [activeExam, isEditing]);

    const calculateDaysLeft = () => {
        if (!activeExam?.date) return null;
        const diff = new Date(activeExam.date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft();
    const isPaused = activeExam?.isPaused;
    const isExamDay = daysLeft !== null && daysLeft <= 0;
    const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

    let moodColor = 'bg-accent-primary';
    let moodTextColor = 'text-accent-primary';
    let moodBgColor = 'bg-accent-primary/10';
    let moodBorderColor = 'border-accent-primary/20';
    let moodLabel = 'On Track';

    if (isPaused) {
        moodColor = 'bg-neutral-500';
        moodTextColor = 'text-neutral-500';
        moodBgColor = 'bg-neutral-500/10';
        moodBorderColor = 'border-neutral-500/20';
        moodLabel = 'Paused';
    } else if (isExamDay) {
        moodLabel = 'Exam Day';
    } else if (isUrgent) {
        moodColor = 'bg-red-500';
        moodTextColor = 'text-red-500';
        moodBgColor = 'bg-red-500/10';
        moodBorderColor = 'border-red-500/20';
        moodLabel = 'Urgent';
    }

    const nextExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s + 1) % examsList.length); };
    const prevExam = (e) => { e.stopPropagation(); setCurrentIndex(s => (s - 1 + examsList.length) % examsList.length); };

    const handleSave = () => {
        if (!tempDate) return;
        
        const isNew = !activeExam;

        if (activeExam?.id === 'legacy') {
            setExamDate(tempDate);
            setExamName(tempName);
        } else if (activeExam?.id) {
            updateExam(activeExam.id, { name: tempName, date: tempDate });
        } else {
            addExam({ name: tempName, date: tempDate });
        }

        customSpaces.forEach(s => {
            if (s.id === selectedSpaceId) {
                updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
            } else if (s.isLinkedToExam) {
                updateSpace(s.id, { isLinkedToExam: false, examDate: null });
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
        if (window.confirm(`Delete reminder for "${activeExam.name || 'this exam'}"?`)) {
            if (activeExam.id === 'legacy') {
                setExamDate(null);
                setExamName('');
            } else {
                deleteExam(activeExam.id);
            }
            setCurrentIndex(0);
            showToastGlobal("Reminder deleted.", "info");
        }
    };

    const CardContainer = ({ children, onClick, className = '', title = '' }) => (
        <div className="w-full relative group/container">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className='text-lg sm:text-xl font-bold text-text-primary tracking-tight'>{title || activeExam?.name || 'Exam Timer'}</h2>
                {examsList.length > 1 && !isEditing && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest bg-bg-subtle px-2 py-0.5 rounded-full border border-border-default">
                            {currentIndex + 1} / {examsList.length}
                        </span>
                    </div>
                )}
            </div>
            <div
                onClick={onClick}
                className={`bg-card-glass backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-10 border-2 border-border-default hover:border-accent-primary/30 transition-all duration-500 group overflow-hidden shadow-xl shadow-black/5 relative min-h-[16rem] flex items-center cursor-pointer ${className} ${(activeExam?.isPaused && !isEditing) ? 'opacity-70 grayscale-[0.3]' : ''}`}
            >
                {/* Background pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: `url(${examBgPattern})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }}
                />
                {children}
            </div>
        </div>
    );

    // ==========================================
    // VIEW 1: No Exam Set
    // ==========================================
    if (!activeExam && !isEditing) {
        return (
            <CardContainer onClick={() => setIsEditing(true)} className="border-dashed hover:bg-accent-primary/5 group" title="Ready to start?">
                <div className="absolute -bottom-10 -left-10 size-60 text-accent-primary/5 rotate-12 group-hover:rotate-6 transition-all duration-1000 pointer-events-none">
                    <AlarmClock size="100%" strokeWidth={1} />
                </div>
                <div className="flex flex-col items-center justify-center w-full relative z-10 text-center gap-6">
                    <div className="size-16 bg-accent-primary/10 rounded-[2rem] flex items-center justify-center text-accent-primary shadow-inner border border-accent-primary/20 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-text-primary tracking-tight mb-2">Set Exam Deadline</h3>
                        <p className="text-sm text-text-tertiary font-medium max-w-[240px]">Track your milestones and get smart reading reminders.</p>
                    </div>
                </div>
            </CardContainer>
        );
    }

    // ==========================================
    // VIEW 2: Dashboard Widget
    // ==========================================
    if (!isEditing) {
        return (
            <CardContainer title={activeExam?.name || 'Upcoming Exam'} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-accent-primary/10 transition-all pointer-events-none" />
                
                {/* Carousel Controls */}
                {examsList.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
                        <button onClick={prevExam} className="pointer-events-auto p-2.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-text-secondary hover:text-accent-primary transition-all active:scale-90"><ChevronLeft size={24}/></button>
                        <button onClick={nextExam} className="pointer-events-auto p-2.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-text-secondary hover:text-accent-primary transition-all active:scale-90"><ChevronRight size={24}/></button>
                    </div>
                )}

                <div className="flex flex-col w-full h-full relative z-10">
                    <div className="flex justify-between items-start w-full mb-auto gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-7xl lg:text-8xl font-black tabular-nums tracking-tighter leading-none ${activeExam?.isPaused ? 'text-text-tertiary opacity-40' : 'text-text-primary'}`}>
                                    {daysLeft > 0 ? daysLeft : 0}
                                </span>
                                <span className="text-xs font-black text-text-tertiary uppercase tracking-widest">Days Left</span>
                            </div>
                            
                            <div className="flex flex-col gap-1.5 mt-4">
                                <p className="text-xs font-bold text-text-tertiary flex items-center gap-2">
                                    <Calendar size={14} className="text-accent-primary" />
                                    {new Date(activeExam?.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                {linkedSpace && (
                                    <p className="text-xs font-bold text-text-tertiary flex items-center gap-2">
                                        <Link size={14} className="text-accent-primary" />
                                        <span>Linked to {linkedSpace.name}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 translate-y-1">
                            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-2 ${moodBgColor} ${moodTextColor} ${moodBorderColor}`}>
                                <div className={`size-1.5 rounded-full ${moodColor} ${!isPaused ? 'animate-pulse' : ''}`} />
                                {moodLabel}
                            </div>

                            <div className="flex gap-2 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-xl rounded-[1.25rem] p-1.5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-2 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-xl transition-all" title="Edit"><Edit2 size={18}/></button>
                                <button onClick={(e) => { e.stopPropagation(); if (activeExam?.id && activeExam.id !== 'legacy') togglePauseExam(activeExam.id); }} className="p-2 hover:bg-accent-primary/10 hover:text-accent-primary text-text-tertiary rounded-xl transition-all" title={activeExam?.isPaused ? "Resume" : "Pause"}>{activeExam?.isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}</button>
                                <button onClick={handleDeleteCurrent} className="p-2 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContainer>
        );
    }

    // ==========================================
    // VIEW 3: Edit View
    // ==========================================
    return (
        <CardContainer title="Update Reminder" className="cursor-default border-accent-primary/20 bg-bg-elevated/80 shadow-2xl">
            <div className="flex flex-col w-full h-full gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Exam Title</label>
                        <div className="flex bg-white dark:bg-zinc-900 border-2 border-border-default rounded-2xl px-5 py-3.5 items-center gap-3 focus-within:border-accent-primary/40 transition-all group">
                            <Type size={18} className="text-text-tertiary group-focus-within:text-accent-primary" />
                            <input type="text" value={tempName} onChange={e=>setTempName(e.target.value)} placeholder="e.g. Finals 2026" className="w-full bg-transparent outline-none text-sm font-bold text-text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Deadline Date</label>
                        <div className="flex bg-white dark:bg-zinc-900 border-2 border-border-default rounded-2xl px-5 py-3.5 items-center gap-3 focus-within:border-accent-primary/40 transition-all group">
                            <Calendar size={18} className="text-text-tertiary group-focus-within:text-accent-primary" />
                            <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-text-primary" />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Study Space Connection</label>
                    <div className="flex bg-white dark:bg-zinc-900 border-2 border-border-default rounded-2xl px-5 py-3.5 items-center gap-3 focus-within:border-accent-primary/40 transition-all group">
                        <BookOpen size={18} className="text-text-tertiary group-focus-within:text-accent-primary" />
                        <select value={selectedSpaceId} onChange={e=>setSelectedSpaceId(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-text-primary appearance-none">
                            <option value="">No linked space</option>
                            {customSpaces.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-border-default">
                    <button onClick={() => setIsEditing(false)} className="px-8 py-3 font-bold text-text-secondary bg-neutral-100 dark:bg-zinc-800 rounded-2xl hover:bg-neutral-200 transition-all active:scale-95">Cancel</button>
                    <button onClick={handleSave} disabled={!tempDate} className="px-10 py-3 font-black text-white bg-accent-primary rounded-2xl disabled:opacity-50 shadow-xl shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.95] transition-all">Save Deadline</button>
                </div>
            </div>
        </CardContainer>
    );
};

export default ExamReminder;
