import { Menu, Search } from 'lucide-react'
import logo from "../../../../assets/logo/logo-light-removebg-preview.png";

function TopNavBar({ setIsMobileOpen }) {
  return (
    <nav className='w-full  p-2 border-border-default'>
      <div className="nav-wrapper flex justify-between w-full p-0 md:p-1 items-center">

        {/* Mobile Menu Button - Only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden z-40 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <form className="search-bar flex justify-center gap-2 rounded-full p-1  w-[80%] h-full mx-auto">
          <input type="text" className=" border-2 border-subtle  p-1 px-3 h-10 w-full rounded-full placeholder:text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent-primary bg-gray-300" placeholder='Search books' />
          <button type="submit" className=' border-2 border-subtle   p-1 rounded-full bg-gray-300'>
            <Search className='p-1' />
          </button>

        </form>
        <div className="logo-wrapper p-2">
          <img src={logo} alt="" className='size-10 rounded-full' />
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar