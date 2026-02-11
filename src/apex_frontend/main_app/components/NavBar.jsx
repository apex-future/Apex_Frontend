import { Menu } from 'lucide-react'
import React from 'react'

function NavBar({setIsMobileOpen}) {
  return (
    <div>
        <div className="nav-wrapper">
                         
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-2 z-40 p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
        </div>
    </div>
  )
}

export default NavBar