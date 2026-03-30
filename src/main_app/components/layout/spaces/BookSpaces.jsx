import React, { useContext, useState } from 'react'
import { ArrowLeft, Plus, X, Calendar, Check, BookOpen, Quote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookContext } from "../../../context/BookContextInstance"
import Shelf from './Shelf'
import BookCover from '../../books/BookCover'
import useSpaceStore from '../../../store/spaceStore'
import useStudyStore from '../../../store/studyStore'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  const navigate = useNavigate();
  const { shelves, books } = useContext(BookContext);
  const { createSpace, addBookToSpace } = useSpaceStore();
  const { setExamDate: setGlobalExamDate } = useStudyStore();
  const [isCreating, setIsCreating] = useState(false);
  
  // Modal State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [newSpaceExam, setNewSpaceExam] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);

  const handleCreateSpace = (e) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      const spaceId = createSpace(newSpaceName.trim(), newSpaceDesc.trim(), newSpaceExam || null);
      if (newSpaceExam) setGlobalExamDate(newSpaceExam);
      selectedBooks.forEach(id => addBookToSpace(spaceId, id));

      setNewSpaceName('');
      setNewSpaceDesc('');
      setNewSpaceExam('');
      setSelectedBooks([]);
      setIsCreating(false);
      navigate(`/space/${spaceId}`);
    }
  };

  return (
    <div className='w-full'>
      {/* Page Header - Glassmorphic with Dark Adaptation */}
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated text-text-secondary rounded-xl transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          <h3 className='text-xl font-bold font-display text-text-primary'>Book Spaces</h3>

          <button
            onClick={() => setIsCreating(true)}
            className="p-2 hover:bg-accent-primary/10 text-accent-primary rounded-xl transition-all"
            title="Create Space"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Advanced Create Space Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/40 backdrop-blur-md transition-opacity">
          <div className="bg-white dark:bg-card-glass dark:backdrop-blur-xl border border-border-default rounded-3xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto overflow-x-hidden flex flex-col">
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur pb-2 pt-6 px-6 sm:px-8 border-b border-border-default flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold font-display text-text-primary">Create Book Space</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-bg-dark-elevated rounded-full transition-colors">
                <X size={24} className="text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="flex flex-col gap-6 p-6 sm:px-8 bg-neutral-50/50 dark:bg-transparent">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block tracking-wider">Space Name *</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="e.g., JAMB 2026, WAEC Biology"
                    className="w-full px-4 py-3 rounded-xl border border-border-default bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary placeholder:text-text-placeholder font-medium shadow-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block tracking-wider flex items-center gap-1.5"><Quote size={12} /> Description</label>
                    <input
                      type="text"
                      value={newSpaceDesc}
                      onChange={(e) => setNewSpaceDesc(e.target.value)}
                      placeholder="Short focus goal..."
                      className="w-full px-4 py-3 rounded-xl border border-border-default bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary placeholder:text-text-placeholder font-medium shadow-sm transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Exam Date</label>
                    <input
                      type="date"
                      value={newSpaceExam}
                      onChange={(e) => setNewSpaceExam(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border-default bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary shadow-sm transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border-default">
                <label className="text-xs font-bold text-text-tertiary uppercase mb-3 block tracking-wider flex items-center gap-1.5"><BookOpen size={12} /> Add Books Now</label>
                {books.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-1 px-1">
                    {books.map(book => {
                      const isSelected = selectedBooks.includes(book.id);
                      return (
                        <div 
                          key={book.id} 
                          onClick={() => setSelectedBooks(prev => isSelected ? prev.filter(id => id !== book.id) : [...prev, book.id])}
                          className={`flex-shrink-0 w-24 relative cursor-pointer transition-all duration-300 hover:scale-105 rounded-lg border-2 bg-white dark:bg-zinc-800 ${isSelected ? 'border-accent-primary shadow-md shadow-accent-primary/20' : 'border-transparent shadow-sm'}`}
                        >
                          <div className="w-full h-32 rounded shadow-sm border border-neutral-100 dark:border-zinc-700 overflow-hidden relative">
                            {book.cover ? (
                               <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                               <BookCover title={book.title} author={book.author} className="w-full h-full" />
                            )}
                          </div>
                          
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-accent-primary text-white rounded-full p-1 shadow-md scale-in-center">
                              <Check size={14} strokeWidth={4} />
                            </div>
                          )}
                          <p className="text-[10px] font-semibold mt-2 truncate px-1 pb-1">{book.title}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white dark:bg-zinc-900 border border-border-default border-dashed rounded-xl">
                    <p className="text-sm text-text-tertiary italic">No books in your library yet.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-border-default flex justify-end gap-3 sticky bottom-0 bg-neutral-50/90 dark:bg-transparent pb-6 -mb-6 px-1">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2.5 border-2 border-border-default rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 font-semibold text-text-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!newSpaceName.trim()} className="px-8 py-2.5 bg-accent-primary hover:bg-accent-pressed text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf