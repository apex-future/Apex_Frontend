import { Home, Plus, User } from 'lucide-react'
import React from 'react'

function BottomNavBar() {
  return (
    <div className='fixed bottom-5 left-0 right-0 flex justify-between w-[60%] mx-auto min-h-10 border border-[#E5E5E5] bg-white/60 backdrop-blur-md rounded-full items-center p-2 px-3 shadow-lg'>
        <button className='p-2 hover:bg-neutral-100/50 rounded-full transition-all'>
          <Home size={20} className='text-[#404040]'/>
        </button>
        
        <button className='relative bg-[#8B5CF6] hover:bg-[#7C3AED] size-11 rounded-full shadow-lg transition-all active:scale-95'>
          <Plus className='absolute inset-0 m-auto text-white' size={24} />
        </button>
        
        <button className='p-2 hover:bg-neutral-100/50 rounded-full transition-all'>
          <User size={20} className='text-[#404040]'/>
        </button>
    </div>
  )
}

export default BottomNavBar