import { Home, Plus, User } from 'lucide-react'
import React from 'react'

function BottomNavBar() {
  return (
    <div className='fixed bottom-5 left-0 right-0 flex justify-between w-[60%] mx-auto min-h-10 border-2 border-subtle bg-gray-300 backdrop-blur-md rounded-full items-center p-2 px-3'>
        <Home className=''/>
        <div className='relative bg-accent-primary size-10 rounded-full'>
   <Plus className='  text-white rounded-full p-2 text-xl' size={40}  />
        </div>
     <User className=''/>
    </div>
  )
}

export default BottomNavBar