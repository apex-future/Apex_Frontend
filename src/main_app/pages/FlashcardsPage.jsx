import React from 'react';
import { Stack, Sparkle, Plus } from '@phosphor-icons/react';

function FlashcardsPage() {
  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-5 md:p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-5 sm:mb-6 md:mb-8 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary tracking-tight font-sans flex items-center gap-2 sm:gap-3">
            <Stack size={24} weight="fill" className="text-accent-primary flex-shrink-0 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            Study Decks
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Master your knowledge with AI-generated flashcards.</p>
        </div>
        
        {/* Placeholder for future "Create Deck" button */}
        <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-text-primary text-bg-elevated rounded-xl font-bold text-xs sm:text-sm hover:scale-105 transition-all shadow-sm flex-shrink-0">
          <Plus size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden xs:inline">Create</span> Deck
        </button>
      </div>

      {/* Main Content Area */}
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
      
    </div>
  );
}

export default FlashcardsPage;
