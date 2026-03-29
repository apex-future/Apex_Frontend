import React, { useState } from 'react';
import { Edit2, Bell, AlarmClock, Calendar, BookOpen } from 'lucide-react';
import useStudyStore from '../../store/studyStore';
import useSpaceStore from '../../store/spaceStore';
import { useNavigate } from 'react-router-dom';

const ExamReminder = () => {
    const { examDate, setExamDate } = useStudyStore();
    const { spaces, updateSpace } = useSpaceStore();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [tempDate, setTempDate] = useState(examDate || '');
    
    const customSpaces = spaces.filter(s => !s.isSystem);
    const linkedSpace = customSpaces.find(s => s.examDate === examDate) || customSpaces.find(s => s.isLinkedToExam); // Fallback logic based on previous states

    const calculateDaysLeft = () => {
        if (!examDate) return null;
        const diff = new Date(examDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysLeft = calculateDaysLeft();

    const [selectedSpaceId, setSelectedSpaceId] = useState(linkedSpace?.id || '');

    const handleSave = () => {
        setExamDate(tempDate);
        // Link to space by setting its examDate or flag
        customSpaces.forEach(s => {
          if (s.id === selectedSpaceId) {
             updateSpace(s.id, { examDate: tempDate, isLinkedToExam: true });
          } else if (s.isLinkedToExam) {
             updateSpace(s.id, { isLinkedToExam: false, examDate: null });
          }
        });
        setIsEditing(false);
    };

    const CardContainer = ({ children, onClick, className = '' }) => (
        <div className="w-full">
            <h2 className='text-lg sm:text-xl px-2 font-semibold text-text-primary mb-4 tracking-tight'>Exam Timer</h2>
            <div 
                onClick={onClick}
                className={`bg-card-glass backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-border-default hover:border-accent-primary/40 hover:shadow-md transition-all duration-500 group overflow-hidden shadow-md relative h-48 xs:h-60 sm:h-64 flex items-center ${className}`}
            >
                {children}
            </div>
        </div>
    );

    if (isEditing) {
        return (
            <CardContainer className="cursor-default flex-col !h-auto min-h-64 items-start relative z-10 transition-all">
                <div className="w-full flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold tracking-tight text-text-primary">Exam Details</h3>
                    <button onClick={() => setIsEditing(false)} className="text-sm text-text-tertiary">Cancel</button>
                </div>
                
                <div className="w-full space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase mb-1">Set Date</label>
                        <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 shadow-inner text-sm items-center gap-3">
                            <Calendar size={18} className="text-accent-primary" />
                            <input 
                                type="date"
                                value={tempDate}
                                onChange={(e) => setTempDate(e.target.value)}
                                className="w-full bg-transparent outline-none text-text-primary font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase mb-1">Link to Space</label>
                        <div className="flex bg-white dark:bg-zinc-900 border border-border-default rounded-xl px-4 py-3 shadow-inner text-sm items-center gap-3">
                            <BookOpen size={18} className="text-accent-primary" />
                            <select 
                                value={selectedSpaceId}
                                onChange={(e) => setSelectedSpaceId(e.target.value)}
                                className="w-full bg-transparent outline-none text-text-primary font-medium appearance-none"
                            >
                                <option value="">Do not link</option>
                                {customSpaces.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSpaceId && (
                        <div 
                           onClick={() => navigate(`/space/${selectedSpaceId}`)}
                           className="mt-4 p-4 border border-accent-primary/20 bg-accent-primary/[0.03] rounded-2xl flex items-center justify-between cursor-pointer hover:bg-accent-primary/[0.08] transition-colors"
                        >
                            <div>
                                <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-1">Linked Space Preview</h4>
                                <p className="text-sm font-bold text-text-primary">{customSpaces.find(s=>s.id === selectedSpaceId)?.name}</p>
                            </div>
                            <div className="text-xs text-text-secondary bg-white dark:bg-zinc-900 px-3 py-1 rounded-full shadow-sm border border-border-default font-semibold">
                                View Space
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full flex justify-end mt-6">
                    <button 
                        onClick={handleSave}
                        disabled={!tempDate}
                        className="px-6 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Details
                    </button>
                </div>
            </CardContainer>
        );
    }

    if (!examDate) {
        return (
            <CardContainer onClick={() => setIsEditing(true)} className="cursor-pointer border-dashed">
                {/* Background Icon Asset */}
                <div className="absolute bottom-2 -left-2 size-44 md:size-52 text-accent-primary/10 rotate-12 group-hover:text-accent-primary/20 group-hover:scale-100 group-hover:rotate-0 transition-all duration-1000 pointer-events-none ease-in-out">
                    <AlarmClock size="100%" strokeWidth={1} />
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-start justify-between lg:justify-center gap-8 w-full relative z-10 text-center sm:text-left">
                    <div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-1 tracking-tight">Track Your Progress</h3>
                        <p className="text-sm sm:text-base md:text-lg text-text-tertiary font-medium">Set your exam date to see your countdown.</p>
                    </div>
                    <div className="px-8 py-3 bg-accent-primary rounded-xl text-sm md:text-base font-bold text-white hover:bg-accent-hover transition-all duration-300 shadow-sm w-full sm:w-auto lg:w-max">
                        Set Date
                    </div>
                </div>
            </CardContainer>
        );
    }

    return (
        <CardContainer className="cursor-default">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent-primary/10 transition-all duration-500" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full relative z-10">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shadow-inner">
                        <Bell size={28} className={daysLeft <= 7 ? 'animate-bounce text-red-500' : 'animate-pulse'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-lg md:text-xl font-bold text-text-primary tracking-tight">Exam Countdown</h3>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-text-tertiary hover:text-accent-primary transition-colors opacity-0 group-hover:opacity-100 duration-300"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        <p className="text-xs md:text-sm text-text-tertiary font-medium italic">
                            The big day is on <span className="text-text-secondary font-bold not-italic">{new Date(examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            {linkedSpace && (
                                <span className="block mt-1">Linked space: <span className="font-bold cursor-pointer text-accent-primary hover:underline hover:text-accent-hover" onClick={(e) => { e.stopPropagation(); navigate(`/space/${linkedSpace.id}`); }}>{linkedSpace.name}</span></span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-black text-accent-primary tabular-nums tracking-tighter">
                            {daysLeft > 0 ? daysLeft : 0}
                        </span>
                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-1">
                            Days Left
                        </span>
                    </div>
                    <div className={`mt-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        daysLeft <= 7 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                        {daysLeft <= 0 ? 'Exam Day!' : daysLeft <= 7 ? 'Critical Focus' : 'Steady Progress'}
                    </div>
                </div>
            </div>
        </CardContainer>
    );
};

export default ExamReminder;

