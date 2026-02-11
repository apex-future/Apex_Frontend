import { Menu, Search } from 'lucide-react'
import React from 'react'
import logo from "../../../assets/logo/logo-light.jpg";

function NavBar({ setIsMobileOpen }) {
  return (
    <nav className='w-full bg-bg-primary border-b border-border-default'>
      <div className="nav-wrapper flex justify-between w-full p-0 md:p-4 items-center">

        {/* Mobile Menu Button - Only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden z-40 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <form className="search-bar flex justify-center gap-2 rounded-full p-1 flex-1 max-w-[200px] md:max-w-[400px] lg:max-w-[500px] h-full mx-auto">
          <input type="text" className="border p-1 px-3 w-full rounded-full placeholder:text-sm bg-bg-subtle" placeholder='Search books' />
          <button type="submit" className='border p-1 rounded-full bg-bg-subtle'>
            <Search className='p-1' />
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