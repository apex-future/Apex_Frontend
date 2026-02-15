import React, { useContext } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import { BookContext } from "../../../context/BookContext"
import Shelf from './Shelf'
function BookShelf() {
  return (
    <div className='min-h-screen w-full'>
         {/* Navigation */}
        <div className="relative flex justify-between items-center p-4">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <ArrowLeft className='' size={20} />
          </button>
          <h3 className=' text-lg font-semibold'>Book Shelf</h3>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <Settings className='' size={20} />
          </button>
        </div>
        <Shelf />
    </div>
  )
}

export default BookShelf