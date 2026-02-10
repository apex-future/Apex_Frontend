import React from 'react'
import dummyBook from "../../../assets/book_covers/book-cover1.jpg"
function Header() {
  return (
    <div className=''>
        <div className='w-full p-5'>
            <h2>Last Read</h2>
            <img src={dummyBook} alt="" className='h-32' />
            <div className="content">

            </div>
        </div>
    </div>
  )
}

export default Header