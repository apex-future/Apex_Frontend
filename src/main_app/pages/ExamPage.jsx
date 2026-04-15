import React, { useState } from 'react';
import { AlarmClock, Plus, ArrowLeft } from 'lucide-react';
import useStudyStore from '../store/studyStore';
import { useNavigate } from 'react-router-dom';

const ExamPage = () => {
    const { exams, examDate, examName, setExamDate, setExamName, addExam } = useStudyStore();
    const navigate = useNavigate();

    // Map legacy single exam if exams array is empty, otherwise use exams array
    const allExams = exams?.length > 0 ? exams : (examDate ? [{ id: 'legacy', name: examName, date: examDate, isPaused: false }] : []);

    return (
        <div className="min-h-screen pt-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-text-primary" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent-primary/10 rounded-2xl text-accent-primary">
                        <AlarmClock size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">Exam Reminders</h1>
                        <p className="text-sm font-semibold text-text-tertiary mt-1">Manage all your upcoming exams in one place</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allExams.map(exam => {
                    const diff = new Date(exam.date) - new Date();
                    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return (
                        <div key={exam.id} className={`bg-card-glass backdrop-blur-xl border-2 ${exam.isPaused ? 'border-border-default opacity-60' : 'border-accent-primary/20'} rounded-3xl p-6 relative`}>
                            <h3 className="text-xl font-bold text-text-primary mb-2">{exam.name || 'Upcoming Exam'}</h3>
                            <p className="text-sm text-text-tertiary mb-6">{new Date(exam.date).toLocaleDateString()}</p>
                            
                            <div className="flex items-end justify-between">
                                <div>
                                    <span className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">Time Left</span>
                                    <span className="text-4xl font-black text-text-primary">{daysLeft > 0 ? daysLeft : 0} <span className="text-sm text-text-tertiary">days</span></span>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${exam.isPaused ? 'bg-neutral-500/10 text-neutral-500' : daysLeft <= 7 ? 'bg-red-500/10 text-red-500' : 'bg-accent-primary/10 text-accent-primary'}`}>
                                    {exam.isPaused ? 'Paused' : daysLeft <= 0 ? 'Exam Day' : daysLeft <= 7 ? 'Urgent' : 'On Track'}
                                </div>
                            </div>
                        </div>
                    )
                })}

                <button 
                    onClick={() => {
                        const name = prompt("Enter Exam Name:");
                        const date = prompt("Enter Exam Date (YYYY-MM-DD):");
                        if (name && date) {
                            addExam({ name, date });
                        }
                    }}
                    className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-border-default hover:border-accent-primary/40 hover:bg-accent-primary/5 rounded-3xl transition-all group"
                >
                    <div className="p-4 bg-black/5 dark:bg-white/5 group-hover:bg-accent-primary/10 text-text-secondary group-hover:text-accent-primary rounded-full transition-colors mb-4">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold text-text-primary">Add New Exam</span>
                    <span className="text-xs text-text-tertiary font-medium mt-1">Track another milestone</span>
                </button>
            </div>
        </div>
    );
};

export default ExamPage;
