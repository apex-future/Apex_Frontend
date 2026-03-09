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
      {/* Page Header */}
      <div className="relative flex justify-between items-center p-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowLeft size={20} />
        </button>

        <h3 className='text-lg font-semibold text-text-primary'>Book Shelf</h3>

        <div className="w-9" />
      </div>

      {/* Shelves List */}
      <div className="flex mx-auto flex-col w-[90%] gap-8 py-4 pb-10">
        <Shelf shelves={shelves} />
      </div>
    </div>
  )
}

export default BookShelf