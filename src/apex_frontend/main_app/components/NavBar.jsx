import React from 'react'
import { Sparkle,Home,X, Book,Pen,Star,Cog, WholeWord } from 'lucide-react'
function NavBar() {
  return (
    <div className=' w-screen fixed bg-bg-subtle h-screen p-5 '>
        <aside className="navbar-wrapper flex flex-col justify-between h-full">
            <nav className='flex flex-col gap-10'>
            <X />
            <ul className='flex flex-col gap-5'>
                <li className='text-lg font-medium'><a href="#books"><Book className='inline-block pr-1' /> Books</a></li>
                <li className='text-lg font-medium'><a href=""><Star className='inline-block pr-1' /> Favourite</a></li>
                <li className='text-lg font-medium'><a href=""><WholeWord className='inline-block pr-1'/> Dictionary</a></li>
                <li className='text-lg font-medium'><a href=""><Sparkle className='inline-block pr-1' /> ApexAi</a></li>
                <li className='text-lg font-medium'><a href=""><Pen  className='inline-block pr-1' /> Notes</a></li>
            </ul>
            </nav>
           

            <div className="bottom-links">
                <ul>
                    <li className='text-lg font-medium'><Cog className='inline-block pr-1'/> Settings</li>
                </ul>
                          </div>
        </aside>
      
    </div>
  )
}

export default NavBar