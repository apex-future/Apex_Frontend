import React, { useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Plus, X, Calendar, Check, BookOpen, Quotes, TextT } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom'
import { BookContext } from "../../../context/BookContextInstance"
import Shelf from './Shelf'
import BookCover from '../../books/BookCover'
import useSpaceStore from '../../../store/spaceStore'
import useStudyStore from '../../../store/studyStore'
import useThemeStore from '../../../store/themeStore'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  const navigate = useNavigate();
  const { shelves = [], books = [] } = useContext(BookContext) || {};
  const { createSpace, addBookToSpace } = useSpaceStore();
  const { setExamDate: setGlobalExamDate } = useStudyStore();
  const { resolvedTheme } = useThemeStore();
  const [isCreating, setIsCreating] = useState(false);
  
  // Modal State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      const spaceId = await createSpace(newSpaceName.trim());
      for (const id of selectedBooks) {
        await addBookToSpace(spaceId, id);
      }

      setNewSpaceName('');
      setSelectedBooks([]);
      setIsCreating(false);
      navigate(`/space/${spaceId}`);
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

      {/* Advanced Create Space Modal */}
      {isCreating && createPortal(
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-6 overflow-hidden ${resolvedTheme}`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsCreating(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] bg-bg-elevated/95 sm:bg-bg-elevated/90 backdrop-blur-2xl sm:rounded-[2.5rem] border-0 sm:border-2 border-border-default shadow-2xl flex flex-col overflow-hidden animate-in sm:zoom-in-95 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border-default/50">
              <h2 className="text-xl font-black text-text-primary tracking-tight">Create Book Space</h2>
              <button 
                onClick={() => setIsCreating(false)}
                className="p-2.5 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateSpace} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
              <div className="space-y-6">
                {/* Space Name */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Space Name *</label>
                  <div className="flex bg-bg-elevated border-2 border-border-default rounded-2xl px-5 py-4 items-center gap-4 focus-within:border-accent-primary/40 transition-all group shadow-sm">
                    <TextT size={20} weight="bold" className="text-text-tertiary group-focus-within:text-accent-primary" />
                    <input 
                      autoFocus
                      required
                      type="text" 
                      value={newSpaceName} 
                      onChange={e=>setNewSpaceName(e.target.value)} 
                      placeholder="e.g., JAMB 2026, WAEC Biology" 
                      className="w-full bg-transparent outline-none text-sm font-bold text-text-primary" 
                    />
                  </div>
                </div>
              </div>

              {/* Book Selection */}
              <div className="pt-6 border-t border-border-default/50 space-y-4">
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1 flex items-center gap-1.5"><BookOpen size={12} weight="fill" /> Add Books Now</label>
                {books.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-4 px-2">
                    {books.map(book => {
                      const isSelected = selectedBooks.includes(book.id);
                      return (
                        <div 
                          key={book.id} 
                          onClick={() => setSelectedBooks(prev => isSelected ? prev.filter(id => id !== book.id) : [...prev, book.id])}
                          className={`flex-shrink-0 w-28 relative cursor-pointer transition-all duration-300 hover:scale-110 rounded-lg border-2 bg-bg-elevated ${isSelected ? 'border-accent-primary shadow-lg shadow-accent-primary/20' : 'border-border-default shadow-sm'}`}
                        >
                          <div className="w-full h-36 rounded-md shadow-sm overflow-hidden relative">
                            {book.cover ? (
                               <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                               <BookCover title={book.title} author={book.author} className="w-full h-full" />
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-accent-primary text-white rounded-full p-1 shadow-md scale-in-center z-10">
                              <Check size={14} weight="bold" />
                            </div>
                          )}
                          
                          <p className="text-[10px] font-bold mt-2 truncate px-2 pb-2 text-text-secondary">{book.title}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-bg-subtle/50 rounded-3xl border-2 border-dashed border-border-default">
                    <p className="text-sm font-bold text-text-tertiary italic">No books in your library yet.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  type="submit"
                  disabled={!newSpaceName.trim()} 
                  className="w-full sm:flex-[1.5] py-4 font-black text-white bg-accent-primary rounded-3xl disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-accent-primary/40 hover:brightness-110 active:scale-[0.98] transition-all order-1 sm:order-2"
                >
                  Create Space
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)} 
                  className="w-full sm:flex-1 py-4 font-black text-text-secondary bg-bg-elevated hover:bg-bg-subtle transition-all active:scale-95 border-2 border-border-default rounded-3xl order-2 sm:order-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf