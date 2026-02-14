import { Home, Plus, User } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

function BottomNavBar() {
  return (
    <div className='fixed bottom-5 left-0 right-0 flex justify-between w-[60%] mx-auto min-h-10 border border-[#E5E5E5] bg-white/60 backdrop-blur-md rounded-full items-center p-2 px-3 shadow-lg'>
        <NavLink 
          to="/" 
          className={({ isActive }) => `p-2 hover:bg-neutral-100/50 rounded-full transition-all relative flex flex-col items-center group`}
        >
          {({ isActive }) => (
            <>
              <Home size={20} className={isActive ? 'text-accent-primary' : 'text-[#404040]'}/>
              {isActive && (
                <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full" />
              )}
            </>
          )}
        </NavLink>
        
        <button className='relative bg-accent-primary hover:bg-accent-hover size-11 rounded-full shadow-lg transition-all active:scale-95'>
          <Plus className='absolute inset-0 m-auto text-white' size={24} />
        </button>
        
        <NavLink 
          to="/profile"
          className={({ isActive }) => `p-2 hover:bg-neutral-100/50 rounded-full transition-all relative flex flex-col items-center group`}
        >
          {({ isActive }) => (
            <>
              <User size={20} className={isActive ? 'text-accent-primary' : 'text-[#404040]'}/>
              {isActive && (
                <div className="absolute -bottom-1 w-5 h-0.5 bg-accent-primary rounded-full" />
              )}
            </>
          )}
        </NavLink>
    </div>
  )
}

export default BottomNavBar