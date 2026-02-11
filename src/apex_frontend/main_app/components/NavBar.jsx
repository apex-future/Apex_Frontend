import { Menu,Search } from 'lucide-react'
import React from 'react'
import logo from "../../../assets/logo/logo-light.jpg";

function NavBar({setIsMobileOpen}) {
  return (
    <nav className='w-full bg-bg-primary border-b border-border-default'>
        <div className="nav-wrapper flex justify-between w-full p-2 items-center">
                         
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden w- z-40 p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
        <form className="search-bar flex  justify-center gap-2 rounded-full p-1 min-w-[100px]  h-full ">
            <input type="text" className="border p-1 px-2 w-[70%] rounded-full placeholder:text-sm bg-bg-subtle" placeholder='search books' />
            <button type="submit" className='border p-1 rounded-full bg-bg-subtle'>
            <Search className='p-1'/>
            </button>
           
        </form>
        <div className="logo-wrapper">
             <img src={logo} alt="" className='size-10 rounded-full' />
        </div>
     
        </div>
    </nav>
  )
}

export default NavBar