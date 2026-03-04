import React, { useContext, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { BookContext } from "../../../context/BookContextInstance"
import BookCard from '../../books/BookCard'

/**
 * ShelfDetail Page:
 * Displays the list of books in a specific shelf.
 */
function ShelfDetail() {
  const { shelfName } = useParams();
  const navigate = useNavigate();
  const { shelves } = useContext(BookContext);

  // Find the selected shelf from context
  const selectedShelf = useMemo(() => {
    return shelves?.find(s => s.shelfName === shelfName);
  }, [shelves, shelfName]);

  if (!selectedShelf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h3 className="text-xl font-bold text-text-primary mb-2">Shelf Not Found</h3>
        <p className="text-text-tertiary mb-6">The shelf you're looking for doesn't exist.</p>
        <button 
          onClick={() => navigate('/bookshelf')}
          className="px-6 py-2 bg-accent-primary text-white rounded-full hover:bg-accent-pressed transition-colors"
        >
          Back to Book Shelf
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
          <h3 className='text-lg font-semibold text-text-primary'>{selectedShelf.shelfName}</h3>
          <p className="text-xs text-text-tertiary">{selectedShelf.books?.length || 0} {selectedShelf.books?.length === 1 ? 'book' : 'books'}</p>
        </div>

        <div className="w-9" />
      </div>

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
            <h3 className="text-xl font-bold text-text-primary">Empty Shelf</h3>
            <p className="text-text-tertiary mt-2 max-w-sm">No books in this collection yet. Start adding books to see them here.</p>
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

export default ShelfDetail
