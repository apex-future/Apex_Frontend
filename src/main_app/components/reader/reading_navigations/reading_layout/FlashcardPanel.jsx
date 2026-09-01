import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ClockCounterClockwise,
  CaretLeft,
  CaretRight,
  Highlighter,
  Note,
  BookOpen,
  Sparkle,
  Lightning,
  Shuffle,
  CheckCircle,
  WarningCircle,
  Check,
  Cards,
  CaretDown,
  CaretUp,
  Trash,
  ShareNetwork,
  Square,
  CheckSquare
} from '@phosphor-icons/react';
import ListItem from '../../../ui/ListItem';
import Button from '../../../ui/Button';
import EmptyState from '../../../ui/EmptyState';
import Modal from '../../../ui/Modal';
import Card from '../../../ui/Card';
import Flashcard3D from '../../../ai/Flashcard3D';
import {
  fetchBookDeck,
  fetchBookCards,
  fetchBookSessions,
  fetchSessionCards,
  generateIncrementalCards,
  recordSessionResult,
  deleteCards
} from '../../../../services/flashcardService';
import { showToastGlobal } from '../../../../hooks/useToast';
import apiClient from '../../../../services/apiClient';
import { extractPageTexts } from '../../../../services/quizService';
import useQuestStore from '../../../../store/useQuestStore';
import useXpStore from '../../../../store/useXpStore';
import { XP_VALUES } from '../../../../../config/xpConfig';

export default function FlashcardPanel({ setFlashcardPanel, book, fileUrl, pageNumber = 1, totalPages = 1, initialSelectedPages = [] }) {
  const [view, setView] = useState('categories'); // 'categories' | 'category_cards' | 'practice_setup' | 'practice_session' | 'history' | 'history_detail' | 'quick_setup'
  const [selectedCategory, setSelectedCategory] = useState(null); // 'highlight' | 'tab' | 'word'
  const [cards, setCards] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Screen size detection to prevent Portal Modal on Mobile
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Category Cards Delete / Selection State
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Practice Setup State: Default only 'highlight' selected with its page picker drawer open
  const [selectedSources, setSelectedSources] = useState(['highlight']);
  const [expandedSource, setExpandedSource] = useState('highlight');

  // Page Seeds selection per category
  const [selectedHighlightPages, setSelectedHighlightPages] = useState([]);
  const [selectedTabPages, setSelectedTabPages] = useState([]);

  // Question limit matching QuizPanel options: 5, 10, 15, 20
  const [cardsPerSession, setCardsPerSession] = useState(10);
  const [setupError, setSetupError] = useState('');

  // Active Session State
  const [sessionQueue, setSessionQueue] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState([]); // [{ cardId, rating }]
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Modal Quit Session confirmation state
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'categories' | 'history' | 'close_panel'

  // History Session Detail view state
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [sessionDetailCards, setSessionDetailCards] = useState([]);
  const [sessionDetailIndex, setSessionDetailIndex] = useState(0);
  const [sessionDetailFlipped, setSessionDetailFlipped] = useState(false);
  const [sessionDetailViewMode, setSessionDetailViewMode] = useState('card'); // 'card' | 'list'
  const [flippedListCards, setFlippedListCards] = useState(new Set());

  // Quick Setup state
  const [quickSetupRangeStart, setQuickSetupRangeStart] = useState('');
  const [quickSetupRangeEnd, setQuickSetupRangeEnd] = useState('');
  const [quickSetupCardsCount, setQuickSetupCardsCount] = useState(10);
  const [quickSetupCards, setQuickSetupCards] = useState([]);
  const [quickSetupGenerating, setQuickSetupGenerating] = useState(false);
  const [quickSetupError, setQuickSetupError] = useState('');
  const [sessionSource, setSessionSource] = useState('practice_setup'); // 'practice_setup' | 'quick_setup'

  const bookId = book?.id || book?.recordId || book?.supabaseId;

  // Load cards & sessions on mount and after generation
  const loadData = async () => {
    if (!bookId) return;
    const loadedCards = await fetchBookCards(bookId);
    const loadedSessions = await fetchBookSessions(bookId);
    setCards(loadedCards);
    setSessions(loadedSessions);
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  // Derived Card Counts
  const highlightCount = useMemo(() => cards.filter(c => c.source_type === 'highlight').length, [cards]);
  const tabCount = useMemo(() => cards.filter(c => c.source_type === 'tab').length, [cards]);
  const wordCount = useMemo(() => cards.filter(c => c.source_type === 'word').length, [cards]);

  // Category Cards for selected view
  const categoryCards = useMemo(() => {
    if (!selectedCategory) return [];
    return cards.filter(c => c.source_type === selectedCategory);
  }, [cards, selectedCategory]);

  // Unique pages with generated flashcards per source
  const highlightPages = useMemo(() => {
    const set = new Set();
    cards.filter(c => c.source_type === 'highlight' && c.page_number).forEach(c => set.add(c.page_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [cards]);

  const tabPages = useMemo(() => {
    const set = new Set();
    cards.filter(c => c.source_type === 'tab' && c.page_number).forEach(c => set.add(c.page_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [cards]);

  // Reset Delete mode state when changing view or category
  useEffect(() => {
    setIsDeleteMode(false);
    setSelectedCardIds(new Set());
  }, [view, selectedCategory]);

  // Handle Incremental Generation Trigger with Toasts
  const handleGenerateClick = async () => {
    if (isGenerating) return;

    // Check if there are ungenerated highlights, tabs, or words
    const highlights = book?.metadata?.highlights || [];
    const tabs = book?.metadata?.tabs || [];
    const words = book?.metadata?.words || [];

    const ungeneratedCount = highlights.filter(h => !h.has_flashcard).length
      + tabs.filter(t => !t.has_flashcard).length
      + words.filter(w => !w.has_flashcard).length;

    if (ungeneratedCount === 0) {
      showToastGlobal('No new highlights, tabs, or words to generate flashcards from.', 'info');
      return;
    }

    setIsGenerating(true);
    showToastGlobal('Generating flashcards... Feel free to keep reading!', 'info');

    try {
      const res = await generateIncrementalCards(book, (msg) => {
        showToastGlobal(msg, 'info');
      });

      if (res.count > 0) {
        showToastGlobal(res.message, 'success');
        await loadData();
        // Report quest progress for generating flashcards
        useQuestStore.getState().reportAction('flashcard_generated', 1);
      } else {
        showToastGlobal(res.message, 'info');
      }
    } catch (err) {
      console.error('[FlashcardPanel] Generation failed:', err);
      showToastGlobal('Failed to generate flashcards. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Source in Practice Setup Multi-select & Expand Page Picker
  const toggleSourceSelection = (source) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev; // keep at least one
        if (expandedSource === source) setExpandedSource(null);
        return prev.filter(s => s !== source);
      }
      // Select & expand if highlight or tab
      if (source === 'highlight' || source === 'tab') {
        setExpandedSource(source);
      }
      return [...prev, source];
    });
  };

  // Toggle Page Seed selection
  const togglePageSeed = (source, pageNum) => {
    if (source === 'highlight') {
      setSelectedHighlightPages(prev =>
        prev.includes(pageNum) ? prev.filter(p => p !== pageNum) : [...prev, pageNum]
      );
    } else if (source === 'tab') {
      setSelectedTabPages(prev =>
        prev.includes(pageNum) ? prev.filter(p => p !== pageNum) : [...prev, pageNum]
      );
    }
  };

  // Randomize 5 pages from available page seeds
  const randomizePageSeeds = (source) => {
    const availablePages = source === 'highlight' ? highlightPages : tabPages;
    if (availablePages.length === 0) return;

    const shuffled = [...availablePages].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(5, shuffled.length)).sort((a, b) => a - b);

    if (source === 'highlight') {
      setSelectedHighlightPages(picked);
    } else if (source === 'tab') {
      setSelectedTabPages(picked);
    }
  };

  // Toggle Card selection in Delete mode
  const toggleCardSelection = (cardId) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Toggle Select All cards in current category
  const toggleSelectAllCategoryCards = () => {
    if (selectedCardIds.size === categoryCards.length) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(categoryCards.map(c => c.id)));
    }
  };

  // Share Category Flashcards to Clipboard / Web Share
  const handleShareCategoryCards = async () => {
    if (categoryCards.length === 0) return;
    const text = categoryCards.map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`).join('\n\n');
    const title = `${selectedCategory.toUpperCase()} Flashcards`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (e) {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      showToastGlobal(`${categoryCards.length} flashcards copied to clipboard!`, 'success');
    } catch (err) {
      showToastGlobal('Failed to copy flashcards to clipboard', 'error');
    }
  };

  // Delete Action Click
  const handleDeleteButtonClick = () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
    } else {
      if (selectedCardIds.size > 0) {
        setShowDeleteConfirmModal(true);
      } else {
        setIsDeleteMode(false);
      }
    }
  };

  // Confirm Deletion
  const handleConfirmDeleteCards = async () => {
    setShowDeleteConfirmModal(false);
    const idsToDelete = Array.from(selectedCardIds);
    if (idsToDelete.length === 0) return;

    try {
      await deleteCards(idsToDelete, bookId);
      showToastGlobal(`Deleted ${idsToDelete.length} flashcard${idsToDelete.length !== 1 ? 's' : ''}.`, 'success');
      setSelectedCardIds(new Set());
      setIsDeleteMode(false);
      await loadData();
    } catch (err) {
      console.error('[FlashcardPanel] Delete failed:', err);
      showToastGlobal('Failed to delete selected flashcards.', 'error');
    }
  };

  // Start Practice Session
  const handleStartPractice = () => {
    setSetupError('');

    // Page selection requirement check for Highlights
    if (selectedSources.includes('highlight') && highlightPages.length > 0 && selectedHighlightPages.length === 0) {
      showToastGlobal('Please select at least one page for Highlights (or click Random 5 pages).', 'warning');
      setSetupError('Please select at least one page for Highlights.');
      setExpandedSource('highlight');
      return;
    }

    // Page selection requirement check for Tabs
    if (selectedSources.includes('tab') && tabPages.length > 0 && selectedTabPages.length === 0) {
      showToastGlobal('Please select at least one page for Tabs (or click Random 5 pages).', 'warning');
      setSetupError('Please select at least one page for Tabs.');
      setExpandedSource('tab');
      return;
    }

    // Filter cards matching practice configuration
    let filtered = cards.filter(c => {
      const isSourceMatch = selectedSources.includes(c.source_type);
      if (!isSourceMatch) return false;

      if (c.source_type === 'highlight') {
        if (selectedHighlightPages.length > 0) {
          return selectedHighlightPages.includes(c.page_number);
        }
      }
      if (c.source_type === 'tab') {
        if (selectedTabPages.length > 0) {
          return selectedTabPages.includes(c.page_number);
        }
      }
      return true; // words don't filter by page
    });

    if (filtered.length === 0) {
      showToastGlobal('No flashcards found matching your filters. Try generating cards first!', 'warning');
      setSetupError('No flashcards found matching your filters.');
      return;
    }

    if (filtered.length < cardsPerSession) {
      showToastGlobal(`Not enough cards to practice ${cardsPerSession} cards. You only have ${filtered.length} matching card${filtered.length !== 1 ? 's' : ''}.`, 'warning');
      setSetupError(`Not enough cards to practice ${cardsPerSession} cards (only ${filtered.length} available).`);
      return;
    }

    // Spaced Repetition Priority Sort: Hard & Missed cards surface FIRST!
    const confidencePriority = { missed: 1, hard: 2, new: 3, easy: 4 };
    filtered.sort((a, b) => {
      const prioA = confidencePriority[a.confidence] || 3;
      const prioB = confidencePriority[b.confidence] || 3;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(a.last_practiced_at || 0) - new Date(b.last_practiced_at || 0); // oldest practiced first
    });

    const sessionCards = filtered.slice(0, cardsPerSession);

    setSessionQueue(sessionCards);
    setSessionIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setSessionStartTime(new Date().toISOString());
    setSessionCompleted(false);
    setSetupError('');
    setSessionSource('practice_setup');
    setView('practice_session');
  };

  // Handle Card Rating (Easy / Hard / Missed)
  const handleRateCard = async (rating) => {
    const currentCard = sessionQueue[sessionIndex];
    if (!currentCard) return;

    const updatedResults = [...sessionResults, { cardId: currentCard.id, rating }];
    setSessionResults(updatedResults);

    if (sessionIndex < sessionQueue.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setSessionIndex(prev => prev + 1), 150);
    } else {
      // Session finished — record session result & cards snapshot in DB for ALL sessions
      setSessionCompleted(true);
      
      const cardsSnapshot = sessionQueue.map(c => {
        const res = updatedResults.find(r => r.cardId === c.id);
        return {
          front: c.front,
          back: c.back,
          page_number: c.page_number || 1,
          rating: res ? res.rating : 'easy'
        };
      });

      await recordSessionResult(bookId, {
        sources: sessionSource === 'quick_setup' ? ['quick_setup'] : selectedSources,
        startedAt: sessionStartTime,
        cardsSnapshot,
      }, updatedResults);

      await loadData();

      // Award XP based on practice accuracy using per-card formula: max(min, cards * per_card * accuracy/100)
      const totalCards = updatedResults.length;
      const easyCount = updatedResults.filter(r => r.rating === 'easy').length;
      const score_percentage = totalCards > 0 ? Math.round((easyCount / totalCards) * 100) : 0;
      const perCard = XP_VALUES.flashcard_practiced_per_card || 3;
      const minXp = XP_VALUES.flashcard_practiced_min || 10;
      const calculatedXp = Math.floor(totalCards * perCard * (score_percentage / 100));
      const earnedXp = Math.max(minXp, calculatedXp);
      useXpStore.getState().awardXpOptimistic('flashcard_practiced', { score_percentage, cards_count: totalCards }, earnedXp);

      // Report quest progress for practicing flashcards
      useQuestStore.getState().reportAction('flashcard_practiced', 1);
    }
  };

  // Handle Back Navigation with Modal Confirmation during active practice
  const handleNavigationRequest = (target) => {
    if (view === 'practice_session' && !sessionCompleted) {
      setPendingAction(target);
      setShowQuitModal(true);
    } else {
      if (target === 'categories') setView('categories');
      else if (target === 'quick_setup') setView('quick_setup');
      else if (target === 'history') setView(prev => (prev === 'history' || prev === 'history_detail') ? 'categories' : 'history');
      else if (target === 'close_panel') setFlashcardPanel(false);
    }
  };

  const handleConfirmQuitSession = () => {
    setShowQuitModal(false);
    if (pendingAction === 'close_panel') {
      setFlashcardPanel(false);
    } else if (pendingAction === 'history') {
      setView('history');
    } else if (sessionSource === 'quick_setup') {
      // Return to Quick Setup view when quitting a quick-setup session
      setView('quick_setup');
    } else {
      setView('categories');
    }
    setPendingAction(null);
  };

  // ── Quick Setup handlers ──────────────────────────────────────────────────

  const handleQuickGenerate = async () => {
    if (quickSetupGenerating) return;

    // Derive the pages array from the range inputs
    const s = Math.max(1, Math.min(parseInt(quickSetupRangeStart, 10) || 0, totalPages));
    const e = Math.max(s, Math.min(parseInt(quickSetupRangeEnd, 10) || 0, totalPages));

    if (!s || !e || quickSetupRangeStart === '' || quickSetupRangeEnd === '') {
      showToastGlobal('Please enter a valid page range.', 'warning');
      return;
    }

    const pageCount = e - s + 1;
    if (pageCount > 15) {
      showToastGlobal('Range too large — maximum 15 pages for Quick Setup.', 'warning');
      setQuickSetupError(`Range too large (${pageCount} pages). Please select 15 pages or fewer.`);
      return;
    }

    const pages = Array.from({ length: pageCount }, (_, i) => s + i);

    setQuickSetupGenerating(true);
    setQuickSetupError('');
    setQuickSetupCards([]);

    try {
      const pageTexts = await extractPageTexts(pages, fileUrl);
      const hasText = pageTexts.some(p => p.text.trim().length > 20);
      if (!hasText) {
        setQuickSetupError('No readable text found on selected pages. Make sure those pages are visible in the reader and the PDF has a text layer.');
        showToastGlobal('No readable text found. Scroll to the selected pages first.', 'warning');
        return;
      }

      const response = await apiClient.post('/api/ai/generate-flashcards', {
        source_type: 'book_pages',
        page_texts: pageTexts,
        num_cards: quickSetupCardsCount,
      });

      const flashcards = response.data?.flashcards || [];
      if (flashcards.length === 0) {
        setQuickSetupError('No flashcards were generated. Try selecting pages with more content.');
        showToastGlobal('No flashcards generated. Try different pages.', 'warning');
        return;
      }

      // Assign temporary IDs — these cards are transient and NOT saved to Dexie
      const cardsWithIds = flashcards.map((fc, i) => ({
        id: `qs_${Date.now()}_${i}`,
        front: fc.question || fc.front || '',
        back: fc.answer || fc.back || '',
        source_type: 'quick_setup',
        page_number: s,
        confidence: 'new',
        times_practiced: 0,
      }));

      setQuickSetupCards(cardsWithIds);
      showToastGlobal(`${cardsWithIds.length} flashcards generated!`, 'success');
      // Report quest progress for generating flashcards
      useQuestStore.getState().reportAction('flashcard_generated', 1);
    } catch (err) {
      console.error('[FlashcardPanel] Quick Setup generation failed:', err);
      const detail = err?.response?.data?.detail || '';
      if (detail.includes('exceeds') || detail.includes('limit')) {
        setQuickSetupError('Too much text selected. Try fewer pages (max ~15).');
      } else {
        setQuickSetupError('Failed to generate flashcards. Please try again.');
      }
      showToastGlobal('Failed to generate flashcards. Please try again.', 'error');
    } finally {
      setQuickSetupGenerating(false);
    }
  };

  const handleStartQuickSetupPractice = () => {
    if (quickSetupCards.length === 0) return;
    const sessionCards = quickSetupCards.slice(0, quickSetupCardsCount);
    setSessionQueue(sessionCards);
    setSessionIndex(0);
    setIsFlipped(false);
    setSessionResults([]);
    setSessionStartTime(new Date().toISOString());
    setSessionCompleted(false);
    setSessionSource('quick_setup');
    setView('practice_session');
  };

  const handleOpenHistorySession = async (session) => {
    setSelectedHistorySession(session);
    const loadedCards = await fetchSessionCards(session);
    setSessionDetailCards(loadedCards);
    setSessionDetailIndex(0);
    setSessionDetailFlipped(false);
    setFlippedListCards(new Set());
    setView('history_detail');
  };

  // ─────────────────────────────────────────────────────────────────────────

  const isAllCategoryCardsSelected = categoryCards.length > 0 && selectedCardIds.size === categoryCards.length;

  return (
    <>
      {/* PRACTICE SESSION: MOBILE NATIVE FULL PAGE VIEW (NO PORTAL MODAL / NO BACKDROP OVERLAY) */}
      {view === 'practice_session' && !isDesktop && (
        <div
          className="fixed inset-0 z-[999] bg-bg-primary dark:bg-bg-primary flex flex-col justify-between p-6 font-sans animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-default/30">
            <button
              onClick={() => handleNavigationRequest('categories')}
              className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              <CaretLeft size={16} weight="bold" /> Back
            </button>
            {!sessionCompleted && (
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider bg-bg-subtle px-3.5 py-1 rounded-full border border-border-default">
                Card {sessionIndex + 1} of {sessionQueue.length}
              </span>
            )}
          </div>

          {/* Practice Body */}
          {!sessionCompleted ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 my-auto py-6">
              <Flashcard3D
                question={sessionQueue[sessionIndex]?.front}
                answer={sessionQueue[sessionIndex]?.back}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                compact={true}
              />

              <div className="flex items-center gap-3 w-full max-w-sm mt-4">
                <button
                  onClick={() => handleRateCard('missed')}
                  className="flex-1 py-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-bold text-xs transition-all border border-red-500/30 active:scale-95 shadow-sm"
                >
                  Missed
                </button>
                <button
                  onClick={() => handleRateCard('hard')}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all border border-amber-500/30 active:scale-95 shadow-sm"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleRateCard('easy')}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all border border-emerald-500/30 active:scale-95 shadow-sm"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 my-auto py-6">
              <CheckCircle size={52} weight="fill" className="text-emerald-500 animate-bounce" />
              <h3 className="text-xl font-bold text-text-primary font-display">Session Completed!</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                You practiced {sessionQueue.length} flashcard{sessionQueue.length !== 1 ? 's' : ''}. Ratings updated!
              </p>

              <div className="flex items-center justify-center gap-6 py-3 w-full border-y border-border-default/30 my-2">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-emerald-500">{sessionResults.filter(r => r.rating === 'easy').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Easy</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-amber-500">{sessionResults.filter(r => r.rating === 'hard').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Hard</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-red-500">{sessionResults.filter(r => r.rating === 'missed').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Missed</span>
                </div>
              </div>

              <div className="w-[90%] mx-auto flex flex-col gap-3 mt-4">
                <Button variant="primary" onClick={sessionSource === 'quick_setup' ? handleStartQuickSetupPractice : handleStartPractice} className="w-full py-3.5 text-xs font-bold">Practice Again</Button>
                <Button variant="ghost" onClick={() => setView(sessionSource === 'quick_setup' ? 'quick_setup' : 'practice_setup')} className="w-full py-3.5 text-xs font-bold">{sessionSource === 'quick_setup' ? 'Change Pages' : 'Change Filters'}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRACTICE SESSION: DESKTOP MODAL VIEW USING PREDEFINED MODAL COMPONENT */}
      {view === 'practice_session' && isDesktop && (
        <Modal
          isOpen={true}
          onClose={() => handleNavigationRequest('categories')}
          className="!bg-bg-primary dark:!bg-bg-primary !max-w-lg min-h-[580px] justify-between shadow-2xl border border-border-default dark:border-white/10"
          title={
            <div className="flex items-center justify-between w-full pr-4">
              <button
                onClick={() => handleNavigationRequest('categories')}
                className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
              >
                <CaretLeft size={16} weight="bold" /> Back
              </button>
              {!sessionCompleted && (
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider bg-bg-subtle px-3 py-1 rounded-full border border-border-default">
                  Card {sessionIndex + 1} of {sessionQueue.length}
                </span>
              )}
            </div>
          }
        >
          {!sessionCompleted ? (
            <div className="flex flex-col items-center gap-5 py-2">
              <Flashcard3D
                question={sessionQueue[sessionIndex]?.front}
                answer={sessionQueue[sessionIndex]?.back}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                compact={true}
              />

              <div className="flex items-center gap-3 w-full max-w-sm mt-3">
                <button
                  onClick={() => handleRateCard('missed')}
                  className="flex-1 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-bold text-xs transition-all border border-red-500/30 active:scale-95 shadow-sm"
                >
                  Missed
                </button>
                <button
                  onClick={() => handleRateCard('hard')}
                  className="flex-1 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all border border-amber-500/30 active:scale-95 shadow-sm"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleRateCard('easy')}
                  className="flex-1 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all border border-emerald-500/30 active:scale-95 shadow-sm"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
              <CheckCircle size={52} weight="fill" className="text-emerald-500 animate-bounce" />
              <h3 className="text-xl font-bold text-text-primary font-display">Session Completed!</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                You practiced {sessionQueue.length} flashcard{sessionQueue.length !== 1 ? 's' : ''}. Ratings updated!
              </p>

              <div className="flex items-center justify-center gap-6 py-3 w-full border-y border-border-default/30 my-2">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-emerald-500">{sessionResults.filter(r => r.rating === 'easy').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Easy</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-amber-500">{sessionResults.filter(r => r.rating === 'hard').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Hard</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-red-500">{sessionResults.filter(r => r.rating === 'missed').length}</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Missed</span>
                </div>
              </div>

              <div className="w-[90%] mx-auto flex items-center justify-center gap-3 mt-3">
                <Button variant="primary" onClick={sessionSource === 'quick_setup' ? handleStartQuickSetupPractice : handleStartPractice} className="flex-1 py-3.5 text-xs font-bold">Practice Again</Button>
                <Button variant="ghost" onClick={() => setView(sessionSource === 'quick_setup' ? 'quick_setup' : 'practice_setup')} className="flex-1 py-3.5 text-xs font-bold">{sessionSource === 'quick_setup' ? 'Change Pages' : 'Change Filters'}</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* STANDARD RIGHT-SLIDING PANEL FOR ALL PANEL VIEWS */}
      <aside
        className={`flex flex-col fixed inset-0 z-[200] bg-bg-subtle dark:bg-bg-elevated h-full md:relative md:rounded-none md:inset-auto md:w-80 md:h-full md:border-0 md:border-l md:border-border-default/40 md:shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-sm animate-in slide-in-from-bottom md:slide-in-from-right duration-300 font-sans overflow-hidden ${
          view === 'practice_session' && !isDesktop ? 'hidden' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border-default/30">
          {view !== 'categories' ? (
            <button
              onClick={() => handleNavigationRequest('categories')}
              className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              <CaretLeft size={16} weight="bold" /> Back
            </button>
          ) : (
            <h2 className="text-xs font-black text-text-tertiary tracking-[0.2em] uppercase flex items-center gap-2">
              <Cards size={16} weight="fill" className="text-accent-primary" />
              Flashcards
            </h2>
          )}

          <div className="flex items-center gap-2">
            {/* History Icon */}
            <button
              onClick={() => handleNavigationRequest('history')}
              className={`p-2 rounded-full transition-all ${
                (view === 'history' || view === 'history_detail')
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'bg-bg-subtle hover:bg-bg-subtle text-text-tertiary hover:text-text-secondary'
              }`}
              title="Session History"
            >
              <ClockCounterClockwise size={18} weight="bold" />
            </button>

            {/* Close Panel Icon */}
            <button
              onClick={() => handleNavigationRequest('close_panel')}
              className="p-2 rounded-full bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-text-secondary"
              title="Close Panel"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Panel Body (No scrollbar displayed) */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-4 flex flex-col">
          {/* VIEW 1: CATEGORIES MAIN VIEW */}
          {view === 'categories' && (
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-tertiary font-semibold uppercase tracking-wider">Select Category</p>
                  <button
                    onClick={() => {
                      setQuickSetupCards([]);
                      setQuickSetupError('');
                      if (initialSelectedPages && initialSelectedPages.length > 0) {
                        const minPage = Math.min(...initialSelectedPages);
                        const maxPage = Math.max(...initialSelectedPages);
                        setQuickSetupRangeStart(String(Math.max(1, minPage)));
                        setQuickSetupRangeEnd(String(Math.min(totalPages, maxPage)));
                      } else {
                        setQuickSetupRangeStart(String(Math.max(1, pageNumber)));
                        setQuickSetupRangeEnd(String(Math.min(totalPages, pageNumber + 9)));
                      }
                      setView('quick_setup');
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition-all border border-amber-500/20 active:scale-95"
                    title="Quick Setup — Generate flashcards from a page range"
                  >
                    <Lightning size={11} weight="fill" />
                    Quick Setup
                  </button>
                </div>

                {/* Highlights */}
                <ListItem
                  icon={Highlighter}
                  label="Highlights"
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-secondary">{highlightCount} cards</span>
                      <CaretRight size={14} weight="bold" className="text-text-tertiary" />
                    </div>
                  }
                  onClick={() => {
                    setSelectedCategory('highlight');
                    setView('category_cards');
                  }}
                />

                {/* Tabs */}
                <ListItem
                  icon={Note}
                  label="Tabs"
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-secondary">{tabCount} cards</span>
                      <CaretRight size={14} weight="bold" className="text-text-tertiary" />
                    </div>
                  }
                  onClick={() => {
                    setSelectedCategory('tab');
                    setView('category_cards');
                  }}
                />

                {/* Words */}
                <ListItem
                  icon={BookOpen}
                  label="Words"
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-secondary">{wordCount} cards</span>
                      <CaretRight size={14} weight="bold" className="text-text-tertiary" />
                    </div>
                  }
                  onClick={() => {
                    setSelectedCategory('word');
                    setView('category_cards');
                  }}
                />
              </div>

              {/* Bottom Row: Centered Practice Button & Matching Height Generate Button (90% width container) */}
              <div className="w-[90%] mx-auto flex items-center justify-center gap-3 pt-4 border-t border-border-default/30">
                <Button
                  variant="primary"
                  onClick={() => setView('practice_setup')}
                  disabled={cards.length === 0}
                  className="flex-1 h-11 text-sm font-bold flex items-center justify-center"
                >
                  Practice
                </Button>

                {/* Generate Button with Lightning Icon & Shimmer/Pulse */}
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className={`h-11 w-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 relative overflow-hidden ${
                    isGenerating ? 'animate-pulse' : ''
                  }`}
                  title="Generate Flashcards from Book"
                >
                  <Lightning
                    size={20}
                    weight="fill"
                    className={isGenerating ? 'animate-bounce text-amber-300' : 'text-white'}
                  />
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: CATEGORY CARDS LIST WITH PREDEFINED CARD COMPONENT & MULTI-SELECT DELETE */}
          {view === 'category_cards' && (
            <div className="flex flex-col gap-3">
              {/* Header row with Category Title and Share/Delete Action Buttons */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary capitalize flex items-center gap-2">
                  {selectedCategory === 'highlight' && <Highlighter size={16} weight="fill" className="text-accent-primary" />}
                  {selectedCategory === 'tab' && <Note size={16} weight="fill" className="text-accent-primary" />}
                  {selectedCategory === 'word' && <BookOpen size={16} weight="fill" className="text-accent-primary" />}
                  {selectedCategory} ({categoryCards.length})
                </h3>

                {categoryCards.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {/* "All" Select Checkbox Pill (Visible when Delete Mode is Active) */}
                    {isDeleteMode && (
                      <button
                        onClick={toggleSelectAllCategoryCards}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                          isAllCategoryCardsSelected
                            ? 'bg-accent-primary text-white border-accent-primary'
                            : 'bg-bg-subtle text-text-secondary border-border-default hover:bg-accent-primary/10'
                        }`}
                        title={isAllCategoryCardsSelected ? 'Unselect All' : 'Select All'}
                      >
                        {isAllCategoryCardsSelected ? <CheckSquare size={13} weight="bold" /> : <Square size={13} weight="bold" />}
                        All
                      </button>
                    )}

                    {/* Share Button */}
                    <button
                      onClick={handleShareCategoryCards}
                      className="p-1.5 rounded-lg bg-bg-subtle hover:bg-bg-subtle transition-all text-text-tertiary hover:text-accent-primary"
                      title="Share / Copy Flashcards"
                    >
                      <ShareNetwork size={16} weight="bold" />
                    </button>

                    {/* Delete Button (Trash Icon) */}
                    <button
                      onClick={handleDeleteButtonClick}
                      className={`p-1.5 rounded-lg transition-all ${
                        isDeleteMode
                          ? selectedCardIds.size > 0
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-red-500/20 text-red-500 border border-red-500/40'
                          : 'bg-bg-subtle hover:bg-bg-subtle text-text-tertiary hover:text-red-500'
                      }`}
                      title={isDeleteMode ? (selectedCardIds.size > 0 ? `Delete (${selectedCardIds.size})` : 'Exit Delete Mode') : 'Delete Flashcards'}
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                )}
              </div>

              {categoryCards.length === 0 ? (
                <EmptyState
                  icon={Cards}
                  title="No flashcards generated"
                  description="There are no cards in this category yet. Use the generate button on the main view to create them."
                  className="my-6"
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {categoryCards.map(c => {
                    const isCardSelected = selectedCardIds.has(c.id);

                    return (
                      <Card
                        key={c.id}
                        variant={isDeleteMode ? 'interactive' : 'default'}
                        onClick={() => {
                          if (isDeleteMode) toggleCardSelection(c.id);
                        }}
                        className={`p-3.5 flex flex-col gap-1.5 transition-all ${
                          isCardSelected
                            ? '!border-accent-primary !bg-accent-primary/10 shadow-sm'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isDeleteMode && (
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 shadow-sm ${
                                isCardSelected ? 'bg-accent-primary border-accent-primary text-white' : 'border-border-default bg-surface'
                              }`}>
                                {isCardSelected && <Check size={12} weight="bold" />}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-text-tertiary uppercase">Page {c.page_number || 1}</span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            c.confidence === 'easy' ? 'bg-emerald-500/20 text-emerald-600' :
                            c.confidence === 'hard' ? 'bg-amber-500/20 text-amber-600' :
                            c.confidence === 'missed' ? 'bg-red-500/20 text-red-600' : 'bg-purple-500/20 text-purple-600'
                          }`}>
                            {c.confidence || 'new'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-text-primary line-clamp-2">Front: {c.front}</p>
                        <p className="text-xs text-text-secondary line-clamp-2">Back: {c.back}</p>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: PRACTICE SETUP */}
          {view === 'practice_setup' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-text-primary">Practice Setup</h3>

              {/* Categories list with collapsible horizontal page seed lists for Highlights and Tabs */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Categories</label>
                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'highlight', label: 'Highlights', count: highlightCount, icon: Highlighter, hasPagePicker: true, pages: highlightPages, selectedPages: selectedHighlightPages },
                    { id: 'tab', label: 'Tabs', count: tabCount, icon: Note, hasPagePicker: true, pages: tabPages, selectedPages: selectedTabPages },
                    { id: 'word', label: 'Words', count: wordCount, icon: BookOpen, hasPagePicker: false, pages: [], selectedPages: [] },
                  ].map(src => {
                    const isChecked = selectedSources.includes(src.id);
                    const isExpanded = expandedSource === src.id;

                    return (
                      <div key={src.id} className="flex flex-col rounded-xl border border-border-default bg-bg-subtle overflow-hidden transition-all">
                        {/* Main Category Selection Row */}
                        <div
                          onClick={() => toggleSourceSelection(src.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-secondary font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-accent-primary border-accent-primary text-white' : 'border-border-default'}`}>
                              {isChecked && <Check size={12} weight="bold" />}
                            </div>
                            <src.icon size={16} weight="bold" />
                            <span className="text-xs">{src.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-tertiary">{src.count} cards</span>
                            {src.hasPagePicker && isChecked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedSource(isExpanded ? null : src.id);
                                }}
                                className="p-1 text-text-tertiary hover:text-text-primary rounded"
                              >
                                {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Unfolded Horizontal Page Seeds Dropdown (Apex light-grey styling) */}
                        {src.hasPagePicker && isChecked && isExpanded && (
                          <div className="p-3 bg-bg-subtle/80 dark:bg-bg-subtle/40 border-t border-border-default/40 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                Pages with Cards ({src.selectedPages.length > 0 ? `${src.selectedPages.length} selected` : 'All'})
                              </label>
                              {/* Random 5 Pages Button */}
                              <button
                                onClick={() => randomizePageSeeds(src.id)}
                                disabled={src.pages.length === 0}
                                className="flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:text-accent-primary/80 transition-colors disabled:opacity-40"
                                title="Pick random 5 pages"
                              >
                                <Shuffle size={13} weight="bold" />
                                Random 5 pages
                              </button>
                            </div>

                            {/* Horizontal Seed List */}
                            {src.pages.length === 0 ? (
                              <p className="text-[11px] text-text-tertiary italic">No pages generated for this category yet.</p>
                            ) : (
                              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 pt-1">
                                {src.pages.map(p => {
                                  const isPageSelected = src.selectedPages.includes(p);
                                  return (
                                    <button
                                      key={p}
                                      onClick={() => togglePageSeed(src.id, p)}
                                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                                        isPageSelected
                                          ? 'bg-accent-primary text-white shadow-sm'
                                          : 'bg-bg-subtle text-text-secondary border border-border-default hover:bg-accent-primary/10'
                                      }`}
                                    >
                                      Page {p}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cards Per Session (Aligned with QuizPanel: 5, 10, 15, 20 — NO 'All' option) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Questions Limit</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setCardsPerSession(count)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        cardsPerSession === count
                          ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                          : 'bg-bg-subtle border-border-default text-text-secondary hover:bg-accent-primary/5'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {setupError && (
                <p className="text-xs text-red-500 font-bold">{setupError}</p>
              )}

              {/* Centered 90% Width Start Practice Session Button */}
              <div className="w-[90%] mx-auto mt-2">
                <Button
                  variant="primary"
                  onClick={handleStartPractice}
                  className="w-full py-3.5 text-sm font-bold flex items-center justify-center"
                >
                  Start Practice Session
                </Button>
              </div>
            </div>
          )}

          {/* VIEW 5: HISTORY */}
          {view === 'history' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <ClockCounterClockwise size={16} weight="bold" className="text-accent-primary" />
                Session History ({sessions.length})
              </h3>

              {sessions.length === 0 ? (
                <EmptyState
                  icon={ClockCounterClockwise}
                  title="No practice history"
                  description="You haven't completed any practice sessions for this book yet."
                  className="my-6"
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenHistorySession(s)}
                      className="p-3 bg-bg-subtle border border-border-default hover:border-accent-primary/50 rounded-xl flex flex-col gap-1 text-xs cursor-pointer transition-all active:scale-[0.99] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                            {new Date(s.completed_at || s.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {s.sources?.includes('quick_setup') && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Quick Setup
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-accent-primary">{s.cards_completed || s.cards_requested} cards</span>
                          <CaretRight size={13} weight="bold" className="text-text-tertiary group-hover:text-accent-primary transition-colors" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                        <span className="text-emerald-600 font-semibold">{s.easy_count || 0} Easy</span>
                        <span className="text-amber-600 font-semibold">{s.hard_count || 0} Hard</span>
                        <span className="text-red-600 font-semibold">{s.missed_count || 0} Missed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 5.5: HISTORY SESSION DETAIL */}
          {view === 'history_detail' && selectedHistorySession && (
            <div className="flex flex-col gap-4">
              {/* Header with Back button */}
              <div className="flex items-center justify-between pb-2 border-b border-border-default/40">
                <button
                  onClick={() => setView('history')}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-primary hover:text-accent-primary transition-colors"
                >
                  <CaretLeft size={16} weight="bold" /> History
                </button>
                <span className="text-[11px] font-bold text-text-tertiary">
                  {new Date(selectedHistorySession.completed_at || selectedHistorySession.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center justify-between bg-bg-subtle p-3 rounded-xl border border-border-default">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">{sessionDetailCards.length} Cards</span>
                  {selectedHistorySession.sources?.includes('quick_setup') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Quick Setup
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-emerald-600">{selectedHistorySession.easy_count || 0} Easy</span>
                  <span className="text-amber-600">{selectedHistorySession.hard_count || 0} Hard</span>
                  <span className="text-red-600">{selectedHistorySession.missed_count || 0} Missed</span>
                </div>
              </div>

              {/* View Mode Switcher: Card View (1 by 1) | List View (All) */}
              <div className="flex items-center justify-center p-1 bg-bg-subtle border border-border-default rounded-xl gap-1">
                <button
                  onClick={() => setSessionDetailViewMode('card')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    sessionDetailViewMode === 'card'
                      ? 'bg-accent-primary text-white shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Card View (1 by 1)
                </button>
                <button
                  onClick={() => setSessionDetailViewMode('list')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    sessionDetailViewMode === 'list'
                      ? 'bg-accent-primary text-white shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  List View (All)
                </button>
              </div>

              {/* MODE A: 1 CARD AT A TIME WITH PREV / NEXT NAV & RATING BADGE */}
              {sessionDetailViewMode === 'card' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {sessionDetailCards.length > 0 ? (
                    <>
                      {/* Rating badge header for current card */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          Page {sessionDetailCards[sessionDetailIndex]?.page_number || 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          sessionDetailCards[sessionDetailIndex]?.rating === 'easy' ? 'bg-emerald-500/20 text-emerald-600' :
                          sessionDetailCards[sessionDetailIndex]?.rating === 'hard' ? 'bg-amber-500/20 text-amber-600' :
                          'bg-red-500/20 text-red-600'
                        }`}>
                          {sessionDetailCards[sessionDetailIndex]?.rating || 'easy'}
                        </span>
                      </div>

                      {/* 3D Flashcard flip component */}
                      <Flashcard3D
                        question={sessionDetailCards[sessionDetailIndex]?.front}
                        answer={sessionDetailCards[sessionDetailIndex]?.back}
                        isFlipped={sessionDetailFlipped}
                        setIsFlipped={setSessionDetailFlipped}
                        compact={true}
                      />

                      {/* Prev / Next Navigation Bar */}
                      <div className="w-[90%] mx-auto flex items-center justify-between gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (sessionDetailIndex > 0) {
                              setSessionDetailFlipped(false);
                              setTimeout(() => setSessionDetailIndex(prev => prev - 1), 120);
                            }
                          }}
                          disabled={sessionDetailIndex === 0}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-bg-subtle border border-border-default text-xs font-bold text-text-primary hover:bg-accent-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                        >
                          <CaretLeft size={14} weight="bold" /> Prev
                        </button>

                        <span className="text-xs font-bold text-text-tertiary">
                          {sessionDetailIndex + 1} of {sessionDetailCards.length}
                        </span>

                        <button
                          onClick={() => {
                            if (sessionDetailIndex < sessionDetailCards.length - 1) {
                              setSessionDetailFlipped(false);
                              setTimeout(() => setSessionDetailIndex(prev => prev + 1), 120);
                            }
                          }}
                          disabled={sessionDetailIndex >= sessionDetailCards.length - 1}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-bg-subtle border border-border-default text-xs font-bold text-text-primary hover:bg-accent-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                        >
                          Next <CaretRight size={14} weight="bold" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={Cards}
                      title="No cards recorded"
                      description="Card details were not recorded for this past session."
                      className="my-4"
                    />
                  )}
                </div>
              )}

              {/* MODE B: LONG LIST OF ALL CARDS (CLICK TO FLIP) */}
              {sessionDetailViewMode === 'list' && (
                <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {sessionDetailCards.map((c, i) => {
                    const isFlipped = flippedListCards.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setFlippedListCards(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-colors duration-200 bg-bg-subtle select-none ${
                          isFlipped
                            ? 'border-purple-500 dark:border-purple-400 bg-purple-500/5 shadow-sm'
                            : 'border-border-default hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-text-tertiary uppercase">Page {c.page_number || 1}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            c.rating === 'easy' ? 'bg-emerald-500/20 text-emerald-600' :
                            c.rating === 'hard' ? 'bg-amber-500/20 text-amber-600' :
                            'bg-red-500/20 text-red-600'
                          }`}>
                            {c.rating || 'easy'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-text-primary transition-colors">
                          {isFlipped ? `Back: ${c.back}` : `Front: ${c.front}`}
                        </p>
                        <span className={`text-[10px] font-bold self-end transition-colors ${
                          isFlipped ? 'text-purple-500 dark:text-purple-400' : 'text-text-tertiary'
                        }`}>
                          {isFlipped ? 'Showing Back (click to flip)' : 'Showing Front (click to flip)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: QUICK SETUP — generate flashcards from a page range */}
          {view === 'quick_setup' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Lightning size={16} weight="fill" className="text-amber-500" />
                <h3 className="text-sm font-bold text-text-primary">Quick Setup</h3>
              </div>

              {/* Page Range Picker */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Page Range (max 15 pages)
                </label>

                {/* From — Randomize — To */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] text-text-tertiary font-bold text-center">From</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={quickSetupRangeStart}
                      onChange={e => {
                        setQuickSetupRangeStart(e.target.value);
                        setQuickSetupCards([]);
                      }}
                      className="w-full px-2 py-2 rounded-xl text-sm font-bold text-center bg-bg-subtle border border-border-default text-text-primary outline-none focus:border-accent-primary/60 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Randomize button in the middle */}
                  <div className="flex flex-col items-center gap-1 pt-4">
                    <button
                      onClick={() => {
                        if (totalPages < 1) return;
                        const maxStart = Math.max(1, totalPages - 9);
                        const start = Math.floor(Math.random() * maxStart) + 1;
                        const end = Math.min(totalPages, start + 9);
                        setQuickSetupRangeStart(String(start));
                        setQuickSetupRangeEnd(String(end));
                        setQuickSetupCards([]);
                      }}
                      className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 transition-all border border-purple-500/20 active:scale-95"
                      title="Randomize — pick a random 10-page range"
                    >
                      <Shuffle size={18} weight="bold" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] text-text-tertiary font-bold text-center">To</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={quickSetupRangeEnd}
                      onChange={e => {
                        setQuickSetupRangeEnd(e.target.value);
                        setQuickSetupCards([]);
                      }}
                      className="w-full px-2 py-2 rounded-xl text-sm font-bold text-center bg-bg-subtle border border-border-default text-text-primary outline-none focus:border-accent-primary/60 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Range summary */}
                {quickSetupRangeStart && quickSetupRangeEnd && (() => {
                  const s = Math.max(1, Math.min(parseInt(quickSetupRangeStart, 10) || 1, totalPages));
                  const e = Math.max(s, Math.min(parseInt(quickSetupRangeEnd, 10) || s, totalPages));
                  const count = e - s + 1;
                  const over = count > 15;
                  return (
                    <p className={`text-[11px] font-medium text-center ${
                      over ? 'text-red-500' : 'text-text-tertiary'
                    }`}>
                      {over
                        ? `Range too large (${count} pages) — max 15`
                        : `Pages ${s}–${e} · ${count} page${count !== 1 ? 's' : ''}`
                      }
                    </p>
                  );
                })()}
              </div>

              {/* Cards count */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Cards to Generate</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuickSetupCardsCount(count)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        quickSetupCardsCount === count
                          ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                          : 'bg-bg-subtle border-border-default text-text-secondary hover:bg-accent-primary/5'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {quickSetupError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                  <WarningCircle size={15} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">{quickSetupError}</p>
                </div>
              )}

              {/* Action Button: Morphs from "Generate" to primary predefined UI Button once cards are ready */}
              {quickSetupCards.length > 0 && !quickSetupGenerating ? (
                <div className="w-[90%] mx-auto">
                  <Button
                    variant="primary"
                    onClick={handleStartQuickSetupPractice}
                    className="w-full h-11 text-sm font-bold flex items-center justify-center gap-2 shadow-md animate-in fade-in duration-200"
                  >
                    <CaretRight size={18} weight="bold" />
                    Start Practice ({quickSetupCards.length} Cards)
                  </Button>
                </div>
              ) : (
                <div className="w-[90%] mx-auto">
                  <button
                    onClick={handleQuickGenerate}
                    disabled={quickSetupGenerating}
                    className={`w-full h-11 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      quickSetupGenerating
                        ? 'bg-purple-500/70 text-white animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                    }`}
                  >
                    <Lightning
                      size={18}
                      weight="fill"
                      className={quickSetupGenerating ? 'animate-bounce text-amber-300' : ''}
                    />
                    {quickSetupGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Predefined Modal Component for Card Deletion Confirmation */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setSelectedCardIds(new Set());
          setIsDeleteMode(false);
        }}
        title={`Delete ${selectedCardIds.size} Flashcard${selectedCardIds.size !== 1 ? 's' : ''}?`}
        message="Are you sure you want to delete the selected flashcard(s)? This action cannot be undone."
        actions={[
          {
            label: `Delete (${selectedCardIds.size})`,
            onClick: handleConfirmDeleteCards,
            variant: 'danger',
          },
          {
            label: 'Cancel',
            onClick: () => {
              setShowDeleteConfirmModal(false);
              setSelectedCardIds(new Set());
              setIsDeleteMode(false);
            },
            variant: 'ghost',
          },
        ]}
      />

      {/* Predefined Modal Component for Quit Session Confirmation */}
      <Modal
        isOpen={showQuitModal}
        onClose={() => {
          setShowQuitModal(false);
          setPendingAction(null);
        }}
        title="Quit Practice Session?"
        message="Are you sure you want to quit this practice session? Your progress in this session will be lost."
        actions={[
          {
            label: 'Quit Session',
            onClick: handleConfirmQuitSession,
            variant: 'danger',
          },
          {
            label: 'Cancel',
            onClick: () => {
              setShowQuitModal(false);
              setPendingAction(null);
            },
            variant: 'ghost',
          },
        ]}
      />
    </>
  );
}
