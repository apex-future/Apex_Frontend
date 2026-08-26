import { List, Plus, Bell, Crown } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { NavBarContext } from './NavBarContextInstance';
import CharacterImg from '../../../../assets/Characters/Character1.png';
import Button from '../../ui/Button';

function TopNavBar({ setIsMobileOpen, onUpload, searchQuery, setSearchQuery, isAsideExpanded }) {
  const { setIsNotificationOpen, unreadNotificationCount } = useContext(NavBarContext) || {};
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (onUpload) {
      files.forEach((file) => onUpload(file));
      e.target.value = '';
    }
  };
  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-3 bg-transparent border-0 pointer-events-none transition-all duration-300 ease-in-out ${
      isAsideExpanded ? 'md:left-[292px]' : 'md:left-[112px]'
    }`}>
      <div className="nav-wrapper flex justify-between w-full items-center gap-3 pointer-events-auto">

        {/* Left Elements (No glassmorphic wrapper, free standing) */}
        {/* Left Elements (No glassmorphic wrapper, free standing) */}
        <div className="flex items-center gap-3">
          {/* Mobile List Button - Only visible on mobile */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden z-40 p-2.5 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-white/25 dark:hover:bg-white/10 transition-all text-text-primary flex items-center justify-center"
            aria-label="Open menu"
          >
            <List size={20} weight="regular" />
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
              <Button 
                variant="primary"
                id="tour-add-book"
                onClick={() => document.getElementById('top-nav-upload').click()}
              >
                <Plus size={18} weight="bold" />
                <span className="hidden md:inline">Upload</span>
              </Button>
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
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] bg-accent-primary rounded-full border-[1.5px] border-bg-elevated flex items-center justify-center text-[8px] font-bold text-white z-20">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </div>
            </button>

            {/* Profile Picture */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center"
              aria-label="Go to Profile"
              title="Profile"
            >
              <img src={CharacterImg} alt="Profile" className="w-9 h-9 rounded-full border border-white/20 bg-white/5 object-cover cursor-pointer hover:opacity-80 hover:scale-105 transition-all" />
            </button>

          </div>
        </div>

      </div>
    </nav>
  )
}

export default TopNavBar