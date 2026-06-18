import React from 'react';
import { X, Copy, WarningCircle } from '@phosphor-icons/react';

/**
 * DuplicateBookModal:
 * A premium modal that appears when a user tries to upload a book that already exists.
 */
function DuplicateBookModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl shadow-accent-primary/10 border border-neutral-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner Area */}
        <div className="h-24 bg-gradient-to-br from-accent-primary/10 to-accent-subtle/30 flex items-center justify-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-accent-primary">
            <Copy size={32} weight="fill" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-all text-text-tertiary"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 pt-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <WarningCircle size={16} weight="fill" className="text-accent-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-pressed">Duplicate Found</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-text-primary mb-3">Book already there</h2>
          <p className="text-text-tertiary leading-relaxed mb-8">
            This title is already in your library collection. Would you like to view its details instead?
          </p>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-accent-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Close
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 text-text-tertiary text-sm font-medium hover:text-text-primary transition-colors"
            >
                Stay here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateBookModal;
