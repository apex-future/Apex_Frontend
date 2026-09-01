import React from 'react';
import { Brain, Cards, CaretRight } from '@phosphor-icons/react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function TestKnowledgeModal({
  isOpen,
  onClose,
  onSelectQuiz,
  onSelectFlashcards,
  trackedPages = [],
}) {
  if (!isOpen) return null;

  // Format tracked pages summary (e.g. "Pages 1, 2, 3" or "Page 4")
  const sortedPages = [...new Set(trackedPages)].sort((a, b) => a - b);
  const pagesText = sortedPages.length === 0
    ? 'Current page'
    : sortedPages.length === 1
      ? `Page ${sortedPages[0]}`
      : sortedPages.length <= 5
        ? `Pages ${sortedPages.join(', ')}`
        : `Pages ${sortedPages.slice(0, 4).join(', ')} +${sortedPages.length - 4} more`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Your Knowledge"
      className="!max-w-md"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Tracked Pages Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-subtle border border-border-default/40 text-xs">
          <span className="text-text-secondary font-medium">Pages read this session</span>
          <span className="font-bold text-accent-primary">{pagesText}</span>
        </div>

        {/* Option 1: AI Quizzes */}
        <Card
          variant="interactive"
          onClick={onSelectQuiz}
          className="p-4 flex items-center gap-3.5 border border-border-default/60 hover:border-accent-primary/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            <Brain size={22} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">AI Quizzes</h3>
              <CaretRight size={14} weight="bold" className="text-text-tertiary" />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 leading-snug">
              MCQ & essay questions auto-generated from your read pages.
            </p>
          </div>
        </Card>

        {/* Option 2: Flashcards */}
        <Card
          variant="interactive"
          onClick={onSelectFlashcards}
          className="p-4 flex items-center gap-3.5 border border-border-default/60 hover:border-accent-primary/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            <Cards size={22} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Flashcards</h3>
              <CaretRight size={14} weight="bold" className="text-text-tertiary" />
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 leading-snug">
              Active recall 3D cards & Quick Setup on your read pages.
            </p>
          </div>
        </Card>

        {/* Red Danger Cancel Button (returns user to summary) */}
        <Button
          variant="danger"
          onClick={onClose}
          className="mt-2 w-full !max-w-none py-3 text-xs font-bold"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
