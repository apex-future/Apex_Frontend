import React, { useState } from 'react';
// Import Lucide icons for visual representation in the navigation
import { Sparkle, Home, X, Book, Pen, Star, Cog, WholeWord, Menu, LogOut, Sun, Moon, Monitor, User } from 'lucide-react';
// Import navigation hooks and components from react-router-dom
import { NavLink, useLocation } from 'react-router-dom';
import useThemeStore from '../../../store/themeStore';
import logoLight from "../../../../assets/logo/logo-light-removebg-preview.png";
import logoDark from "../../../../assets/logo/logo-dark-removebg-preview.png";

/**
 * AsideNavBar Component:
 * Provides side navigation with support for both desktop (collapsible/sticky) and mobile (slide-over) layouts.
 */
function AsideNavBar({ isMobileOpen, setIsMobileOpen, onLogout }) {
  // useLocation: Hook to track the current URL, used for custom active state logic (especially hash handling)
  const location = useLocation();
  // isExpanded: State to toggle between the full-width (expanded) and icon-only (collapsed) sidebar views
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, setTheme } = useThemeStore();

  // toggleNavLink: Flips the expansion state of the sidebar
  const toggleNavLink = () => {
    setIsExpanded(!isExpanded);
  };

  // closeMobileNav: Callback to hide the sidebar on mobile screens
  const closeMobileNav = () => {
    setIsMobileOpen(false);
  };

  // navItems: Configuration array for the links to be displayed in the primary navigation list
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Book, label: 'Book Shelf', path: '/bookshelf' },
    { icon: WholeWord, label: 'Dictionary', path: '/dictionary' },
    { icon: Sparkle, label: 'ApexAI', path: '/ai' },
    { icon: Pen, label: 'Notes', path: '/notes' },
  ];

  return (
    <>
      {/* Overlay: Rendered on mobile when the sidebar is open to dim the background and allow closing on click */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed max-h-screen
           inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar: Main container for the navigation links */}
      <aside
        className={`
          bg-bg-elevated/90 backdrop-blur-xl border-r border-border-default/80
          shadow-sm z-50
          transition-all duration-300 ease-in-out
          flex flex-col max-h-screen
          rounded-r-xl
          /* Layout Switching: Fixed on small screens, Sticky within flow on md+ screens */
          fixed md:sticky top-0 left-0 bottom-0 md:bottom-auto md:left-auto md:translate-x-0
          
          /* Mobile Visibility: Moves off-screen based on isMobileOpen state */
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          
          /* Dynamic Width: Swaps between 64 and 20 based on isExpanded state */
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* Sidebar Header: Contains the close button (mobile) or the toggle button (desktop) */}
        <div className={`flex items-center h-16 px-4 border-b border-border-default flex-shrink-0 ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
          {isExpanded && (
            <div className="logo-wrapper flex items-center">
              <img
                src={logoLight}
                alt="Apex Logo"
                className='h-8 w-auto object-contain dark:hidden'
              />
              <img
                src={logoDark}
                alt="Apex Logo"
                className='h-8 w-auto object-contain hidden dark:block'
              />
            </div>
          )}

          <div className="flex items-center break-keep">
            {/* X button for mobile dismissal */}
            {isExpanded && (
              <button
                onClick={closeMobileNav}
                className="md:hidden p-2 hover:bg-bg-subtle rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-text-primary" />
              </button>
            )}

            {/* Menu button for desktop expansion/collapse toggle */}
            <button
              onClick={toggleNavLink}
              className="hidden md:flex items-center justify-center p-2 hover:bg-bg-subtle rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <Menu size={20} className="text-text-primary" />
            </button>
          </div>
        </div>

        {/* Navigation Links: flex-1 ensures this section takes up the available vertical space */}
        <nav className="flex-1 flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              /**
               * Custom isActive Logic:
               * 1. Hash Links (#): Match exactly only if the URL hash matches.
               * 2. Home (/): Matches only if path is exactly '/' and there is no hash.
               * 3. Other Routes: Match the pathname directly.
               */
              const isActive = item.path.startsWith('#')
                ? location.hash === item.path
                : (item.path === '/'
                  ? location.pathname === '/' && location.hash === ''
                  : location.pathname === item.path);

              const itemContent = (
                <>
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors z-10`}
                  />
                  <span
                    className={`
                      whitespace-nowrap transition-all duration-300 text-sm z-10
                      ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                    `}
                  >
                    {item.label}
                  </span>
                </>
              );

              const baseClasses = `
                flex items-center px-3 py-2.5 rounded-full
                transition-all duration-300
                font-medium relative group w-full
                ${!isExpanded ? 'justify-center' : 'gap-3'}
                ${isActive
                  ? 'bg-gradient-to-r from-accent-primary/20 to-bg-subtle text-text-primary border border-border-default shadow-sm'
                  : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                }
              `;



              return (
                <li key={item.label}>
                  <NavLink
                    to={item.path}
                    className={baseClasses}
                    title={!isExpanded ? item.label : ''}
                    onClick={() => isMobileOpen && closeMobileNav()}
                  >
                    {itemContent}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Footer Navigation Section: Separated by a border, used for settings or low-priority links */}
          <ul className="border-t border-border-default pt-4 mt-4 space-y-2">
            <li className="flex justify-center mb-2 px-1">
              <div className={`flex ${isExpanded ? 'flex-row' : 'flex-col'} bg-bg-elevated/50 p-1 rounded-xl border border-border-default shadow-inner gap-1 transition-all duration-300 w-fit justify-center items-center`}>
                <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'light' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                    title="Light Theme"
                >
                    <Sun size={16} />
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                    title="Dark Theme"
                >
                    <Moon size={16} />
                </button>
                <button
                    onClick={() => setTheme('system')}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'system' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                    title="System Default"
                >
                    <Monitor size={16} />
                </button>
              </div>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={`flex items-center p-3 rounded-xl transition-all duration-300 
                  ${!isExpanded ? 'justify-center' : 'gap-3'}
                  ${location.pathname === '/profile'
                    ? 'bg-gradient-to-r from-accent-primary/20 to-bg-subtle text-text-primary border border-border-default shadow-sm'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                  }`}
                title={!isExpanded ? 'Profile' : ''}
                onClick={() => isMobileOpen && closeMobileNav()}
              >
                <User
                  size={20}
                  className={`flex-shrink-0 transition-colors z-10`}
                />
                <span
                  className={`
                    whitespace-nowrap transition-all duration-300 text-sm z-10
                    ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                  `}
                >
                  Profile
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={`flex items-center p-3 rounded-xl transition-all duration-300 
                  ${!isExpanded ? 'justify-center' : 'gap-3'}
                  ${location.pathname === '/settings'
                    ? 'bg-gradient-to-r from-accent-primary/20 to-bg-subtle text-text-primary border border-border-default shadow-sm'
                    : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary'
                  }`}
                title={!isExpanded ? 'Settings' : ''}
                onClick={() => isMobileOpen && closeMobileNav()}
              >
                <Cog
                  size={20}
                  className={`flex-shrink-0 transition-colors z-10`}
                />
                <span
                  className={`
                    whitespace-nowrap transition-all duration-300 text-sm z-10
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