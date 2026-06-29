import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Brain, WarningCircle, Sparkle, BookOpen, Clock, Target, Stack, CheckCircle, CaretLeft, CaretRight, CaretUp, CaretDown } from '@phosphor-icons/react';
import { Document, Page } from 'react-pdf';

function QuizGenerationModal({ onClose, onGenerate, bookTitle, fileUrl, isPdf, numPages }) {
    const [selectedPages, setSelectedPages] = useState([]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTime, setQuizTime] = useState('10m');
    const [quizType, setQuizType] = useState('mcq');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [loading, setLoading] = useState(false);
    const [selectedListOpen, setSelectedListOpen] = useState(false);

    const scrollContainerRef = useRef(null);
    const [visiblePages, setVisiblePages] = useState(new Set());

    // Intersection Observer for lazy rendering
    useEffect(() => {
        if (!numPages) return;
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.getAttribute('data-page'), 10);
                        setVisiblePages((prev) => {
                            if (prev.has(pageNum)) return prev;
                            const next = new Set(prev);
                            next.add(pageNum);
                            return next;
                        });
                    }
                });
            },
            {
                root: scrollContainerRef.current,
                rootMargin: '200px', // Pre-load ahead
                threshold: 0.1
            }
        );

        const currentContainer = scrollContainerRef.current;
        if (currentContainer) {
            const items = currentContainer.querySelectorAll('.thumbnail-container');
            items.forEach((item) => observer.observe(item));
        }

        return () => {
            if (currentContainer) {
                const items = currentContainer.querySelectorAll('.thumbnail-container');
                items.forEach((item) => observer.unobserve(item));
            }
        };
    }, [numPages]);

    const togglePageSelection = useCallback((pageNum) => {
        setSelectedPages(prev => {
            if (prev.includes(pageNum)) {
                return prev.filter(p => p !== pageNum);
            } else {
                return [...prev, pageNum];
            }
        });
    }, []);

    const scrollByChunk = useCallback((direction) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.offsetWidth * 0.8;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }, []);

    const renderThumbnail = useCallback((i) => {
        const isSelected = selectedPages.includes(i);
        const isVisible = visiblePages.has(i);

        return (
            <div
                key={i}
                data-page={i}
                className="thumbnail-container flex flex-col items-center flex-shrink-0 w-[90px]"
                onClick={() => togglePageSelection(i)}
            >
                <div 
                    className={`relative rounded-card overflow-hidden border-2 transition-all duration-300 w-[90px] h-[130px] flex items-center justify-center cursor-pointer ${
                        isSelected ? 'border-accent-primary shadow-lg shadow-accent-primary/20 scale-105' : 'border-border-default/50 hover:border-border-default bg-bg-subtle/50'
                    }`}
                >
                    {isPdf && fileUrl ? (
                        <>
                            {isVisible ? (
                                <Page 
                                    pageNumber={i} 
                                    width={90} 
                                    renderTextLayer={false} 
                                    renderAnnotationLayer={false}
                                    className="pointer-events-none"
                                    loading={null}
                                />
                            ) : (
                                <div className="w-[90px] h-[130px] bg-gray-200 dark:bg-bg-subtle rounded-card" />
                            )}
                        </>
                    ) : (
                        <div className="w-[90px] h-[130px] bg-bg-subtle rounded-card flex items-center justify-center">
                            <span className="text-xl font-black text-text-tertiary">{i}</span>
                        </div>
                    )}
                    
                    {isSelected && (
                        <div className="absolute top-2 right-2 bg-accent-primary text-white rounded-full">
                            <CheckCircle size={18} weight="fill" />
                        </div>
                    )}
                </div>
                <span className={`text-xs font-bold mt-2 transition-colors ${
                    isSelected ? 'text-accent-primary' : 'text-text-tertiary'
                }`}>
                    Page {i}
                </span>
            </div>
        );
    }, [selectedPages, visiblePages, isPdf, fileUrl, togglePageSelection]);

    const thumbnails = useMemo(() => {
        const result = [];
        for (let i = 1; i <= numPages; i++) {
            result.push(renderThumbnail(i));
        }
        return result;
    }, [numPages, renderThumbnail]);

    const handleGenerateClick = async () => {
        setLoading(true);
        await onGenerate({
            selectedPages: [...selectedPages].sort((a, b) => a - b), // raw array, sorted
            numQuestions,
            quizTime,
            quizType,
            difficulty,
        });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto p-0 sm:p-6">
            {/* Overlay */}
            <div 
                className="absolute inset-0 hidden sm:block bg-black/60 backdrop-blur-md transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-bg-elevated w-full h-[100dvh] sm:h-auto max-w-2xl sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-[2rem] shadow-none sm:shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 pointer-events-auto flex flex-col hide-scrollbar font-sans">
                
                {/* Header */}
                <div className="sticky top-0 z-50 bg-bg-elevated/90 backdrop-blur-xl flex items-center justify-between px-5 py-5 border-b border-border-default/50 shrink-0 rounded-none sm:rounded-t-[2rem]">
                    <div className="flex items-center gap-2">
                        <Sparkle size={18} weight="fill" className="text-accent-primary animate-pulse" />
                        <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase">AI Quiz Generator</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {/* Body settings */}
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                    
                    {/* Target Pages */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} weight="bold" className="text-text-tertiary" />
                                <label className="text-sm font-bold text-text-secondary">Select Pages</label>
                            </div>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setSelectedListOpen(!selectedListOpen)}
                                    disabled={selectedPages.length === 0}
                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                        selectedPages.length > 0 
                                        ? 'text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 cursor-pointer shadow-sm border border-accent-primary/20' 
                                        : 'text-text-tertiary bg-bg-subtle cursor-not-allowed opacity-50 border border-transparent'
                                    }`}
                                >
                                    <span>{selectedPages.length} selected</span>
                                    {selectedPages.length > 0 && (
                                        selectedListOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />
                                    )}
                                </button>

                                {/* Dropdown Popover */}
                                {selectedListOpen && selectedPages.length > 0 && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-bg-elevated border border-border-default rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                        <div className="p-3 bg-bg-subtle/50 border-b border-border-default flex justify-between items-center">
                                            <span className="text-sm font-bold text-text-secondary">Selected Pages</span>
                                            <button 
                                                onClick={() => {
                                                    setSelectedPages([]);
                                                    setSelectedListOpen(false);
                                                }}
                                                className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                                            {[...selectedPages].sort((a,b) => a - b).map(p => (
                                                <div key={p} className="flex justify-between items-center px-3 py-2 hover:bg-bg-subtle rounded-xl group transition-colors">
                                                    <span className="text-sm font-semibold text-text-primary">Page {p}</span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePageSelection(p);
                                                            if (selectedPages.length === 1) setSelectedListOpen(false);
                                                        }}
                                                        className="text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    >
                                                        <X size={14} weight="bold" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="relative group">
                            <button 
                                onClick={(e) => { e.preventDefault(); scrollByChunk('left'); }}
                                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-bg-elevated/90 shadow-md border border-border-default rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <CaretLeft size={20} weight="bold" />
                            </button>
                            
                            <button 
                                onClick={(e) => { e.preventDefault(); scrollByChunk('right'); }}
                                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-bg-elevated/90 shadow-md border border-border-default rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <CaretRight size={20} weight="bold" />
                            </button>

                            <div 
                                ref={scrollContainerRef}
                                className="flex flex-row gap-4 overflow-x-auto py-4 px-2 scroll-smooth hide-scrollbar border-2 border-border-default rounded-card bg-neutral-50 dark:bg-bg-subtle/20"
                            >
                                {isPdf && fileUrl ? (
                                    <Document file={fileUrl} loading={null}>
                                        <div className="flex flex-row gap-4">
                                            {thumbnails}
                                        </div>
                                    </Document>
                                ) : (
                                    thumbnails
                                )}
                            </div>
                        </div>
                        {/* <p className="text-xs text-text-tertiary font-medium px-2">Leave unselected to generate a quiz from the entire document.</p> */}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Num Questions */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Target size={16} weight="bold" className="text-text-tertiary" />
                                <label className="text-sm font-bold text-text-secondary">Questions Limit</label>
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
                                <Clock size={16} weight="bold" className="text-text-tertiary" />
                                <label className="text-sm font-bold text-text-secondary">Time Limit</label>
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

                        {/* TextT */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Stack size={16} weight="bold" className="text-text-tertiary" />
                                <label className="text-sm font-bold text-text-secondary">Question Type</label>
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
                                <Brain size={16} weight="bold" className="text-text-tertiary" />
                                <label className="text-sm font-bold text-text-secondary">Difficulty</label>
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
                        <WarningCircle size={18} weight="bold" className="text-accent-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-text-secondary leading-relaxed">
                            Generating custom quizzes from specific pages might take a moment. Ensure the selected pages contain text content.
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-50 bg-bg-elevated/90 backdrop-blur-xl p-4 sm:p-6 border-t border-border-default/50 rounded-none sm:rounded-b-[2rem]">
                    <button 
                        onClick={handleGenerateClick}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2
                            ${loading ? 'bg-neutral-200 dark:bg-bg-subtle text-text-tertiary cursor-not-allowed shadow-none' : 'bg-accent-primary text-white hover:bg-accent-primary/90 hover:shadow-[0_10px_40px_rgba(139,92,246,0.3)]'}
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-bg-elevated/30 border-t-text-tertiary rounded-full animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkle size={20} weight="fill" />
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
