import React, { useState } from 'react';
import { Target, Timer, Trophy, CheckCircle2, ChevronRight, BookOpen, Clock, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import useQuizStore from '../../../store/quizStore';
import useSpaceStore from '../../../store/spaceStore';
import QuizGenerationModal from '../../reader/reading_navigations/reading_layout/QuizGenerationModal';

function DocumentQuizzes({ book }) {
    const { quizHistory, addQuizAttempt } = useQuizStore();
    const { activeSpaceId } = useSpaceStore();
    
    const [viewState, setViewState] = useState('list'); // list | loading | taking | result
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTime, setQuizTime] = useState('10m');
    const [quizType, setQuizType] = useState('mcq');
    const [difficulty, setDifficulty] = useState('intermediate');
    
    // Quiz state
    const [startTime, setStartTime] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);

    // Filter attempts for this book
    const attempts = quizHistory.filter(q => String(q.bookId) === String(book.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const [activeQuiz, setActiveQuiz] = useState([]);

    const handleStartGeneration = async (config) => {
        // Save config
        setNumQuestions(config.numQuestions);
        setQuizTime(config.quizTime);
        setQuizType(config.quizType);
        setDifficulty(config.difficulty);

        setIsSetupModalOpen(false);
        setViewState('loading');
        
        // MOCK DATA for generated quiz based on config
        const newMockQuestions = Array.from({ length: config.numQuestions }, (_, i) => {
            if (config.quizType === 'essay') {
                return {
                    id: i,
                    question: `Sample ${config.difficulty} AI essay prompt ${i + 1} from "${book.title}". Please explain your reasoning in detail.`,
                    type: 'essay'
                };
            } else {
                return {
                    id: i,
                    question: `Sample ${config.difficulty} AI knowledge check ${i + 1} from "${book.title}"?`,
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: Math.floor(Math.random() * 4),
                    type: 'mcq'
                };
            }
        });

        // Fake generation delay
        setTimeout(() => {
            setActiveQuiz(newMockQuestions);
            setStartTime(Date.now());
            setCurrentQuestionIdx(0);
            setSelectedAnswers({});
            setViewState('taking');
        }, 2500);
    };

    const handleSelectOption = (optIndex) => {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIndex }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < activeQuiz.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        }
    };

    const handleSubmitQuiz = () => {
        // Calculate score
        let correctCount = 0;
        activeQuiz.forEach((q, idx) => {
            if (q.type === 'mcq') {
                if (selectedAnswers[idx] === q.correctAnswer) correctCount++;
            } else {
                // Mock essay grading: full credit if they typed something meaningful
                const answerLength = (selectedAnswers[idx] || '').trim().length;
                if (answerLength > 10) correctCount++;
            }
        });
        
        const scorePercentage = Math.round((correctCount / activeQuiz.length) * 100);
        const timeTakenSeconds = Math.round((Date.now() - startTime) / 1000);

        const resultObj = {
            numQuestions: activeQuiz.length,
            score: scorePercentage,
            timeTaken: timeTakenSeconds,
            bookId: book.id,
            spaceId: activeSpaceId || null
        };

        addQuizAttempt(resultObj);
        setQuizResult(resultObj);
        setViewState('result');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    // ===================================
    // VIEWS
    // ===================================

    if (viewState === 'loading') {
        return (
            <div className="p-12 border border-border-default rounded-3xl flex flex-col items-center justify-center text-center">
                <Loader2 size={48} className="text-accent-primary animate-spin mb-6" />
                <h3 className="text-xl font-bold text-text-primary mb-2 animate-pulse">Analyzing Book Content</h3>
                <p className="text-text-tertiary">Generating personalized questions...</p>
            </div>
        );
    }

    if (viewState === 'taking') {
        const q = activeQuiz[currentQuestionIdx];
        const isAnswered = q.type === 'essay' 
             ? (selectedAnswers[currentQuestionIdx] || '').trim().length > 0
             : selectedAnswers[currentQuestionIdx] !== undefined;

        return (
            <div className="w-full bg-white dark:bg-zinc-900 border border-border-default rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border-default bg-neutral-50 dark:bg-zinc-800/50 flex justify-between items-center">
                    <span className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Question {currentQuestionIdx + 1} of {activeQuiz.length}</span>
                    <div className="flex items-center gap-2 text-accent-primary font-bold bg-accent-primary/10 px-3 py-1 rounded-full text-sm">
                        <Timer size={16} /> <span className="uppercase text-[10px] tracking-wider">In Progress</span>
                    </div>
                </div>
                
                <div className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-text-primary leading-tight mb-8">
                        {q.question}
                    </h3>
                    
                    {q.type === 'essay' ? (
                        <textarea 
                            className="w-full bg-neutral-50 dark:bg-zinc-800 border-2 border-border-default rounded-2xl p-4 min-h-40 font-medium text-text-primary focus:border-accent-primary focus:ring-0 outline-none transition-all"
                            placeholder="Type your detailed answer here..."
                            value={selectedAnswers[currentQuestionIdx] || ''}
                            onChange={(e) => handleSelectOption(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-3">
                            {q.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium ${
                                        selectedAnswers[currentQuestionIdx] === idx 
                                            ? 'border-accent-primary bg-accent-primary/5 text-accent-pressed' 
                                            : 'border-border-default text-text-secondary hover:border-accent-primary/30 hover:bg-neutral-50 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            selectedAnswers[currentQuestionIdx] === idx ? 'border-accent-primary' : 'border-text-placeholder'
                                        }`}>
                                            {selectedAnswers[currentQuestionIdx] === idx && <div className="w-3 h-3 rounded-full bg-accent-primary" />}
                                        </div>
                                        {opt}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        {currentQuestionIdx < activeQuiz.length - 1 ? (
                            <button 
                                onClick={handleNextQuestion} 
                                disabled={!isAnswered}
                                className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                Next Question <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmitQuiz} 
                                disabled={!isAnswered}
                                className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold shadow-lg shadow-accent-primary/20 disabled:opacity-50 hover:bg-accent-hover transition-all"
                            >
                                Finish Quiz
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'result') {
        return (
            <div className="p-8 md:p-12 border border-border-default bg-white dark:bg-zinc-900 rounded-3xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy size={40} />
                </div>
                <h2 className="text-3xl font-black text-text-primary tracking-tight mb-2">Quiz Completed!</h2>
                <p className="text-text-tertiary font-medium mb-8">Great job finishing the review for {book.title}.</p>
                
                <div className="flex gap-8 justify-center mb-10 w-full max-w-sm">
                    <div className="flex-1 p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl border border-border-default">
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-2">Score</span>
                        <span className={`text-4xl font-black ${quizResult.score >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {quizResult.score}%
                        </span>
                    </div>
                    <div className="flex-1 p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl border border-border-default">
                        <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-2">Time Taken</span>
                        <span className="text-4xl font-black text-text-primary">
                            {formatTime(quizResult.timeTaken)}
                        </span>
                    </div>
                </div>

                <div className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-6 py-4 rounded-2xl text-sm font-semibold max-w-md flex gap-3 mb-8 text-left">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span>In version 2, individual question review is not yet supported. Your score has been saved to your Analytics.</span>
                </div>

                <button onClick={() => setViewState('list')} className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Return to Quizzes
                </button>
            </div>
        );
    }

    // Default view: list
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-accent-primary/5 p-6 rounded-3xl border border-accent-primary/10">
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">Knowledge Checks</h3>
                    <p className="text-sm text-text-tertiary">Generate custom AI quizzes to test your comprehension.</p>
                </div>
                <button 
                    onClick={() => setIsSetupModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-accent-primary text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                >
                    <Sparkles size={18} /> Generate Quiz
                </button>
            </div>

            <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-widest px-2">Past Attempts</h4>
            
            {attempts.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-border-default rounded-3xl">
                    <Target size={48} className="mx-auto text-text-placeholder mb-4" />
                    <p className="text-text-secondary font-medium">No quizzes taken yet for this book.</p>
                    <p className="text-sm text-text-tertiary mt-1">Tap generate to start your first review session.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attempts.map((attempt) => (
                        <div key={attempt.id} className="p-5 bg-white dark:bg-zinc-900 border border-border-default rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${attempt.score >= 50 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                    {attempt.score}%
                                </div>
                                <span className="text-xs font-semibold text-text-tertiary">
                                    {new Date(attempt.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary mb-1">{attempt.numQuestions} Questions</h4>
                                <div className="flex items-center gap-2 text-xs text-text-tertiary font-medium">
                                    <Clock size={12} /> {formatTime(attempt.timeTaken)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POP-UP SETUP MODAL */}
            {isSetupModalOpen && (
                <QuizGenerationModal
                    onClose={() => setIsSetupModalOpen(false)}
                    onGenerate={handleStartGeneration}
                    bookTitle={book.title}
                />
            )}
        </div>
    );
}

export default DocumentQuizzes;
