import { Menu, Search, Plus, Bell } from 'lucide-react'
import StreakBadge from '../../ui/StreakBadge';
import { useContext } from 'react';
import { NavBarContext } from './NavBarContextInstance';

function TopNavBar({ setIsMobileOpen, onUpload, searchQuery, setSearchQuery }) {
  const { setIsNotificationOpen, unreadNotificationCount } = useContext(NavBarContext) || {};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (onUpload) {
      files.forEach((file) => onUpload(file));
      e.target.value = '';
    }
  };
  return (
    <nav className='sticky top-0 z-40 w-full p-2 py-4 bg-bg-elevated/80 backdrop-blur-md border-border-subtle'>
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
        <form
          className="search-bar flex justify-end md:justify-center items-center gap-2 w-full md:max-w-2xl mx-auto flex-1"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative w-full flex items-center bg-card-glass backdrop-blur-md border-2 border-border-default rounded-full hover:border-text-tertiary focus-within:border-accent-primary transition-all shadow-sm">
            <Search className='absolute left-3 md:left-4 text-text-tertiary pointer-events-none' size={18} />
            <input
              type="text"
              className="w-full pl-10 md:pl-11 pr-4 py-2 md:py-2.5 rounded-full placeholder:text-sm placeholder:text-text-placeholder focus:outline-none bg-transparent text-text-primary text-sm md:text-base"
              placeholder='Search books...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Upload & Streak Group */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Upload Button - Responsive */}
          <div className="md:flex hidden items-center h-full">
            <input
              type="file"
              id="top-nav-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.epub,.docx,.doc"
              multiple
            />
            <label
              htmlFor="top-nav-upload"
              className="flex items-center justify-center gap-2 px-2.5 md:px-4 py-2.5 bg-accent-primary hover:bg-accent-hover text-white rounded-full transition-all cursor-pointer shadow-sm md:w-auto"
            >
              <Plus size={18} />
              <span className="hidden md:inline text-sm font-medium">Upload</span>
            </label>
          </div>

          <button
            onClick={() => setIsNotificationOpen && setIsNotificationOpen(true)}
            className="hidden md:flex items-center justify-center p-2 rounded-full hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-all"
            aria-label="Notifications"
            title="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell size={20} className="flex-shrink-0 transition-colors z-10" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] bg-accent-primary rounded-full border-[1.5px] border-bg-elevated flex items-center justify-center text-[8px] font-bold text-white z-20">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </div>
          </button>

          <div className="streak-wrapper h-full flex items-center">
            <StreakBadge />
          </div>
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar