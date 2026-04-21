import React, { useState } from 'react';
import { X, BrainCircuit, AlertCircle, Sparkles, BookOpen, Clock, Target, Layers } from 'lucide-react';

function QuizGenerationModal({ onClose, onGenerate, bookTitle }) {
    const [pageRange, setPageRange] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTime, setQuizTime] = useState('10m');
    const [quizType, setQuizType] = useState('mcq');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [loading, setLoading] = useState(false);

    const handleGenerateClick = async () => {
        setLoading(true);
        // Call the parent's onGenerate handler with the configuration
        await onGenerate({
            pageRange,
            numQuestions,
            quizTime,
            quizType,
            difficulty,
        });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto p-4 sm:p-6">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-bg-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col hide-scrollbar">
                
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bg-elevated/90 backdrop-blur-xl px-8 py-6 border-b border-border-default/50 flex justify-between items-center rounded-t-[2rem]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent-primary/10 text-accent-primary rounded-2xl shadow-inner border border-accent-primary/10">
                            <Sparkles size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black font-display text-text-primary tracking-tight">AI Quiz Generator</h2>
                            {bookTitle && <p className="text-sm font-medium text-text-tertiary">Customizing for: {bookTitle}</p>}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-neutral-100 dark:bg-bg-subtle hover:bg-neutral-200 dark:hover:bg-bg-subtle/80 rounded-full text-text-secondary hover:text-text-primary transition-all active:scale-95"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body settings */}
                <div className="p-8 space-y-8">
                    
                    {/* Target Pages */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={16} className="text-text-tertiary" />
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Target Pages (Optional)</label>
                        </div>
                        <input 
                            type="text" 
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            placeholder="e.g. 1-10, 15, 20-25"
                            className="w-full bg-neutral-50 dark:bg-bg-subtle/50 border-2 border-border-default focus:border-accent-primary/50  rounded-2xl px-5 py-4 text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all font-sans text-lg font-medium"
                        />
                        <p className="text-xs text-text-tertiary font-medium px-2">Leave blank to generate a quiz from the entire document.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Num Questions */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Target size={16} className="text-text-tertiary" />
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Questions Limit</label>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[5, 10, 15, 20].map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => setNumQuestions(n)} 
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${numQuestions === n ? 'border-accent-primary bg-accent-primary text-white shadow-lg shadow-accent-primary/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-accent-primary/30 hover:bg-accent-primary/5'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Time */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={16} className="text-text-tertiary" />
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Time Limit</label>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {['5m', '10m', '15m', 'None'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setQuizTime(t)} 
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${quizTime === t ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-amber-500/30 hover:bg-amber-500/5'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Layers size={16} className="text-text-tertiary" />
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Question Type</label>
                            </div>
                            <div className="flex gap-2">
                                {['mcq', 'essay'].map((t) => (
                                    <button 
                                        key={t} 
                                        onClick={() => setQuizType(t)} 
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${quizType === t ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-blue-500/30 hover:bg-blue-500/5'}`}
                                    >
                                        {t === 'mcq' ? 'Multiple Choice' : 'Short Essay'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <BrainCircuit size={16} className="text-text-tertiary" />
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Difficulty</label>
                            </div>
                            <div className="flex gap-2">
                                {['beginner', 'intermediate', 'advanced'].map(d => (
                                    <button 
                                        key={d} 
                                        onClick={() => setDifficulty(d)} 
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2 capitalize ${difficulty === d ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-purple-500/30 hover:bg-purple-500/5'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Notice */}
                    <div className="flex items-start gap-3 bg-accent-primary/5 border border-accent-primary/10 p-4 rounded-2xl">
                        <AlertCircle size={18} className="text-accent-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-text-secondary leading-relaxed">
                            Generating custom quizzes from specific pages might take a moment. Ensure the selected pages contain text content.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 bg-bg-elevated/90 backdrop-blur-xl p-6 border-t border-border-default/50 rounded-b-[2rem]">
                    <button 
                        onClick={handleGenerateClick}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2
                            ${loading ? 'bg-neutral-200 dark:bg-bg-subtle text-text-tertiary cursor-not-allowed shadow-none' : 'bg-text-primary text-bg-elevated hover:bg-text-secondary hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)]'}
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-bg-elevated/30 border-t-text-tertiary rounded-full animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                <span>Start Extraction</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default QuizGenerationModal;
