import React, { useState } from 'react';
import { Calendar, Edit2, X, Bell, AlarmClock } from 'lucide-react';
import useStudyStore from '../../store/studyStore';

const ExamReminder = () => {
    const { examDate, setExamDate } = useStudyStore();
    const [isEditing, setIsEditing] = useState(false);
    const [tempDate, setTempDate] = useState(examDate || '');

    const calculateDaysLeft = () => {
        if (!examDate) return null;
        const diff = new Date(examDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysLeft = calculateDaysLeft();

    const handleSave = () => {
        setExamDate(tempDate);
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
            <CardContainer className="cursor-default">
                <div className="w-full relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary tracking-tight">Set Exam Date</h3>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="p-2 text-text-tertiary hover:text-text-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="flex-1 bg-bg-subtle border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary transition-all font-medium"
                        />
                        <button
                            onClick={handleSave}
                            className="bg-accent-primary hover:bg-accent-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                        >
                            Save Reminder
                        </button>
                    </div>
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

