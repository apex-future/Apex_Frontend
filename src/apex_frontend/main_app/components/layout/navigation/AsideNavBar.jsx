import React, { useState } from 'react';
import { Sparkle, Home, X, Book, Pen, Star, Cog, WholeWord, Menu } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

function AsideNavBar({ isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleNavLink = () => {
    setIsExpanded(!isExpanded);
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Book, label: 'Book Shelf', path: '/bookshelf' },
    { icon: Star, label: 'Favourite', path: '#favourite' },
    { icon: WholeWord, label: 'Dictionary', path: '#dictionary' },
    { icon: Sparkle, label: 'ApexAi', path: '#apexai' },
    { icon: Pen, label: 'Notes', path: '#notes' },
  ];

  return (
    <>
      {/* Overlay for mobile (only on mobile) */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-neutral-50/95 backdrop-blur-xl border-r border-neutral-300/80
          shadow-sm z-50
          transition-all duration-300 ease-in-out
          flex flex-col h-screen
          
          /* FIXED on mobile, STICKY on desktop */
          fixed md:sticky top-0 left-0 bottom-0 md:bottom-auto md:left-auto md:translate-x-0
          
          /* Mobile: slides in/out */
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          
          /* Width transitions smoothly */
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* Header with toggle button */}
        <div className={`flex items-center h-16 px-4 border-b border-neutral-300/80 flex-shrink-0 ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {/* Close button for mobile */}
          {isExpanded && (
            <button
              onClick={closeMobileNav}
              className="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={20} className="text-neutral-700" />
            </button>
          )}

          {/* Toggle button for desktop */}
          <button
            onClick={toggleNavLink}
            className="hidden md:flex items-center justify-center p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={20} className="text-neutral-700" />
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden">
          {/* Main navigation items */}
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              const isActive = item.path.startsWith('#') 
                ? location.hash === item.path 
                : (item.path === '/' 
                    ? location.pathname === '/' && location.hash === '' 
                    : location.pathname === item.path);

              return (
                <li key={item.label}>
                  <NavLink
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      font-medium relative group
                      ${!isExpanded ? 'justify-center' : ''}
                      ${
                        isActive 
                          ? 'bg-white/80 text-neutral-900 border border-neutral-300/60 shadow-sm' 
                          : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-900'
                      }
                    `}
                    title={!isExpanded ? item.label : ''}
                    onClick={() => isMobileOpen && closeMobileNav()}
                  >
                    <Icon 
                      size={20} 
                      className={`flex-shrink-0 transition-colors ${isActive ? 'text-accent-primary' : ''}`}
                    />
                    <span
                      className={`
                        whitespace-nowrap transition-all duration-300 text-sm
                        ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                      `}
                    >
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Bottom navigation (Settings) */}
          <ul className="border-t border-neutral-300/80 pt-4 mt-4">
            <li>
              <NavLink
                to="#settings"
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  font-medium relative
                  ${!isExpanded ? 'justify-center' : ''}
                  ${
                    location.hash === '#settings' 
                      ? 'bg-white/80 text-neutral-900 border border-neutral-300/60 shadow-sm' 
                      : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-900'
                  }
                `}
                title={!isExpanded ? 'Settings' : ''}
              >
                <Cog 
                  size={20} 
                  className={`flex-shrink-0 transition-colors ${location.hash === '#settings' ? 'text-accent-primary' : ''}`}
                />
                <span
                  className={`
                    whitespace-nowrap transition-all duration-300 text-sm
                    ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                  `}
                >
                  Settings
                </span>

                {location.hash === '#settings' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-primary rounded-r-full" />
                )}
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default AsideNavBar;