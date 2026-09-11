import React, { useContext, useState } from 'react'
import { ArrowLeft, Plus, Check, BookOpen, TextT } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom'
import { BookContext } from "../../../context/BookContextInstance"
import Shelf from './Shelf'
import BookCover from '../../ui/BookCover'
import Modal from '../../ui/Modal'
import EmptyState from '../../ui/EmptyState'
import useSpaceStore from '../../../store/spaceStore'
import { showToastGlobal } from '../../../hooks/useToast'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  const navigate = useNavigate();
  const { shelves = [], books = [] } = useContext(BookContext) || {};
  const { createSpace, addBookToSpace } = useSpaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);

  const handleCreateSpace = async (e) => {
    if (e) e.preventDefault();
    if (!newSpaceName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const spaceName = newSpaceName.trim();
      const spaceId = await createSpace(spaceName);
      for (const id of selectedBooks) {
        await addBookToSpace(spaceId, id);
      }

      setNewSpaceName('');
      setSelectedBooks([]);
      setIsCreating(false);
      showToastGlobal(`Created "${spaceName}"!`, "success");
      navigate(`/space/${spaceId}`);
    } catch (err) {
      console.error('Failed to create space:', err);
      showToastGlobal("Failed to create book space", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='w-full'>
      {/* Page Header - Glassmorphic with Dark Adaptation */}
      <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary rounded-full transition-all group flex items-center justify-center"
            >
              <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-1 transition-transform text-text-primary" />
            </button>
          </div>

          <div className="px-5 py-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <h3 className='text-base md:text-lg font-bold font-display text-text-primary'>Book Spaces</h3>
          </div>

          <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-accent-primary rounded-full transition-all flex items-center justify-center"
              title="Create Space"
            >
              <Plus size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Predefined Design System Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => !isSubmitting && setIsCreating(false)}
        showCloseButton={true}
        maxWidth="max-w-xl"
        title="Create Book Space"
        message="Group your books together to track focused study sessions, quizzes, and exams."
        actions={[
          {
            label: isSubmitting ? 'Creating...' : 'Create Space',
            variant: 'primary',
            disabled: !newSpaceName.trim() || isSubmitting,
            onClick: handleCreateSpace,
          },
          {
            label: 'Cancel',
            variant: 'ghost',
            disabled: isSubmitting,
            onClick: () => setIsCreating(false),
          }
        ]}
      >
        <div className="space-y-6 pt-1 px-1">
          {/* Space Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-0.5">
              Space Name <span className="text-accent-primary font-bold">*Required</span>
            </label>
            <div className="flex bg-bg-subtle dark:bg-bg-dark-elevated border border-border-default rounded-xl px-3.5 py-2.5 items-center gap-2.5 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all group">
              <TextT size={18} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary shrink-0" />
              <input 
                autoFocus
                type="text" 
                value={newSpaceName} 
                onChange={e => setNewSpaceName(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSpaceName.trim()) {
                    e.preventDefault();
                    handleCreateSpace();
                  }
                }}
                placeholder="e.g., JAMB 2026, WAEC Biology, Research" 
                className="w-full bg-transparent outline-none text-sm font-semibold text-text-primary placeholder:text-text-tertiary/40" 
              />
            </div>
          </div>

          {/* Book Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} weight="fill" />
                Add Books Now
              </label>
              {selectedBooks.length > 0 && (
                <span className="text-[10px] font-bold text-accent-primary">
                  {selectedBooks.length} {selectedBooks.length === 1 ? 'book selected' : 'books selected'}
                </span>
              )}
            </div>

            {books.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 custom-scrollbar">
                {books.map(book => {
                  const isSelected = selectedBooks.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBooks(prev => isSelected ? prev.filter(id => id !== book.id) : [...prev, book.id])}
                      className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 select-none ${
                        isSelected 
                          ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-elevated rounded-xl shadow-md shadow-accent-primary/20 scale-[1.02]' 
                          : 'hover:scale-[1.02] active:scale-95'
                      }`}
                      title={book.title}
                    >
                      <BookCover
                        book={book}
                        className="w-24 h-34"
                        badge={isSelected && (
                          <div className="bg-accent-primary text-white rounded-full p-1 shadow-md scale-in-center">
                            <Check size={12} weight="bold" />
                          </div>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No books in library"
                description="You can add books to this space later from your library."
                className="py-6"
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf