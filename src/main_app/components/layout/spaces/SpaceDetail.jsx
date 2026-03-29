import React, { useContext, useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Plus, Clock, FileText } from 'lucide-react'
import { BookContext } from "../../../context/BookContextInstance"
import useSpaceStore from '../../../store/spaceStore'
import BookCard from '../../books/BookCard'

/**
 * ShelfDetail Page:
 * Displays the list of books in a specific shelf.
 */
function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { shelves, books } = useContext(BookContext);
  const { addBookToSpace, setActiveSpace } = useSpaceStore();
  const [isAddingBooks, setIsAddingBooks] = useState(false);

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

        <div className="text-center">
          <h3 className='text-lg font-semibold text-text-primary'>{selectedShelf.name}</h3>
          <p className="text-xs text-text-tertiary">{selectedShelf.books?.length || 0} {selectedShelf.books?.length === 1 ? 'book' : 'books'}</p>
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

      {/* Activity Summary Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
         <div className="bg-card-glass backdrop-blur-md border border-border-default rounded-3xl p-6 flex justify-between items-center shadow-sm">
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
                <img src={book.cover} alt={book.title} className="w-full h-40 object-cover rounded shadow border border-white/10" />
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
              <BookCard key={book.id} book={book} />
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
