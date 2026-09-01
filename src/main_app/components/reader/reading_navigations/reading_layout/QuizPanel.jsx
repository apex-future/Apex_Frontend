import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Brain, WarningCircle, Sparkle, BookOpen, Clock, Target, Stack, CheckCircle, CaretLeft, CaretRight, CaretUp, CaretDown, ClockCounterClockwise, ArrowLeft, ChartBar, XCircle, Spinner } from '@phosphor-icons/react';
import { Document, Page } from 'react-pdf';
import { initiateMCQQuiz, initiateEssayQuiz, getQuizzesForBook, quizTimeToSeconds } from '../../../../services/quizService';
import { showToastGlobal } from '../../../../hooks/useToast';
import Button from '../../../ui/Button';

/**
 * QuizPanel — config + history panel for AI quiz generation.
 * Mobile: full-screen bottom sheet. Desktop: right side panel (like AIModal).
 */
function QuizPanel({ onClose, bookId, supabaseBookId, bookTitle, fileUrl, isPdf, numPages, userId, onQuizStart, initialSelectedPages = [] }) {
  console.log('[QuizPanel] Mounted — bookId:', bookId, 'userId:', userId, 'initialSelectedPages:', initialSelectedPages);

  const [view, setView] = useState('config'); // 'config' | 'history'
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // ─── Config state (copied from QuizGenerationModal internals) ───
  const [selectedPages, setSelectedPages] = useState(() => (
    initialSelectedPages && initialSelectedPages.length > 0 ? [...new Set(initialSelectedPages)].sort((a, b) => a - b) : []
  ));
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizTime, setQuizTime] = useState('10m');
  const [quizType, setQuizType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [selectedListOpen, setSelectedListOpen] = useState(false);

  // ─── History state ───
  const [quizHistory, setQuizHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Thumbnail lazy-load ───
  const scrollContainerRef = useRef(null);
  const [visiblePages, setVisiblePages] = useState(new Set());

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
      { root: scrollContainerRef.current, rootMargin: '200px', threshold: 0.1 }
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

  // Scroll to first selected page on mount if initialSelectedPages provided
  useEffect(() => {
    if (initialSelectedPages && initialSelectedPages.length > 0 && scrollContainerRef.current) {
      const minPage = Math.min(...initialSelectedPages);
      const timer = setTimeout(() => {
        const targetElement = scrollContainerRef.current?.querySelector(`[data-page="${minPage}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSelectedPages]);

  const togglePageSelection = useCallback((pageNum) => {
    setSelectedPages(prev => prev.includes(pageNum) ? prev.filter(p => p !== pageNum) : [...prev, pageNum]);
  }, []);

  const scrollByChunk = useCallback((direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.8;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }, []);

  // ─── Load history when switching to history view ───
  useEffect(() => {
    if (view !== 'history' || !bookId) return;
    setHistoryLoading(true);
    console.log('[QuizPanel] Loading quiz history for bookId:', bookId);
    getQuizzesForBook(bookId)
      .then(setQuizHistory)
      .catch(err => console.error('[QuizPanel] History load failed:', err))
      .finally(() => setHistoryLoading(false));
  }, [view, bookId]);

  // ─── Generate handler ───
  const handleGenerate = async () => {
    console.log('[QuizPanel] Generate clicked — quizType:', quizType, 'difficulty:', difficulty);
    setGenerating(true);
    setError(null);
    try {
      let result;
      const config = {
        bookId, supabaseBookId, bookTitle, userId,
        selectedPages: [...selectedPages].sort((a, b) => a - b),
        numQuestions, quizTime, difficulty, fileUrl,
      };
      if (quizType === 'mcq') {
        result = await initiateMCQQuiz(config);
      } else {
        result = await initiateEssayQuiz(config);
      }
      console.log('[QuizPanel] Quiz generated — dexieId:', result.dexieId);
      onQuizStart({
        dexieId: result.dexieId,
        questionsPayload: result.questionsPayload,
        quizType: quizType === 'mcq' ? 'multiple_choice' : 'short_essay',
        timeLimitSeconds: quizTimeToSeconds(quizTime),
        difficulty,
      });
      onClose();
    } catch (err) {
      console.error('[QuizPanel] Generation failed:', err);
      const errMsg = err.message || 'Quiz generation failed. Please try again.';
      setError(errMsg);
      showToastGlobal(errMsg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Thumbnail renderer ───
  const renderThumbnail = useCallback((i) => {
    const isSelected = selectedPages.includes(i);
    const isVisible = visiblePages.has(i);
    return (
      <div key={i} data-page={i} className="thumbnail-container flex flex-col items-center flex-shrink-0 w-[90px]" onClick={() => togglePageSelection(i)}>
        <div className={`relative rounded-card overflow-hidden transition-all duration-300 w-[90px] h-[130px] flex items-center justify-center cursor-pointer ${isSelected ? 'shadow-lg scale-105 shadow-accent-primary/20 ring-2 ring-accent-primary' : 'bg-gray-50 hover:bg-gray-100'}`}>
          {isPdf && fileUrl ? (
            isVisible ? (
              <Page pageNumber={i} width={90} renderTextLayer={false} renderAnnotationLayer={false} className="pointer-events-none" loading={null} />
            ) : (
              <div className="w-[90px] h-[130px] bg-gray-200 dark:bg-bg-subtle rounded-card" />
            )
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
        <span className={`text-xs font-bold mt-2 transition-colors ${isSelected ? 'text-accent-primary' : 'text-text-tertiary'}`}>Page {i}</span>
      </div>
    );
  }, [selectedPages, visiblePages, isPdf, fileUrl, togglePageSelection]);

  const thumbnails = useMemo(() => {
    const result = [];
    for (let i = 1; i <= numPages; i++) result.push(renderThumbnail(i));
    return result;
  }, [numPages, renderThumbnail]);

  // ─── Format helpers ───
  const formatTimeTaken = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 bg-black/40 z-[190] md:hidden animate-in fade-in" onClick={onClose} />
      <aside
        className="flex flex-col fixed inset-0 z-[200] bg-bg-primary h-[100dvh] md:relative md:inset-auto md:w-96 md:h-full md:border-0 md:shrink-0 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom md:slide-in-from-right duration-300 font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-4 bg-bg-primary border-b border-border-default/30 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => view === 'history' ? setView('config') : onClose()} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-text-tertiary">
              {view === 'history' ? <ArrowLeft size={18} weight="bold" /> : <X size={18} weight="bold" />}
            </button>
            {view === 'config' && (
              <button onClick={() => setView('history')} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-text-tertiary" title="Quiz History">
                <ClockCounterClockwise size={18} weight="bold" />
              </button>
            )}
          </div>
          <h2 className="text-[11px] flex items-center gap-1.5 font-bold text-text-primary uppercase tracking-[0.2em]">
            {view === 'history' ? 'Quiz History' : 'AI Quiz'}
          </h2>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 relative z-10">
          {generating ? (
            /* ── Loading state during generation ── */
            <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-6">
                <Spinner size={28} weight="bold" className="text-accent-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Generating your quiz...</h3>
              <p className="text-sm text-text-tertiary text-center max-w-[240px]">Cleo is reading the selected pages and crafting questions. This may take a moment.</p>
            </div>
          ) : view === 'config' ? (
            /* ── Config View ── */
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              {/* Target Pages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} weight="bold" className="text-text-tertiary" />
                    <label className="text-sm font-bold text-text-secondary">Select Pages</label>
                  </div>
                  <div className="relative">
                    <button onClick={() => setSelectedListOpen(!selectedListOpen)} disabled={selectedPages.length === 0}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${selectedPages.length > 0 ? 'text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 cursor-pointer shadow-sm' : 'text-text-tertiary bg-white shadow-sm cursor-not-allowed opacity-50'}`}>
                      <span>{selectedPages.length} selected</span>
                      {selectedPages.length > 0 && (selectedListOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />)}
                    </button>
                    {selectedListOpen && selectedPages.length > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-3 bg-white flex justify-between items-center">
                          <span className="text-sm font-bold text-text-secondary">Selected Pages</span>
                          <button onClick={() => { setSelectedPages([]); setSelectedListOpen(false); }} className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Clear All</button>
                        </div>
                        <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                          {[...selectedPages].sort((a,b) => a - b).map(p => (
                            <div key={p} className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 rounded-xl group transition-colors">
                              <span className="text-sm font-semibold text-text-primary">Page {p}</span>
                              <button onClick={(e) => { e.stopPropagation(); togglePageSelection(p); if (selectedPages.length === 1) setSelectedListOpen(false); }} className="text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
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
                  <button onClick={(e) => { e.preventDefault(); scrollByChunk('left'); }} className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white shadow-md rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                    <CaretLeft size={20} weight="bold" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); scrollByChunk('right'); }} className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white shadow-md rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                    <CaretRight size={20} weight="bold" />
                  </button>
                  <div ref={scrollContainerRef} className="flex flex-row gap-4 overflow-x-auto py-4 px-2 scroll-smooth hide-scrollbar">
                    {isPdf && fileUrl ? (
                      <Document file={fileUrl} loading={null}><div className="flex flex-row gap-4">{thumbnails}</div></Document>
                    ) : thumbnails}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 sm:gap-8">
                {/* Num Questions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Target size={16} weight="bold" className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Questions Limit</label></div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(n => (
                      <button key={n} onClick={() => setNumQuestions(n)} className={`py-3 rounded-xl text-sm font-bold transition-all border ${numQuestions === n ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-400/40' : 'bg-transparent border-border-default text-text-secondary hover:bg-accent-primary/5'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                {/* Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Clock size={16} weight="bold" className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Time Limit</label></div>
                  <div className="grid grid-cols-4 gap-2">
                    {['5m', '10m', '15m', 'None'].map(t => (
                      <button key={t} onClick={() => setQuizTime(t)} className={`py-3 rounded-xl text-sm font-bold transition-all border ${quizTime === t ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-400/40' : 'bg-transparent border-border-default text-text-secondary hover:bg-accent-primary/5'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {/* TextT */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Stack size={16} weight="bold" className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Question Type</label></div>
                  <div className="flex gap-2">
                    {['mcq', 'essay'].map((t) => (
                      <button key={t} onClick={() => setQuizType(t)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${quizType === t ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-400/40' : 'bg-transparent border-border-default text-text-secondary hover:bg-accent-primary/5'}`}>{t === 'mcq' ? 'Multiple Choice' : 'Short Essay'}</button>
                    ))}
                  </div>
                </div>
                {/* Difficulty */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Brain size={16} weight="bold" className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Difficulty</label></div>
                  <div className="flex gap-2">
                    {['beginner', 'intermediate', 'advanced'].map(d => (
                      <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all capitalize border ${difficulty === d ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-400/40' : 'bg-transparent border-border-default text-text-secondary hover:bg-accent-primary/5'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-3 bg-accent-primary/5 p-4 rounded-2xl">
                <WarningCircle size={18} weight="bold" className="text-accent-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-text-secondary leading-relaxed">Generating custom quizzes from specific pages might take a moment. Ensure the selected pages contain text content.</p>
              </div>

              {/* Error display */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 p-4 rounded-2xl animate-in fade-in">
                  <XCircle size={18} weight="bold" className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* ── History View ── */
            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
              {historyLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Spinner size={24} weight="bold" className="text-text-tertiary animate-spin" />
                </div>
              ) : quizHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                    <ChartBar size={24} weight="bold" className="text-text-tertiary" />
                  </div>
                  <h3 className="text-sm font-bold text-text-secondary mb-1">No quizzes yet</h3>
                  <p className="text-xs text-text-tertiary max-w-[200px]">Generate a quiz to see your history here.</p>
                </div>
              ) : (
                quizHistory.map((quiz) => (
                  <div key={quiz.id} className="bg-bg-subtle dark:bg-bg-elevated border border-border-default rounded-card p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{formatDate(quiz.taken_at)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${quiz.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                          {quiz.question_type === 'multiple_choice' ? 'MCQ' : 'Essay'}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${quiz.difficulty === 'beginner' ? 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' : quiz.difficulty === 'advanced' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'}`}>
                          {quiz.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {quiz.completed ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={16} weight="fill" className="text-green-500" />
                            <span className="text-lg font-black text-text-primary">{quiz.score_percentage}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <XCircle size={16} weight="bold" className="text-text-tertiary" />
                            <span className="text-sm font-bold text-text-tertiary">Incomplete</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary font-medium">
                        <span className="flex items-center gap-1"><Brain size={12} weight="bold" />{quiz.question_count}q</span>
                        <span className="flex items-center gap-1"><Clock size={12} weight="bold" />{formatTimeTaken(quiz.time_taken_seconds)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Footer — Generate button (config view only) ── */}
        {view === 'config' && !generating && (
          <div className="sticky bottom-0 z-50 bg-bg-primary p-4 border-t border-border-default/30 flex-shrink-0">
            <Button variant="primary" onClick={handleGenerate} disabled={generating} className="py-4 text-base font-black">
              <Sparkle size={20} weight="fill" />
              Generate Quiz
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}

export default QuizPanel;
