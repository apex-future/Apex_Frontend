import React, { useContext } from 'react'
// Lucide icons for navigation
import { ArrowLeft } from 'lucide-react'
// Consume the 2D shelves array from BookContext
import { BookContext } from "../../../context/BookContext"
// Import the modified Shelf component
import Shelf from './Shelf'

/**
 * BookShelf Page:
 * Displays the entire collection of books organized into separate "shelves" derived from context.
 */
function BookShelf() {
  // Destructure shelves (the 2D array) from context
  const { shelves } = useContext(BookContext);

  return (
    <div className='min-h-screen w-full'>
        {/* Page Header */}
        <div className="relative flex justify-between items-center p-4">
          {/* Back button placeholder */}
          <button className="p-2 hover:bg-neutral-100 rounded-lg transition-all">
            <ArrowLeft size={20} />
          </button>
          
          <h3 className='text-lg font-semibold text-text-primary'>Book Shelf</h3>
          
          {/* Spacer for alignment */}
          <div className="w-9" />
        </div>

        {/* Shelves List: Iterate through the 2D array and render a Shelf component for each child array */}
        <div className="flex flex-col gap-8 pb-10">
         
              <Shelf shelves={shelves} />
    
        
        </div>
    </div>
  )
}


export default BookShelf