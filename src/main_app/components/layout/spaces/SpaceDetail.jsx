import React, { useContext, useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, Clock, FileText, Calendar } from 'lucide-react'
import { BookContext } from "../../../context/BookContextInstance"
import useSpaceStore from '../../../store/spaceStore'
import useStudyStore from '../../../store/studyStore'
import BookCard from '../../books/BookCard'
import BookCover from '../../books/BookCover'
import useQuizStore from '../../../store/quizStore'
import { Trophy } from 'lucide-react'

/**
 * ShelfDetail Page:
 * Displays the list of books in a specific shelf.
 */
function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { shelves, books, handleBookClick } = useContext(BookContext);
  const { addBookToSpace, setActiveSpace, updateSpace } = useSpaceStore();
  const { examDate: globalExamDate, setExamDate: setGlobalExamDate } = useStudyStore();
  const { getAggregatedStatsForSpace } = useQuizStore();
  const spaceQuizStats = getAggregatedStatsForSpace(spaceId);
  const [isAddingBooks, setIsAddingBooks] = useState(false);
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [tempExamDate, setTempExamDate] = useState('');

  useEffect(() => {
    setActiveSpace(spaceId);
  }, [spaceId, setActiveSpace]);

  // Find the selected space from context
  const selectedShelf = useMemo(() => {
    return shelves?.find(s => s.id === spaceId);
  }, [shelves, spaceId]);

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
      {/* Page Header */}
      <div className="relative flex justify-between items-center p-4 border-b border-border-default bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center flex flex-col items-center">
          <h3 className='text-lg font-semibold text-text-primary'>{selectedShelf.name}</h3>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-xs text-text-tertiary">{selectedShelf.books?.length || 0} {selectedShelf.books?.length === 1 ? 'book' : 'books'}</p>
             {!selectedShelf.isSystem && (
                 <div 
                   onClick={() => { setIsEditingExam(true); setTempExamDate(selectedShelf.examDate || globalExamDate || ''); }}
                   className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded cursor-pointer hover:bg-accent-primary/20 transition-colors"
                 >
                   <Calendar size={10} />
                   {selectedShelf.examDate ? `${new Date(selectedShelf.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Link Exam'}
                 </div>
             )}
          </div>
        </div>

        {!selectedShelf.isSystem ? (
          <button
            onClick={() => setIsAddingBooks(true)}
            className="p-2 hover:bg-accent-primary/10 text-accent-primary rounded-xl transition-all"
            title="Add Books to Space"
          >
            <Plus size={20} />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Edit Exam Date Inline UI */}
      {isEditingExam && (
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-border-default rounded-2xl shadow-sm flex items-center justify-between gap-4">
               <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-text-tertiary uppercase mb-1">Set Exam Date for {selectedShelf.name}</span>
                  <input 
                     type="date" 
                     value={tempExamDate}
                     onChange={(e) => setTempExamDate(e.target.value)}
                     className="bg-neutral-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
               </div>
               <div className="flex gap-2">
                  <button 
                     onClick={() => setIsEditingExam(false)}
                     className="px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={() => {
                        updateSpace(selectedShelf.id, { examDate: tempExamDate, isLinkedToExam: true });
                        setGlobalExamDate(tempExamDate); // Also sync globally for dashboard
                        setIsEditingExam(false);
                     }}
                     className="px-4 py-2 text-sm font-bold bg-accent-primary text-white rounded-xl hover:bg-accent-pressed"
                  >
                     Save Link
                  </button>
               </div>
            </div>
         </div>
      )}

       {/* Activity Summary Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
         <div className="bg-card-glass backdrop-blur-md border border-border-default rounded-3xl p-6 flex flex-wrap gap-8 justify-between lg:justify-start lg:gap-16 items-center shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-1">Total Time Spent</h2>
              <div className="flex items-center gap-2">
                 <Clock size={20} className="text-accent-primary" />
                 <span className="text-2xl font-black text-text-primary">{selectedShelf.activitySummaries?.timeSpent || 0} min</span>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-1">Pages Read</h2>
              <div className="flex items-center gap-2">
                 <FileText size={20} className="text-accent-primary" />
                 <span className="text-2xl font-black text-text-primary">{selectedShelf.activitySummaries?.pagesRead || 0}</span>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-1">Avg Quiz Score</h2>
              <div className="flex items-center gap-2">
                 <Trophy size={20} className="text-accent-primary" />
                 <span className="text-2xl font-black text-text-primary">{spaceQuizStats ? `${spaceQuizStats.averageScore}%` : 'N/A'}</span>
              </div>
            </div>
         </div>
      </div>

      {/* Add Books Inline UI */}
      {isAddingBooks && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-border-default">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-text-primary">Select Books to Add</h3>
             <button onClick={() => setIsAddingBooks(false)} className="text-sm font-semibold text-text-tertiary hover:text-text-primary">Close</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {books.filter(b => !selectedShelf.bookIds?.includes(b.id)).map(book => (
              <div key={book.id} className="flex-shrink-0 w-32 cursor-pointer transition-transform hover:scale-105" onClick={() => {
                 addBookToSpace(selectedShelf.id, book.id);
                 setIsAddingBooks(false);
              }}>
                <div className="w-full h-40 rounded shadow border border-border-default overflow-hidden relative">
                   {book.cover ? (
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                   ) : (
                      <BookCover title={book.title} author={book.author} className="w-full h-full" />
                   )}
                </div>
                <p className="text-xs font-semibold mt-2 truncate">{book.title}</p>
              </div>
            ))}
            {books.filter(b => !selectedShelf.bookIds?.includes(b.id)).length === 0 && (
              <p className="text-sm text-text-tertiary">No more books available to add.</p>
            )}
          </div>
        </div>
      )}

      {/* Books List Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6 border border-border-default">
              <BookOpen className="text-text-tertiary" size={40} />
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
  )
}

export default SpaceDetail
