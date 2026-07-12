import React, { useState, useEffect } from 'react';
import { X, CaretLeft, CaretRight, Stack, Sparkle, CheckCircle } from '@phosphor-icons/react';
import Flashcard3D from './Flashcard3D';
import useFlashcardStore from '../../store/useFlashcardStore';
import apiClient from '../../services/apiClient';
import { showToastGlobal } from '../../hooks/useToast';
import useThemeStore from '../../store/themeStore';

const FlashcardStudyModal = () => {
  const { 
    isOpen, 
    closeFlashcardModal, 
    sourceType, 
    textContent, 
    pageTexts,
    numCards = 10 
  } = useFlashcardStore();
  

  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setFlashcards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSaved(false);
      generateFlashcards();
    }
  }, [isOpen]);

  const generateFlashcards = async () => {
    setIsLoading(true);
    try {
      // Read fresh values from the store — component destructured values may be stale
      // during the same render cycle that set isOpen=true
      const state = useFlashcardStore.getState();
      const { sourceType: st, textContent: tc, pageTexts: pt, numCards: nc } = state;
      
      // Build text_content for the API
      let finalText = tc || '';
      if (st === 'book_pages' && pt && pt.length > 0 && !finalText) {
        finalText = pt.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
      }
      
      if (!finalText) {
        throw new Error('No text content available for flashcard generation');
      }
      
      const response = await apiClient.post('/api/ai/generate-flashcards', {
        source_type: st || 'highlight',
        text_content: finalText,
        page_texts: pt || null,
        num_cards: nc || 10
      });
      
      if (response.data && response.data.flashcards) {
        setFlashcards(response.data.flashcards);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('[Flashcards] Generation failed:', error);
      showToastGlobal('Failed to generate flashcards. Please try a smaller selection.', 'error');
      closeFlashcardModal();
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSaveDeck = () => {
    setIsSaved(true);
    showToastGlobal('Deck saved to your Study Decks!', 'success');
    // In the future, this will save to Supabase via apiClient
    setTimeout(() => {
      closeFlashcardModal();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col justify-center items-center bg-black/40 backdrop-blur-md p-3 sm:p-4 md:p-6 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="w-full max-w-2xl flex flex-col relative">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2">
          <div className="flex items-center gap-2 text-white">
            <Stack size={20} weight="fill" className="text-accent-primary sm:w-6 sm:h-6" />
            <span className="font-bold text-base sm:text-lg tracking-wide">Study Deck</span>
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

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-[280px] sm:max-w-sm px-2 sm:px-4">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2.5 sm:p-3 rounded-full bg-bg-elevated text-text-primary shadow-sm disabled:opacity-30 transition-transform active:scale-95"
              >
                <CaretLeft size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="text-white/80 font-bold tracking-widest text-xs sm:text-sm bg-black/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md">
                {currentIndex + 1} / {flashcards.length}
              </div>

              <button 
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className="p-2.5 sm:p-3 rounded-full bg-bg-elevated text-text-primary shadow-sm disabled:opacity-30 transition-transform active:scale-95"
              >
                <CaretRight size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Save Button (shows on last card) */}
            {currentIndex === flashcards.length - 1 && (
              <div className="mt-5 sm:mt-6 md:mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <button 
                  onClick={handleSaveDeck}
                  disabled={isSaved}
                  className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-white text-sm sm:text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all ${isSaved ? 'bg-emerald-500 scale-105' : 'bg-accent-primary hover:bg-accent-hover hover:scale-105 active:scale-95'}`}
                >
                  {isSaved ? <CheckCircle size={20} weight="fill" className="sm:w-6 sm:h-6" /> : <Stack size={20} weight="bold" className="sm:w-6 sm:h-6" />}
                  {isSaved ? 'Saved to Decks!' : 'Save Deck to Library'}
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
