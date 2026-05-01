import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, BrainCircuit, AlertCircle, Sparkles, BookOpen, Clock, Target, Layers, CheckCircle2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, History, ArrowLeft, BarChart2, XCircle, Brain, Loader2 } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import { initiateMCQQuiz, initiateEssayQuiz, getQuizzesForBook, quizTimeToSeconds } from '../../../../services/quizService';

/**
 * QuizPanel — config + history panel for AI quiz generation.
 * Mobile: full-screen bottom sheet. Desktop: right side panel (like AIModal).
 */
function QuizPanel({ onClose, bookId, supabaseBookId, bookTitle, fileUrl, isPdf, numPages, userId, onQuizStart }) {
  console.log('[QuizPanel] Mounted — bookId:', bookId, 'userId:', userId);

  const [view, setView] = useState('config'); // 'config' | 'history'
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // ─── Config state (copied from QuizGenerationModal internals) ───
  const [selectedPages, setSelectedPages] = useState([]);
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
        numQuestions, quizTime, difficulty,
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
      setError(err.message || 'Quiz generation failed. Please try again.');
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
        <div className={`relative rounded-card overflow-hidden border-2 transition-all duration-300 w-[90px] h-[130px] flex items-center justify-center cursor-pointer ${isSelected ? 'border-accent-primary shadow-lg shadow-accent-primary/20 scale-105' : 'border-border-default/50 hover:border-border-default bg-bg-subtle/50'}`}>
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
              <CheckCircle2 size={18} />
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
        className="flex flex-col fixed bottom-0 left-0 right-0 z-[200] bg-bg-subtle rounded-t-3xl h-[85vh] md:relative md:rounded-none md:inset-auto md:w-96 md:h-full md:border-l border-border-default md:shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-none animate-in slide-in-from-bottom md:slide-in-from-right duration-300 font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-default bg-bg-elevated relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => view === 'history' ? setView('config') : onClose()} className="p-2 hover:bg-bg-subtle rounded-lg transition-colors text-text-tertiary">
              {view === 'history' ? <ArrowLeft size={18} /> : <X size={18} />}
            </button>
            {view === 'config' && (
              <button onClick={() => setView('history')} className="p-2 hover:bg-bg-subtle rounded-lg transition-colors text-text-tertiary" title="Quiz History">
                <History size={18} />
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
                <Loader2 size={28} className="text-accent-primary animate-spin" />
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
                    <BookOpen size={16} className="text-text-tertiary" />
                    <label className="text-sm font-bold text-text-secondary">Select Pages</label>
                  </div>
                  <div className="relative">
                    <button onClick={() => setSelectedListOpen(!selectedListOpen)} disabled={selectedPages.length === 0}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${selectedPages.length > 0 ? 'text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 cursor-pointer shadow-sm border border-accent-primary/20' : 'text-text-tertiary bg-bg-subtle cursor-not-allowed opacity-50 border border-transparent'}`}>
                      <span>{selectedPages.length} selected</span>
                      {selectedPages.length > 0 && (selectedListOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </button>
                    {selectedListOpen && selectedPages.length > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-bg-elevated border border-border-default rounded-2xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-3 bg-bg-subtle/50 border-b border-border-default flex justify-between items-center">
                          <span className="text-sm font-bold text-text-secondary">Selected Pages</span>
                          <button onClick={() => { setSelectedPages([]); setSelectedListOpen(false); }} className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Clear All</button>
                        </div>
                        <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                          {[...selectedPages].sort((a,b) => a - b).map(p => (
                            <div key={p} className="flex justify-between items-center px-3 py-2 hover:bg-bg-subtle rounded-xl group transition-colors">
                              <span className="text-sm font-semibold text-text-primary">Page {p}</span>
                              <button onClick={(e) => { e.stopPropagation(); togglePageSelection(p); if (selectedPages.length === 1) setSelectedListOpen(false); }} className="text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                                <X size={14} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative group">
                  <button onClick={(e) => { e.preventDefault(); scrollByChunk('left'); }} className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-bg-elevated/90 shadow-md border border-border-default rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); scrollByChunk('right'); }} className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-bg-elevated/90 shadow-md border border-border-default rounded-full text-text-secondary hover:text-accent-primary hover:scale-105 transition-all opacity-0 group-hover:opacity-100">
                    <ChevronRight size={20} />
                  </button>
                  <div ref={scrollContainerRef} className="flex flex-row gap-4 overflow-x-auto py-4 px-2 scroll-smooth hide-scrollbar border-2 border-border-default rounded-card bg-neutral-50 dark:bg-bg-subtle/20">
                    {isPdf && fileUrl ? (
                      <Document file={fileUrl} loading={null}><div className="flex flex-row gap-4">{thumbnails}</div></Document>
                    ) : thumbnails}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Num Questions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Target size={16} className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Questions Limit</label></div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(n => (
                      <button key={n} onClick={() => setNumQuestions(n)} className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${numQuestions === n ? 'border-accent-primary bg-accent-primary text-white shadow-lg shadow-accent-primary/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-accent-primary/30 hover:bg-accent-primary/5'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                {/* Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Time Limit</label></div>
                  <div className="grid grid-cols-4 gap-2">
                    {['5m', '10m', '15m', 'None'].map(t => (
                      <button key={t} onClick={() => setQuizTime(t)} className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${quizTime === t ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-amber-500/30 hover:bg-amber-500/5'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {/* Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><Layers size={16} className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Question Type</label></div>
                  <div className="flex gap-2">
                    {['mcq', 'essay'].map((t) => (
                      <button key={t} onClick={() => setQuizType(t)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${quizType === t ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-blue-500/30 hover:bg-blue-500/5'}`}>{t === 'mcq' ? 'Multiple Choice' : 'Short Essay'}</button>
                    ))}
                  </div>
                </div>
                {/* Difficulty */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1"><BrainCircuit size={16} className="text-text-tertiary" /><label className="text-sm font-bold text-text-secondary">Difficulty</label></div>
                  <div className="flex gap-2">
                    {['beginner', 'intermediate', 'advanced'].map(d => (
                      <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2 capitalize ${difficulty === d ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105 z-10' : 'border-border-default bg-transparent text-text-secondary hover:border-purple-500/30 hover:bg-purple-500/5'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-3 bg-accent-primary/5 border border-accent-primary/10 p-4 rounded-2xl">
                <AlertCircle size={18} className="text-accent-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-text-secondary leading-relaxed">Generating custom quizzes from specific pages might take a moment. Ensure the selected pages contain text content.</p>
              </div>

              {/* Error display */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl animate-in fade-in">
                  <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* ── History View ── */
            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
              {historyLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 size={24} className="text-text-tertiary animate-spin" />
                </div>
              ) : quizHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center mb-4">
                    <BarChart2 size={24} className="text-text-tertiary" />
                  </div>
                  <h3 className="text-sm font-bold text-text-secondary mb-1">No quizzes yet</h3>
                  <p className="text-xs text-text-tertiary max-w-[200px]">Generate a quiz to see your history here.</p>
                </div>
              ) : (
                quizHistory.map((quiz) => (
                  <div key={quiz.id} className="bg-bg-elevated border border-border-default rounded-card p-4 shadow-sm hover:border-border-default/80 transition-all">
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
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-lg font-black text-text-primary">{quiz.score_percentage}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <XCircle size={16} className="text-text-tertiary" />
                            <span className="text-sm font-bold text-text-tertiary">Incomplete</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-text-tertiary font-medium">
                        <span className="flex items-center gap-1"><Brain size={12} />{quiz.question_count}q</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{formatTimeTaken(quiz.time_taken_seconds)}</span>
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
          <div className="sticky bottom-0 z-50 bg-bg-elevated/90 backdrop-blur-xl p-4 border-t border-border-default/50 flex-shrink-0">
            <button onClick={handleGenerate} disabled={generating}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${generating ? 'bg-neutral-200 dark:bg-bg-subtle text-text-tertiary cursor-not-allowed shadow-none' : 'bg-accent-primary text-white hover:bg-accent-primary/90 hover:shadow-[0_10px_40px_rgba(139,92,246,0.3)]'}`}>
              <Sparkles size={20} />
              <span>Generate Quiz</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default QuizPanel;
