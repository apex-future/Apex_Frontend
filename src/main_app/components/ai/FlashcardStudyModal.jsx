import React, { useState, useEffect } from 'react';
import { X, CaretLeft, CaretRight, Stack, Sparkle, CheckCircle, ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import Flashcard3D from './Flashcard3D';
import useFlashcardStore from '../../store/useFlashcardStore';
import useQuestStore from '../../store/useQuestStore';
import useXpStore from '../../store/useXpStore';
import { XP_VALUES } from '../../../config/xpConfig';
import apiClient from '../../services/apiClient';
import db from '../../db/apex.db';
import { showToastGlobal } from '../../hooks/useToast';
import useThemeStore from '../../store/themeStore';

const FlashcardStudyModal = () => {
  const { 
    isOpen, 
    closeFlashcardModal, 
    sourceType, 
    textContent, 
    pageTexts,
    numCards = 10,
    bookTitle,
    isGenerating,
    generatedCards,
    generationError
  } = useFlashcardStore();

  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [isLoadingDeck, setIsLoadingDeck] = useState(false);
  const [deckCards, setDeckCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Custom states for grading/study session
  const [cardFeedback, setCardFeedback] = useState({});
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset study navigation states on open
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSaved(false);
      setCardFeedback({});
      setIsSessionFinished(false);
      setSessionSummary(null);

      if (sourceType === 'deck') {
        loadDeckCards();
      }
    }
  }, [isOpen, sourceType]);

  const loadDeckCards = async () => {
    setIsLoadingDeck(true);
    try {
      const state = useFlashcardStore.getState();
      const { deckId: dId } = state;
      const cards = await db.flashcards.where('deckId').equals(dId).toArray();
      if (cards && cards.length > 0) {
        setDeckCards(cards);
      } else {
        throw new Error('No flashcards found in this deck');
      }
    } catch (error) {
      console.error('[Flashcards] Deck loading failed:', error);
      showToastGlobal('Failed to load flashcards deck.', 'error');
      closeFlashcardModal();
    } finally {
      setIsLoadingDeck(false);
    }
  };

  const flashcards = sourceType === 'deck' ? deckCards : generatedCards;
  const isLoading = sourceType === 'deck' ? isLoadingDeck : isGenerating;

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
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

  const handleFeedback = (type) => {
    setCardFeedback(prev => ({ ...prev, [currentIndex]: type }));
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 200);
    }
  };

  const finishSession = () => {
    const total = flashcards.length;
    const correct = Object.values(cardFeedback).filter(v => v === 'remembered').length;
    const score_percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Award XP using per-card formula: max(min, cards * per_card * accuracy/100)
    const perCard = XP_VALUES.flashcard_practiced_per_card || 3;
    const minXp = XP_VALUES.flashcard_practiced_min || 10;
    const calculatedXp = Math.floor(total * perCard * (score_percentage / 100));
    const earnedXp = Math.max(minXp, calculatedXp);
    
    // Award XP optimistically
    useXpStore.getState().awardXpOptimistic('flashcard_practiced', { score_percentage, cards_count: total }, earnedXp);
    
    // Report quest progress
    useQuestStore.getState().reportAction('flashcard_practiced', 1);
    
    setSessionSummary({ correct, total, score_percentage, earnedXp });
    setIsSessionFinished(true);
  };

  const handleSaveDeck = async () => {
    const state = useFlashcardStore.getState();
    const currentBookName = state.bookTitle || 'Selection';
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultName = `Flashcards from ${currentBookName} (${dateStr})`;
    const deckName = window.prompt("Name your new study deck (or leave blank for automatic):", defaultName);
    
    if (deckName === null) return; // User cancelled

    const finalName = deckName.trim() || defaultName;

    try {
      const localDeckId = `deck_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Save deck
      await db.study_decks.add({
        local_id: localDeckId,
        title: finalName,
        source_type: state.sourceType || 'unknown',
        bookId: state.bookId || null,
        createdAt: new Date().toISOString(),
        synced: 0,
      });

      // Save all flashcards
      const cardsToSave = flashcards.map(card => ({
        local_id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        deckId: localDeckId,
        question: card.question,
        answer: card.answer,
        createdAt: new Date().toISOString(),
        synced: 0
      }));

      await db.flashcards.bulkAdd(cardsToSave);

      setIsSaved(true);
      showToastGlobal('Deck saved to your Study Decks!', 'success');

      setTimeout(() => {
        closeFlashcardModal();
      }, 1500);
    } catch (err) {
      console.error('Failed to save deck:', err);
      showToastGlobal('Failed to save deck locally', 'error');
    }
  };

  if (!isOpen) return null;

  // Completion summary UI
  if (isSessionFinished && sessionSummary) {
    const { correct, total, score_percentage, earnedXp } = sessionSummary;
    return (
      <div className="fixed inset-0 z-[999] flex flex-col justify-center items-center bg-black/40 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-md flex flex-col relative bg-bg-elevated border border-border-default rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="absolute top-4 right-4">
            <button 
              onClick={closeFlashcardModal}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-text-primary transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} weight="fill" className="text-accent-primary animate-bounce" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-text-primary mb-1">Study Session Complete!</h3>
          <p className="text-sm text-text-secondary mb-6">{bookTitle || 'Study Deck'}</p>

          <div className="bg-bg-subtle/50 border border-border-default/50 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Accuracy</span>
                <span className="text-2xl font-black text-accent-primary">{score_percentage}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Remembered</span>
                <span className="text-2xl font-black text-text-primary">{correct} / {total}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">XP Awarded</span>
            <span className="text-xl font-black text-emerald-500">+{earnedXp} XP</span>
          </div>

          <button 
            onClick={closeFlashcardModal}
            className="w-full py-3 bg-text-primary text-bg-primary font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-center items-center bg-black/40 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="w-full max-w-2xl flex flex-col relative">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2">
          <div className="flex items-center gap-2 text-white">
            <Stack size={20} weight="fill" className="text-accent-primary sm:w-6 sm:h-6" />
            <span className="font-bold text-base sm:text-lg tracking-wide">{bookTitle || 'Study Deck'}</span>
          </div>
          <button 
            onClick={closeFlashcardModal}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <X size={18} weight="bold" className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="w-full aspect-[4/3] max-h-[50vh] sm:max-h-[500px] md:max-h-[600px] rounded-2xl sm:rounded-3xl glass-card flex flex-col items-center justify-center p-5 sm:p-8 relative overflow-hidden">
            {/* Glowing Aura Effect */}
            <div className="absolute inset-0 bg-accent-primary/5 animate-pulse rounded-2xl sm:rounded-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 bg-accent-primary/20 rounded-full blur-[60px] animate-pulse"></div>
            
            <Sparkle size={36} weight="fill" className="text-accent-primary animate-bounce mb-4 sm:mb-6 relative z-10 sm:w-12 sm:h-12" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-2 relative z-10">Crafting your deck...</h3>
            <p className="text-text-secondary font-medium text-center max-w-sm relative z-10 text-sm sm:text-base px-2">
              Cleo is reading your selection and designing the perfect flashcards.
            </p>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="flex flex-col items-center w-full">
            
            {/* The 3D Card */}
            <div className="w-full flex justify-center mb-4 sm:mb-6 md:mb-8 relative">
              <Flashcard3D 
                question={flashcards[currentIndex]?.question}
                answer={flashcards[currentIndex]?.answer}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
              />
              
              {/* Deck Depth Illusion (Stacked Cards behind) */}
              {currentIndex < flashcards.length - 1 && (
                <div className={`absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[85%] sm:w-[90%] max-w-[260px] sm:max-w-[320px] aspect-[3/4] rounded-2xl sm:rounded-3xl -z-10 opacity-50 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} border`}></div>
              )}
              {currentIndex < flashcards.length - 2 && (
                <div className={`absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-[75%] sm:w-[80%] max-w-[230px] sm:max-w-[290px] aspect-[3/4] rounded-2xl sm:rounded-3xl -z-20 opacity-25 ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'} border`}></div>
              )}
            </div>

            {/* Grading buttons shown when card is flipped */}
            {isFlipped && (
              <div className="flex gap-4 w-full max-w-[280px] sm:max-w-sm justify-center mb-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => handleFeedback('forgot')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border transition-all ${
                    cardFeedback[currentIndex] === 'forgot'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 active:scale-95'
                  }`}
                >
                  <ThumbsDown size={16} weight="bold" />
                  Forgot
                </button>
                <button
                  onClick={() => handleFeedback('remembered')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border transition-all ${
                    cardFeedback[currentIndex] === 'remembered'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95'
                  }`}
                >
                  <ThumbsUp size={16} weight="bold" />
                  Remembered
                </button>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-[280px] sm:max-w-sm px-2 sm:px-4">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2.5 sm:p-3 rounded-full bg-bg-elevated text-text-primary shadow-sm disabled:opacity-30 transition-transform active:scale-95 animate-in"
              >
                <CaretLeft size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="text-white/80 font-bold tracking-widest text-xs sm:text-sm bg-black/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md">
                {currentIndex + 1} / {flashcards.length}
              </div>

              <button 
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className="p-2.5 sm:p-3 rounded-full bg-bg-elevated text-text-primary shadow-sm disabled:opacity-30 transition-transform active:scale-95 animate-in"
              >
                <CaretRight size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Finish/Save buttons on the last card */}
            {currentIndex === flashcards.length - 1 && (
              <div className="mt-5 sm:mt-6 md:mt-8 flex flex-col gap-3 w-full max-w-[280px] sm:max-w-sm items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                {sourceType !== 'deck' && !isSaved && (
                  <button 
                    onClick={handleSaveDeck}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm bg-accent-primary hover:bg-accent-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95"
                  >
                    <Stack size={18} weight="bold" />
                    Save Deck to Library
                  </button>
                )}
                <button 
                  onClick={finishSession}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm bg-emerald-500 hover:bg-emerald-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95"
                >
                  <CheckCircle size={18} weight="bold" />
                  Finish Study Session
                </button>
              </div>
            )}
            
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FlashcardStudyModal;
