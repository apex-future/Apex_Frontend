import React, { useContext } from 'react'
import { BookContext } from "../../../context/BookContext"

function Shelf() {
  const { books } = useContext(BookContext);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4'>
        {books.map(book => (
          <div key={book.id} className='border-2 border-border-default rounded-2xl p-5 hover:border-text-tertiary transition-all'>
            <div className="flex gap-4">
              <img src={book.cover} alt={book.title} className="w-20 h-28 object-cover rounded-lg shadow-sm" />
              <div>
                <h4 className="font-semibold">{book.title}</h4>
                <p className="text-sm text-gray-500">{book.author}</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-accent-primary h-1 rounded-full" style={{ width: `${book.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}

export default Shelf