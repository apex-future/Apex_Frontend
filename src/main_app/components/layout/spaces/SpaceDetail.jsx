import React, { useContext, useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, Clock, FileText, Calendar, X, Check, Trophy } from '@phosphor-icons/react';
import { BookContext } from "../../../context/BookContextInstance"
import useSpaceStore from '../../../store/spaceStore'
import useStudyStore from '../../../store/studyStore'
import BookCard from '../../books/BookCard'
import BookCover from '../../books/BookCover'
import useQuizStore from '../../../store/quizStore'

import SpaceAnalytics from './SpaceAnalytics'

/**
 * ShelfDetail Page:
 * Displays the list of books in a specific shelf.
 */
function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { shelves = [], books = [], handleBookClick } = useContext(BookContext) || {};
  const { addBookToSpace, setActiveSpace, updateSpace } = useSpaceStore();
  const { exams, examDate: globalExamDate, examName: globalExamName, setExamDate: setGlobalExamDate } = useStudyStore();
  const { getAggregatedStatsForSpace } = useQuizStore();
  const spaceQuizStats = getAggregatedStatsForSpace(spaceId);
  const [isAddingBooks, setIsAddingBooks] = useState(false);
  const [selectedBooksToAdd, setSelectedBooksToAdd] = useState([]);
  const [activeTab, setActiveTab] = useState('books');

  useEffect(() => {
    setActiveSpace(spaceId);
  }, [spaceId, setActiveSpace]);

  // Find the selected space from context
  const selectedShelf = useMemo(() => {
    return shelves?.find(s => s.id === spaceId);
  }, [shelves, spaceId]);

  // Find linked exam
  const linkedExam = useMemo(() => {
    if (!selectedShelf?.examDate) return null;
    // Check multi-exams
    const multiMatch = exams.find(e => e.date === selectedShelf.examDate);
    if (multiMatch) return multiMatch;
    // Check legacy fallback
    if (globalExamDate === selectedShelf.examDate) {
        return { name: globalExamName || 'Upcoming Exam', date: globalExamDate };
    }
    return null;
  }, [exams, selectedShelf?.examDate, globalExamDate, globalExamName]);

  if (!selectedShelf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h3 className="text-xl font-bold text-text-primary mb-2">Space Not Found</h3>
        <p className="text-text-tertiary mb-6">The study space you're looking for doesn't exist.</p>
        <button 
          onClick={() => navigate('/spaces')}
          className="px-6 py-2 bg-accent-primary text-white rounded-full hover:bg-accent-pressed transition-colors"
        >
          Back to Book Spaces
        </button>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen pb-20'>
      {/* Page Header - Matching BookSpaces style */}
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

          <div className="px-5 py-2.5 rounded-[20px] bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-center flex flex-col items-center">
            <h3 className='text-base font-bold font-display text-text-primary'>{selectedShelf.name}</h3>
            <div className="flex items-center gap-3 mt-1">
               <p className="text-xs text-text-tertiary font-medium">{selectedShelf.books?.length || 0} {selectedShelf.books?.length === 1 ? 'book' : 'books'}</p>
               {linkedExam && (
                   <div 
                     className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-accent-primary/10 text-accent-primary px-2.5 py-1 rounded-full border border-accent-primary/20"
                   >
                     <Calendar size={10} weight="bold" />
                     <span>{linkedExam.name} <span className="mx-0.5 opacity-40">•</span> {new Date(linkedExam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                   </div>
               )}
            </div>
          </div>

          {!selectedShelf.isSystem ? (
            <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <button
                onClick={() => setIsAddingBooks(true)}
                className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-accent-primary rounded-full transition-all flex items-center justify-center"
                title="Add Books to Space"
              >
                <Plus size={20} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="w-[42px]" />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="w-[90%] mx-auto mt-6">
          <div className="mx-auto w-full">
              <ul className="flex gap-2 overflow-x-auto py-2 bg-card-glass/60 dark:bg-bg-dark-elevated/60 backdrop-blur-md px-2.5 rounded-full items-center no-scrollbar border border-border-default/20 dark:border-border-default-dark/20 shadow-sm">
                  <li
                      onClick={() => setActiveTab('books')}
                      className={`text-base font-medium transition-all p-2 px-4 rounded-full cursor-pointer whitespace-nowrap
                          ${activeTab === 'books'
                              ? 'text-accent-primary dark:text-accent-primary-dark bg-accent-subtle dark:bg-accent-subtle-dark hover:border border-accent-hover dark:border-accent-hover-dark'
                              : 'text-text-primary dark:text-text-primary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark hover:bg-neutral-50 dark:hover:bg-bg-dark-elevated'
                          }`}
                  >
                      Books
                  </li>
                  <li
                      onClick={() => setActiveTab('analytics')}
                      className={`text-base font-medium transition-all p-2 px-4 rounded-full cursor-pointer whitespace-nowrap
                          ${activeTab === 'analytics'
                              ? 'text-accent-primary dark:text-accent-primary-dark bg-accent-subtle dark:bg-accent-subtle-dark hover:border border-accent-hover dark:border-accent-hover-dark'
                              : 'text-text-primary dark:text-text-primary-dark hover:text-text-secondary dark:hover:text-text-secondary-dark hover:bg-neutral-50 dark:hover:bg-bg-dark-elevated'
                          }`}
                  >
                      Analytics
                  </li>
              </ul>
              
              <div className="selected-section mt-4 min-h-[400px]">
                  {activeTab === 'books' && (
                    <div className="w-full">
                      {/* Add Books Inline UI */}
                      {isAddingBooks && (
                        <div className="w-full p-6 sm:p-8 mb-8 bg-surface-sunken border-t border-border-default rounded-card shadow-aura-sm animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex justify-between items-center mb-6 px-1">
                             <h3 className="text-lg font-black text-text-primary tracking-tight">Select Books to Add</h3>
                             <button 
                               onClick={() => { setIsAddingBooks(false); setSelectedBooksToAdd([]); }} 
                               className="p-2 hover:bg-red-500/10 hover:text-red-500 text-text-tertiary rounded-xl transition-all"
                             >
                               <X size={20} weight="bold" />
                             </button>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar py-4 px-1">
                            {books.filter(b => !selectedShelf.bookIds?.includes(b.id)).map(book => {
                              const isSelected = selectedBooksToAdd.includes(book.id);
                              return (
                                <div 
                                  key={book.id} 
                                  className={`flex-shrink-0 w-28 relative cursor-pointer transition-all duration-300 hover:scale-110 rounded-lg border-2 bg-bg-elevated ${isSelected ? 'border-accent-primary shadow-lg shadow-accent-primary/20' : 'border-transparent'}`}
                                  onClick={() => {
                                    setSelectedBooksToAdd(prev => isSelected ? prev.filter(id => id !== book.id) : [...prev, book.id]);
                                  }}
                                >
                                  <div className="w-full h-36 rounded-md shadow-sm border border-border-default overflow-hidden relative">
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
                              );
                            })}
                            {books.filter(b => !selectedShelf.bookIds?.includes(b.id)).length === 0 && (
                              <div className="w-full py-8 text-center bg-bg-subtle/50 rounded-2xl border-2 border-dashed border-border-default">
                                <p className="text-sm font-bold text-text-tertiary italic">No more books available to add.</p>
                              </div>
                            )}
                          </div>
                          
                          {selectedBooksToAdd.length > 0 && (
                            <div className="flex justify-end mt-6 pt-6 border-t border-border-default/50">
                              <button 
                                onClick={async () => {
                                  for (const id of selectedBooksToAdd) {
                                    await addBookToSpace(selectedShelf.id, id);
                                  }
                                  setSelectedBooksToAdd([]);
                                  setIsAddingBooks(false);
                                }}
                                className="px-8 py-3 bg-accent-primary text-white font-bold rounded-2xl shadow-xl shadow-accent-primary/20 hover:bg-accent-pressed active:scale-95 transition-all"
                              >
                                Add {selectedBooksToAdd.length} {selectedBooksToAdd.length === 1 ? 'Book' : 'Books'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Books List GridFour */}
                      <div className="w-full">
                        {selectedShelf.books?.length > 0 ? (
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,350px),1fr))] gap-6 lg:gap-8 transition-all duration-300">
                            {selectedShelf.books.map((book) => (
                              <BookCard 
                                key={book.id} 
                                book={book} 
                                onClick={(id) => {
                                   if (handleBookClick) handleBookClick(id);
                                   navigate(`/reader/${id}`);
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-bg-subtle rounded-full flex items-center justify-center mb-6 border border-border-default">
                              <BookOpen className="text-text-tertiary" size={40} weight="fill" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Empty Space</h3>
                            <p className="text-text-tertiary mt-2 max-w-sm">No books in this collection yet. Click the + button above to add books to this space.</p>
                            <button 
                              onClick={() => navigate('/')}
                              className="mt-8 px-6 py-2 border-2 border-accent-primary text-accent-primary rounded-full hover:bg-accent-primary hover:text-white transition-all font-medium"
                            >
                              Discover Books
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                      <SpaceAnalytics space={selectedShelf} spaceQuizStats={spaceQuizStats} />
                  )}
              </div>
          </div>
      </div>
    </div>
  )
}

export default SpaceDetail
