import { Home, Plus } from 'lucide-react'
import React from 'react'

function BottomNavBar() {
  return (
    <div className='fixed bottom-5 left-0 right-0 flex justify-center w-[70%] mx-auto min-h-10 shadow-inner shadow-white/70 bg-white/50 backdrop-blur-md rounded-full items-center p-2'>
        <Home />
        <div className='relative'>
   <Plus className='bg-accent-primary absolute top-[-30px] text-white rounded-full p-2 text-xl' size={40}  />
        </div>
     
    </div>
  )
}

export default BottomNavBar