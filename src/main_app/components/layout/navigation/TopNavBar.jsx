import { List, Plus, Bell, Crown } from '@phosphor-icons/react';
import { useContext } from 'react';
import { NavBarContext } from './NavBarContextInstance';
import CharacterImg from '../../../../assets/Characters/Character1.png';

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
    <nav className='sticky top-0 z-40 w-full px-4 md:px-8 py-3'>
      <div className="nav-wrapper flex justify-between w-full items-center gap-3">

        {/* Left Elements (No glassmorphic wrapper, free standing) */}
        {/* Left Elements (No glassmorphic wrapper, free standing) */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button - Only visible on mobile */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden z-40 p-2 rounded-lg hover:bg-bg-subtle/50 dark:hover:bg-white/5 transition-all text-text-primary"
            aria-label="Open menu"
          >
            <List size={24} weight="regular" />
          </button>

          {/* Go Pro Premium Badge */}
          <div className="flex items-center px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-amber-400 hover:text-amber-300 transition-all duration-300 group"
              aria-label="Go Pro"
              title="Go Pro"
            >
              <Crown size={15} weight="fill" className="text-amber-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Go Pro
              </span>
            </button>
          </div>
        </div>

        {/* Right Elements Group */}
        <div className="flex items-center gap-3 ml-auto">
          
          {/* Glassmorphic Pill container for upload button, notification bell, profile picture icon */}
          <div className="flex items-center gap-3.5 md:gap-5 px-4 py-2 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            
            {/* Upload Button - Hidden on mobile */}
            <div className="hidden md:flex items-center h-full">
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
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-hover text-white rounded-full transition-all cursor-pointer shadow-sm text-sm font-semibold"
              >
                <Plus size={18} weight="bold" />
                <span className="hidden md:inline">Upload</span>
              </label>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen && setIsNotificationOpen(true)}
              className="flex items-center justify-center p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all"
              aria-label="Notifications"
              title="Notifications"
            >
              <div className="relative flex items-center justify-center">
                <Bell size={22} weight="regular" className="flex-shrink-0 transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-primary rounded-full border border-bg-subtle dark:border-bg-elevated" />
              </div>
            </button>

            {/* Profile Picture */}
            <div className="flex items-center">
              <img src={CharacterImg} alt="Profile" className="w-9 h-9 rounded-full border border-white/20 bg-white/5 object-cover cursor-pointer hover:opacity-80 transition-opacity" />
            </div>

          </div>
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar