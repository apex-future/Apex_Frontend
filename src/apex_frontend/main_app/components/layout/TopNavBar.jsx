import { Menu, Search } from 'lucide-react'
import logo from "../../../../assets/logo/logo-light-removebg-preview.png";

function TopNavBar({ setIsMobileOpen }) {
  return (
    <nav className='w-full p-2'>
      <div className="nav-wrapper flex justify-between w-full p-0 md:p-1 items-center gap-3">

        {/* Mobile Menu Button - Only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden z-40 p-2 rounded-lg hover:bg-bg-subtle transition-all"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-text-primary" />
        </button>

        {/* Search Bar - Glassmorphic with Thick Border */}
        {/* Search Bar - Responsive */}
        <form className="search-bar flex justify-end md:justify-center items-center gap-2 w-full md:max-w-2xl mx-auto flex-1">
          <div className="relative w-full flex items-center bg-white/60 backdrop-blur-md border-2 border-border-default rounded-full hover:border-text-tertiary focus-within:border-accent-primary transition-all">
            <Search className='absolute left-3 md:left-4 text-text-tertiary pointer-events-none' size={18} />
            <input
              type="text"
              className="w-full pl-10 md:pl-11 pr-4 py-2 md:py-2.5 rounded-full placeholder:text-sm placeholder:text-text-placeholder focus:outline-none bg-transparent text-text-primary text-sm md:text-base"
              placeholder='Search books...'
            />
          </div>
        </form>

        {/* Logo */}
        <div className="logo-wrapper flex-shrink-0">
          <img
            src={logo}
            alt="Apex Logo"
            className='size-10 rounded-full object-cover'
          />
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar