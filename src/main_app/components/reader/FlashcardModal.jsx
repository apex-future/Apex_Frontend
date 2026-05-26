import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

function FlashcardModal({ selection, count, onClose, bookId }) {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        // Simulated API Call to Groq for now
        const generateCards = async () => {
            setLoading(true);
            setError(null);
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                // TODO: Replace with actual Groq API call
                // Example format:
                // const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { ... })

                const dummyCards = Array.from({ length: count }, (_, i) => ({
                    id: i,
                    front: `Generated Question ${i + 1} based on: "${selection.substring(0, 30)}..."`,
                    back: `This is the generated answer for question ${i + 1}. You can flip the card to see this.`
                }));

                setCards(dummyCards);
            } catch (err) {
                setError(err.message || 'Failed to generate flashcards. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        generateCards();
    }, [selection, count]);

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-bg-elevated w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[600px] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border-default/50">
                    <div>
                        <h2 className="text-lg font-black text-text-primary tracking-tight">Flashcard Study Session</h2>
                        <p className="text-xs text-text-tertiary font-bold mt-1 uppercase tracking-wider">{count} Cards Generated</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-subtle rounded-xl transition-colors">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-bg-subtle/30 overflow-hidden perspective-1000">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 text-rose-500">
                            <Loader2 size={40} className="animate-spin" />
                            <p className="font-bold text-sm text-text-secondary animate-pulse">Generating cards with Groq AI...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                                <X size={32} />
                            </div>
                            <p className="text-red-600 font-bold max-w-md">{error}</p>
                            <button onClick={onClose} className="px-6 py-3 bg-bg-primary border border-border-default rounded-xl font-bold hover:bg-bg-subtle transition-all mt-4">
                                Close
                            </button>
                        </div>
                    ) : cards.length > 0 ? (
                        <>
                            {/* 3D Flippable Card */}
                            <div
                                className="w-full max-w-md aspect-[4/3] cursor-pointer group"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                                    {/* Front */}
                                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border-default flex flex-col p-8 items-center justify-center text-center hover:shadow-rose-500/20 transition-shadow">
                                        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-50">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Question</span>
                                        </div>
                                        <p className="text-xl md:text-2xl font-bold text-text-primary mt-4">
                                            {cards[currentIndex].front}
                                        </p>
                                        <p className="absolute bottom-6 text-xs text-text-tertiary font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <RefreshCw size={14} /> Tap to flip
                                        </p>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 backface-hidden bg-rose-50 dark:bg-rose-950/20 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900 flex flex-col p-8 items-center justify-center text-center rotate-y-180">
                                        <div className="absolute top-4 left-4 flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Answer</span>
                                        </div>
                                        <p className="text-lg md:text-xl font-medium text-text-secondary leading-relaxed mt-4">
                                            {cards[currentIndex].back}
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between w-full max-w-md mt-10">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="p-3 rounded-full bg-bg-primary border border-border-default hover:bg-bg-subtle disabled:opacity-30 transition-all active:scale-95"
                                >
                                    <ChevronLeft size={24} className="text-text-secondary" />
                                </button>

                                <div className="text-sm font-bold text-text-tertiary font-sans tracking-widest">
                                    <span className="text-text-primary">{currentIndex + 1}</span> / {cards.length}
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === cards.length - 1}
                                    className="p-3 rounded-full bg-bg-primary border border-border-default hover:bg-bg-subtle disabled:opacity-30 transition-all active:scale-95"
                                >
                                    <ChevronRight size={24} className="text-text-secondary" />
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .perspective-1000 { perspective: 1000px; }
            `}} />
        </div>
    );
}

export default FlashcardModal;
