import React, { useState, useEffect } from 'react';
import { Stack, Sparkle, Plus, Cards, Trash, BookOpen, Clock } from '@phosphor-icons/react';
import db from '../db/apex.db';
import { showToastGlobal } from '../hooks/useToast';

function FlashcardsPage() {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDecks = async () => {
    setIsLoading(true);
    try {
      const allDecks = await db.study_decks.toArray();
      const decksWithCounts = await Promise.all(allDecks.map(async (deck) => {
        const count = await db.flashcards.where('deckId').equals(deck.local_id).count();
        return { ...deck, count };
      }));
      setDecks(decksWithCounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
      console.error('Failed to load decks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this deck?")) {
      try {
        await db.study_decks.where('local_id').equals(deckId).delete();
        await db.flashcards.where('deckId').equals(deckId).delete();
        showToastGlobal('Deck deleted', 'success');
        loadDecks();
      } catch (err) {
        showToastGlobal('Failed to delete deck', 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-5 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-300 overflow-y-auto pb-32">
      
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-5 sm:mb-6 md:mb-8 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary tracking-tight font-sans flex items-center gap-2 sm:gap-3">
            <Stack size={24} weight="fill" className="text-accent-primary flex-shrink-0 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            Study Decks
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Master your knowledge with AI-generated flashcards.</p>
        </div>
        
        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-text-primary text-bg-elevated rounded-xl font-bold text-xs sm:text-sm hover:scale-105 transition-all shadow-sm flex-shrink-0 active:scale-95">
          <Plus size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden xs:inline">Create</span> Deck
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : decks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-2xl sm:rounded-3xl bg-bg-subtle/30 p-6 sm:p-8 md:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-sm">
            <Sparkle size={28} weight="fill" className="text-accent-primary animate-pulse sm:w-8 sm:h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-2 sm:mb-3">No Decks Yet</h2>
          <p className="text-text-secondary max-w-md mx-auto mb-5 sm:mb-6 md:mb-8 leading-relaxed text-sm sm:text-base">
            Generate flashcards instantly from your books, notes, or highlights. Open a book or note and select text to create your first deck.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
            <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-bg-elevated rounded-xl sm:rounded-2xl shadow-sm border border-border-default/50 text-left">
              <span className="text-[10px] sm:text-xs font-bold text-accent-primary uppercase tracking-wider">From Reader</span>
              <span className="text-xs sm:text-sm text-text-primary font-medium">Highlight text in a book to generate flashcards.</span>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-bg-elevated rounded-xl sm:rounded-2xl shadow-sm border border-border-default/50 text-left">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider">From Notes</span>
              <span className="text-xs sm:text-sm text-text-primary font-medium">Select your notes in the editor to make a study deck.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {decks.map(deck => (
            <div key={deck.local_id} className="relative group bg-bg-elevated rounded-[1.5rem] p-5 border border-border-default hover:border-accent-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[160px] cursor-pointer active:scale-[0.98]">
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleDeleteDeck(deck.local_id, e)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-text-primary mb-2 line-clamp-2 pr-8">{deck.title}</h3>
                <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                  <Clock size={14} weight="bold" className="text-text-tertiary" />
                  {formatDate(deck.createdAt)}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border-default/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
                    <Cards size={16} weight="fill" className="text-accent-primary" />
                  </div>
                  <span className="font-bold text-sm text-text-primary">{deck.count} <span className="text-text-tertiary font-medium">Cards</span></span>
                </div>
                
                <button className="px-4 py-1.5 bg-text-primary text-bg-primary font-bold text-xs rounded-full hover:bg-accent-primary hover:text-white transition-colors">
                  Study
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}

export default FlashcardsPage;
