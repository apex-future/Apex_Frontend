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


      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-bg-subtle z-50
          shadow-inner shadow-white/50
          transition-all duration-300 ease-in-out
          flex flex-col h-screen
          backdrop-blur-md
          fixed md:sticky top-0
          
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          
          ${isExpanded ? 'w-64' : 'w-16'}
        `}
      >
        {/* Header with toggle button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* Close button for mobile */}
          <button
            onClick={closeMobileNav}
            className="md:hidden p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          {/* Toggle button for desktop */}

          <button
            onClick={toggleNavLink}
            className={`hidden md:block p-1 hover:bg-gray-200 rounded transition-colors ${!isExpanded ? 'mx-auto' : 'ml-auto'
              }`}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        {/* <div>
                <img className="size-12 rounded-full mx-12 md:mx-8" src={logo} alt="" />
            </div> */}
        <nav className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
          {/* Main navigation items */}
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              // Custom active check to handle hashes and overlapping routes
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
                      flex items-center gap-3 p-2 rounded-lg
                      transition-all duration-200
                      font-medium relative group
                      ${!isExpanded ? 'justify-center' : ''}
                      ${isActive ? 'bg-accent-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}
                    `}
                    title={!isExpanded ? item.label : ''}
                    onClick={() => isMobileOpen && closeMobileNav()}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span
                      className={`
                        whitespace-nowrap transition-all duration-300
                        ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                      `}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Bottom navigation (Settings) */}
          <ul className="border-t border-gray-200 pt-4">
            <li>
              <NavLink
                to="#settings"
                className={`
                  flex items-center gap-3 p-2 rounded-lg
                  transition-all duration-200
                  font-medium relative
                  ${!isExpanded ? 'justify-center' : ''}
                  ${location.hash === '#settings' ? 'bg-accent-primary text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'}
                `}
                title={!isExpanded ? 'Settings' : ''}
              >
                <Cog size={20} className="flex-shrink-0" />
                <span
                  className={`
                    whitespace-nowrap transition-all duration-300
                    ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                  `}
                >
                  Settings
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default AsideNavBar;