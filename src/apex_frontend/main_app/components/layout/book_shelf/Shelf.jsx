import React from 'react'

/**
 * Shelf Component:
 * Now a stateless presentation component that renders a specific list of books passed via props.
 * This allows it to be reused for different shelves within the BookShelf view.
 */
function Shelf({ shelves }) {
  // If no books are provided, don't render anything
  if (!shelves || shelves.length === 0) return null;
console.log(shelves)
  return (
    // Grid: Displays the passed list of books in a 2-column layout
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4'>
        {shelves.map((shelf,index) => (
              <div key={index} className='border-2 flex flex-col border-border-default p-4 rounded-2xl bg-gradient-to-br from-neutral-100/80 to-neutral-50/40 backdrop-blur-md'>
                <div className='shelf-things border-b flex flex-col'>
                  <div className="shelf-img flex gap-2 items-center justify-center">

{shelf.books?.slice(0, 3).map((book, index) => (
  <img 
    key={index} 
    src={book.cover} 
    alt={book.title} 
    className='object-cover w-24 h-32 rounded-sm shadow-sm' 
  />
))}

                   
                    {/* <img src={shelf.books[1].cover} alt={shelf.books[0].title} className='object-cover w-24 h-32' />
                    <img src={shelf.books[2].cover} alt={shelf.books[0].title} className='object-cover w-24 h-32' /> */}
                  </div>
                  <div className="shelf-info">
                    <h5>Total Books</h5>
                    <p>{shelf.books.length}</p>
                  </div>
                </div>
                <h3 className='text-center font-display text-xl pt-2'>{shelf.shelfName}</h3>
            </div >
        ))}
    </div>
  )
}

export default Shelf