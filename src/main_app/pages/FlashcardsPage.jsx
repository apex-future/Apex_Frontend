import React from 'react';
import { Stack, Sparkle, Plus } from '@phosphor-icons/react';

function FlashcardsPage() {
  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight font-sans flex items-center gap-3">
            <Stack size={32} weight="fill" className="text-accent-primary" />
            Study Decks
          </h1>
          <p className="text-sm text-text-secondary mt-1">Master your knowledge with AI-generated flashcards.</p>
        </div>
        
        {/* Placeholder for future "Create Deck" button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-elevated rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-sm">
          <Plus size={18} weight="bold" />
          Create Deck
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-3xl bg-bg-subtle/30 p-12 text-center">
        <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Sparkle size={40} weight="fill" className="text-accent-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-3">No Decks Yet</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-8 leading-relaxed">
          Generate flashcards instantly from your books, notes, or highlights. Open a book or note and select text to create your first deck.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          <div className="flex flex-col gap-2 p-4 bg-bg-elevated rounded-2xl shadow-sm border border-border-default/50 text-left">
            <span className="text-xs font-bold text-accent-primary uppercase tracking-wider">From Reader</span>
            <span className="text-sm text-text-primary font-medium">Highlight text in a book to generate flashcards.</span>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-bg-elevated rounded-2xl shadow-sm border border-border-default/50 text-left">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">From Notes</span>
            <span className="text-sm text-text-primary font-medium">Select your notes in the editor to make a study deck.</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default FlashcardsPage;
