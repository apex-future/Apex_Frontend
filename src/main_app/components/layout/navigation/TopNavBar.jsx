import { Menu, Plus, Bell, Crown } from 'lucide-react'
import StreakBadge from '../../ui/StreakBadge';
import { useContext } from 'react';
import { NavBarContext } from './NavBarContextInstance';

function TopNavBar({ setIsMobileOpen, onUpload }) {
  const { setIsNotificationOpen } = useContext(NavBarContext) || {};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (onUpload) {
      files.forEach((file) => onUpload(file));
      e.target.value = '';
    }
  };
  return (
    <nav className='sticky top-0 z-40 w-full px-4 md:px-8 py-4 bg-bg-elevated/80 backdrop-blur-md border-border-subtle relative'>
      <div className="nav-wrapper flex justify-between w-full p-0 md:p-1 items-center gap-3">

        {/* Go Pro Premium Badge - Desktop Only (Left Side) */}
        <button 
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 border border-amber-500/30 hover:border-amber-400/60 text-amber-400 hover:text-amber-300 transition-all duration-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] group"
          aria-label="Go Pro"
          title="Go Pro"
        >
          <Crown size={15} className="fill-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            Go Pro
          </span>
        </button>

        {/* Mobile Menu Button - Only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden z-40 p-2 rounded-lg hover:bg-bg-subtle transition-all"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-text-primary" />
        </button>

        {/* Upload & Streak Group */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          
          {/* Go Pro Premium Badge - Mobile Only (Right Side, beside Bell) */}
          <button 
            className="flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 border border-amber-500/30 hover:border-amber-400/60 text-amber-400 hover:text-amber-300 transition-all duration-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] group"
            aria-label="Go Pro"
            title="Go Pro"
          >
            <Crown size={15} className="fill-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Go Pro
            </span>
          </button>
          
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
            className="flex items-center justify-center p-2 rounded-full hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-all"
            aria-label="Notifications"
            title="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell size={20} className="flex-shrink-0 transition-colors z-10" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-primary rounded-full border-[1.5px] border-bg-elevated" />
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