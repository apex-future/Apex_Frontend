import React, { useState } from 'react';
import { Calendar, Edit2, X, Bell, GraduationCap } from 'lucide-react';
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

    if (isEditing) {
        return (
            <div className="w-full">
                <div className="bg-card-glass backdrop-blur-xl rounded-3xl p-7 md:p-10 border-2 border-accent-primary/30 shadow-lg animate-in fade-in zoom-in duration-300 min-h-[180px] flex flex-col justify-center gap-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-accent-primary" size={20} />
                            <h3 className="text-lg font-bold text-text-primary">Set Exam Date</h3>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="text-text-tertiary hover:text-text-primary">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="flex-1 bg-bg-subtle border border-border-default rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary transition-all"
                        />
                        <button
                            onClick={handleSave}
                            className="w-full sm:w-auto bg-accent-primary hover:bg-accent-hover text-white px-6 py-2 rounded-xl font-bold transition-all"
                        >
                            Save Reminder
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!examDate) {
        return (
            <div className="w-full">
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-full group bg-card-glass backdrop-blur-xl rounded-3xl p-7 md:p-10 border-2 border-dashed border-border-default hover:border-accent-primary/50 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 min-h-[180px]"
                >
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                            <GraduationCap size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-text-primary">Track your exam</h3>
                            <p className="text-sm text-text-tertiary">Set your exam date to see a countdown here.</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto px-4 py-3 bg-bg-subtle rounded-xl text-sm font-bold text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all text-center">
                        Set Date
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative overflow-hidden bg-card-glass backdrop-blur-xl rounded-2xl md:rounded-3xl p-7 md:p-12 border-2 border-border-default hover:border-text-tertiary transition-all duration-500 group shadow-md min-h-[180px] flex items-center">
                {/* Background Decoration */}
                <div className="absolute -right-4 -top-4 size-32 bg-accent-primary/5 rounded-full blur-3xl group-hover:bg-accent-primary/10 transition-all" />
                
                <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shadow-inner">
                            <Bell size={36} className="animate-bounce-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-text-primary tracking-tight">Exam Countdown</h3>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 text-text-tertiary hover:text-accent-primary transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            <p className="text-sm text-text-tertiary font-medium">
                                Exam on <span className="text-text-primary">{new Date(examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center sm:text-right">
                            <div className="text-4xl sm:text-5xl font-black text-accent-primary leading-none tracking-tighter">
                                {daysLeft > 0 ? daysLeft : 0}
                            </div>
                            <div className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
                                Days to go
                            </div>
                        </div>
                        
                        {/* Progress Bar or Radial could go here, but keeping it sleek */}
                        <div className="h-12 w-[1px] bg-border-default hidden sm:block" />
                        
                        <div className="hidden sm:block">
                            <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${daysLeft <= 7 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-green-500/10 text-green-500'}`}>
                                {daysLeft <= 7 ? 'Critical' : 'On Track'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamReminder;
