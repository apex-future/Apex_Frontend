import React, { useContext } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BookContext } from "../../../context/BookContextInstance"
import Shelf from './Shelf'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  const navigate = useNavigate();
  const { shelves } = useContext(BookContext);

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

          <h3 className='text-xl font-bold font-display text-text-primary'>Book Shelf</h3>

          <div className="w-10" />
        </div>
      </div>

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf