import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CaretLeft, CaretRight, CheckCircle, XCircle, Clock, Brain, Warning, Spinner, Trophy, ChartBar } from '@phosphor-icons/react';
import { completeMCQQuiz, completeEssayQuiz } from '../../services/quizService';

/**
 * QuizView — Full-screen quiz-taking experience.
 * Renders as fixed inset-0 z-[300] overlay regardless of device size.
 */
function QuizView({ quizSession, bookId, supabaseBookId, userId, onClose }) {
  const { dexieId, questionsPayload, quizType, timeLimitSeconds, difficulty } = quizSession;
  console.log('[QuizView] Mounted — dexieId:', dexieId, 'quizType:', quizType, 'questions:', questionsPayload.length);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('taking'); // 'taking' | 'submitting' | 'results'
  const [timeRemaining, setTimeRemaining] = useState(timeLimitSeconds || null);
  const [startTime] = useState(() => new Date());
  const [finalResult, setFinalResult] = useState(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  const timerRef = useRef(null);
  const isMCQ = quizType === 'multiple_choice';
  const totalQuestions = questionsPayload.length;
  const currentQuestion = questionsPayload[currentQuestionIndex];

  // ─── Timer ───
  useEffect(() => {
    if (!timeLimitSeconds || phase !== 'taking') return;
    console.log('[QuizView] Timer started — limit:', timeLimitSeconds, 's');
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          console.log('[QuizView] Timer expired — auto-submitting');
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLimitSeconds, phase]);

  const formatTime = (seconds) => {
    if (seconds == null) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ─── Answer handlers ───
  const setAnswer = useCallback((questionId, value) => {
    console.log('[QuizView] Answer set — q:', questionId, 'val:', typeof value === 'string' ? value.substring(0, 30) : value);
    setAnswers(prev => {
      // For MCQ, toggling the same answer deselects it
      if (isMCQ && prev[questionId] === value) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: value };
    });
  }, [isMCQ]);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // ─── Navigation ───
  const goNext = () => setCurrentQuestionIndex(prev => Math.min(prev + 1, totalQuestions - 1));
  const goPrev = () => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));

  // ─── Submit ───
  const handleSubmit = async () => {
    console.log('[QuizView] Submitting quiz — phase: submitting');
    clearInterval(timerRef.current);
    setPhase('submitting');
    const timeTaken = Math.round((Date.now() - startTime.getTime()) / 1000);

    try {
      const filledPayload = questionsPayload.map(q => ({
        ...q,
        user_answer: answers[q.id] || (isMCQ ? null : ''),
      }));

      let result;
      if (isMCQ) {
        result = await completeMCQQuiz({ dexieId, questionsPayload: filledPayload, timeTakenSeconds: timeTaken, userId, supabaseBookId });
      } else {
        result = await completeEssayQuiz({ dexieId, questionsPayload: filledPayload, timeTakenSeconds: timeTaken, userId, supabaseBookId });
      }
      console.log('[QuizView] Quiz completed — result:', result);
      setFinalResult({ ...result, filledPayload });
      setPhase('results');
    } catch (err) {
      console.error('[QuizView] Submit failed:', err);
      setPhase('taking'); // Allow retry
    }
  };

  // ─── Abandon dialog ───
  const handleAbandon = () => {
    console.log('[QuizView] Quiz abandoned');
    clearInterval(timerRef.current);
    onClose();
  };

  // ─── TAKING PHASE ───
  if (phase === 'taking') {
    return (
      <div className="fixed inset-0 z-[300] bg-white text-text-primary font-sans flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm flex-shrink-0 z-10">
          <button onClick={() => setShowAbandonDialog(true)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-text-tertiary">
            <X size={20} weight="bold" />
          </button>
          <div className="flex items-center gap-3 text-center">
            <span className="text-xs font-bold text-text-secondary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {timeRemaining != null && (
              <span className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${timeRemaining <= 60 ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 animate-pulse' : 'bg-white shadow-sm text-text-secondary'}`}>
                <Clock size={12} weight="bold" />
                {formatTime(timeRemaining)}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${difficulty === 'beginner' ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' : difficulty === 'advanced' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'}`}>
            {difficulty}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-50 shadow-inner flex-shrink-0">
          <div className="h-full bg-accent-primary transition-all duration-500 ease-out" style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Question text */}
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-primary mb-3 block">Question {currentQuestion.id}</span>
              <h2 className="text-xl font-bold text-text-primary leading-relaxed font-display">{currentQuestion.question}</h2>
            </div>

            {/* MCQ options */}
            {isMCQ ? (
              <div className="flex flex-col gap-3">
                {Object.entries(currentQuestion.options).map(([letter, text]) => {
                  const isSelected = answers[currentQuestion.id] === letter;
                  return (
                    <button key={letter} onClick={() => setAnswer(currentQuestion.id, letter)}
                      className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 flex items-start gap-4 group ${isSelected ? 'ring-2 ring-accent-primary bg-accent-primary/5 shadow-lg shadow-accent-primary/10' : 'bg-white shadow-sm hover:shadow-md'}`}>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${isSelected ? 'bg-accent-primary text-white' : 'bg-gray-50 text-text-tertiary group-hover:bg-accent-primary/10 group-hover:text-accent-primary'}`}>
                        {letter}
                      </span>
                      <span className={`text-sm font-medium leading-relaxed pt-1 ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Essay textarea */
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder="Write your answer here..."
                className="w-full min-h-[200px] bg-white shadow-inner rounded-2xl p-5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:shadow-lg focus:shadow-accent-primary/10 transition-all resize-y leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-4 py-4 bg-white shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10 flex-shrink-0">
          <button onClick={goPrev} disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <CaretLeft size={16} weight="bold" /> Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <div className="flex flex-col items-end gap-1">
              <button onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black bg-accent-primary text-white shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/90 transition-all active:scale-95">
                Submit Quiz
              </button>
              {unansweredCount > 0 && (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  <Warning size={10} weight="fill" /> {unansweredCount} unanswered
                </span>
              )}
            </div>
          ) : (
            <button onClick={goNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all">
              Next <CaretRight size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Abandon confirmation dialog */}
        {showAbandonDialog && (
          <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                  <Warning size={20} weight="fill" className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary font-display">Leave Quiz?</h3>
              </div>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">Are you sure? Your progress will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAbandonDialog(false)} className="flex-1 py-3 rounded-xl bg-white shadow-sm text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all">Stay</button>
                <button onClick={handleAbandon} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── SUBMITTING PHASE ───
  if (phase === 'submitting') {
    return (
      <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center font-sans">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-6">
            <Spinner size={36} weight="bold" className="text-accent-primary animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2 font-display">
            {isMCQ ? 'Calculating score...' : 'Grading your answers...'}
          </h2>
          <p className="text-sm text-text-tertiary">This will only take a moment.</p>
        </div>
      </div>
    );
  }

  // ─── RESULTS PHASE ───
  if (phase === 'results' && finalResult) {
    const { score_percentage, correct, total, filledPayload } = finalResult;
    const scoredPayload = filledPayload || questionsPayload;

    return (
      <div className="fixed inset-0 z-[300] bg-white text-text-primary font-sans flex flex-col overflow-hidden">
        {/* Results header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-10 flex-shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Quiz Results</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Score hero */}
          <div className="flex flex-col items-center py-10 px-6 bg-white shadow-sm">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${score_percentage >= 70 ? 'bg-green-100 dark:bg-green-500/15' : score_percentage >= 40 ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-red-100 dark:bg-red-500/15'}`}>
              <Trophy size={40} weight="fill" className={`${score_percentage >= 70 ? 'text-green-500' : score_percentage >= 40 ? 'text-amber-500' : 'text-red-500'}`} />
            </div>
            <h1 className="text-5xl font-black text-text-primary mb-2 font-display">{score_percentage}%</h1>
            {isMCQ && correct != null && (
              <p className="text-sm font-bold text-text-secondary">{correct} out of {total} correct</p>
            )}
            {!isMCQ && (
              <p className="text-sm font-bold text-text-secondary">Average score across {total} questions</p>
            )}
            <div className="flex items-center gap-4 mt-4">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isMCQ ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                {isMCQ ? 'MCQ' : 'Essay'}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${difficulty === 'beginner' ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' : difficulty === 'advanced' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'}`}>
                {difficulty}
              </span>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="p-6 max-w-7xl mx-auto w-full">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-6">Question Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {scoredPayload.map((q, idx) => {
              const userAns = q.user_answer;
              const isCorrect = isMCQ ? userAns === q.correct_answer : false;
              const essayScore = q.score;

              return (
                <div key={q.id} className="bg-white rounded-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-wider flex-shrink-0">Q{q.id}</span>
                    {isMCQ ? (
                      isCorrect ? <CheckCircle size={18} weight="fill" className="text-green-500 flex-shrink-0" /> : <XCircle size={18} weight="fill" className="text-red-500 flex-shrink-0" />
                    ) : (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${essayScore >= 70 ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' : essayScore >= 40 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'}`}>
                        {essayScore}/100
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-text-primary leading-relaxed">{q.question}</p>

                  {isMCQ ? (
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-start gap-2 px-3 py-2 rounded-xl ${isCorrect ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                        <span className="font-bold flex-shrink-0">{isCorrect ? '✓' : '✗'} Your answer:</span>
                        <span className={`${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-medium`}>
                          {userAns ? `${userAns}. ${q.options[userAns]}` : 'No answer'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-500/10">
                          <span className="font-bold flex-shrink-0 text-green-600 dark:text-green-400">✓ Correct:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{q.correct_answer}. {q.options[q.correct_answer]}</span>
                        </div>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-text-tertiary mt-2 pl-3 border-l-2 border-gray-100 leading-relaxed">{q.explanation}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="px-3 py-2 rounded-xl bg-gray-50">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block mb-1">Your Answer</span>
                        <p className="text-text-primary font-medium leading-relaxed">{userAns || 'No answer provided'}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-green-50 dark:bg-green-500/10">
                        <span className="text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 block mb-1">Model Answer</span>
                        <p className="text-green-700 dark:text-green-300 font-medium leading-relaxed">{q.model_answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Bottom close button */}
          <div className="p-6 max-w-2xl mx-auto">
            <button onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-all shadow-xl shadow-accent-primary/20 active:scale-[0.98]">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default QuizView;
