import React, { useState } from 'react';
// Import Lucide icons for visual representation in the navigation
import { Sparkle, House, X, Book, Notebook, Gear, TextAa, List, Sun, Moon, Monitor, User, TrendUp, Scroll, DownloadSimple } from '@phosphor-icons/react';
import { NavLink, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { NavBarContext } from './NavBarContextInstance';
import useThemeStore from '../../../store/themeStore';
import logoLight from "../../../../assets/logo/logo-light-removebg-preview.png";
import logoDark from "../../../../assets/logo/logo-dark-removebg-preview.png";
import { showToastGlobal } from '../../../hooks/useToast';
import ListItem from '../../ui/ListItem';

/**
 * AsideNavBar Component:
 * Provides side navigation with support for both desktop (collapsible/sticky) and mobile (slide-over) layouts.
 */
function AsideNavBar({ isMobileOpen, setIsMobileOpen, isExpanded, setIsExpanded, onLogout }) {
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();
  const { setIsNotificationOpen } = useContext(NavBarContext) || {};

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
    { icon: House, label: 'Home', path: '/' },
    { icon: Book, label: 'Book Spaces', path: '/spaces' },
    { icon: TextAa, label: 'Dictionary', path: '/dictionary' }, // migrated from lucide: WholeWord
    { icon: Scroll, label: 'Quests', path: '/quest' },
    { icon: Sparkle, label: 'Cleo', path: '/ai' },
    { icon: Notebook, label: 'Notebook', path: '/notes' }, // migrated from lucide: NotebookPen
    { icon: TrendUp, label: 'Analytics', path: '/analytics' }, // migrated from lucide: TrendingUp
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
          bg-bg-subtle/90 dark:bg-bg-elevated/95 backdrop-blur-xl
          shadow-sm z-50
          transition-all duration-300 ease-in-out
          flex flex-col
          
          /* Mobile layout: fixed, attached to left edge */
          fixed inset-y-0 left-0 w-64
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* Desktop layout: fixed card with top, bottom, and left margins */
          md:translate-x-0
          md:fixed md:inset-auto md:top-4 md:left-4 md:h-[calc(100vh-2rem)]
          rounded-r-xl md:rounded-[2rem]
          border-r md:border border-border-default/8 dark:border-neutral-800/60
          
          /* Dynamic Width: Swaps between 260px and 80px based on isExpanded state */
          ${isExpanded ? 'md:w-[260px]' : 'md:w-20'}
        `}
      >
        {/* Sidebar Header: Contains the close button (mobile) or the toggle button (desktop) */}
        <div className={`flex items-center h-16 px-4 border-b border-border-default/8 dark:border-neutral-800/50 flex-shrink-0 ${!isExpanded ? 'justify-center' : 'justify-between'}`}>
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
                <X size={20} weight="regular" className="text-text-primary" />
              </button>
            )}

            {/* List button for desktop expansion/collapse toggle */}
            <button
              onClick={toggleNavLink}
              className="hidden md:flex items-center justify-center p-2 hover:bg-bg-subtle rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <List size={20} weight="regular" className="text-text-primary" />
            </button>
          </div>
        </div>

        {/* NavigationArrow Links: flex-1 ensures this section takes up the available vertical space */}
        <nav className="flex-1 flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
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

              return (
                <li key={item.label}>
                  <ListItem
                    as={NavLink}
                    to={item.path}
                    icon={Icon}
                    label={isExpanded ? item.label : ''}
                    isActive={isActive}
                    title={!isExpanded ? item.label : ''}
                    onClick={() => isMobileOpen && closeMobileNav()}
                    className={!isExpanded ? 'flex items-center justify-center px-0 [&>div]:justify-center [&>div]:gap-0' : ''}
                  />
                </li>
              );
            })}
          </ul>

          {/* Footer NavigationArrow Section: Separated by a border, used for settings or low-priority links */}
          <ul className="border-t border-border-default/8 dark:border-neutral-800/50 pt-4 mt-4 space-y-2">
            <li className="flex justify-center mb-2 px-1">
              <div className={`flex ${isExpanded ? 'flex-row' : 'flex-col'} bg-bg-elevated/50 p-1 rounded-xl border border-border-default/8 dark:border-neutral-800/50 shadow-inner gap-1 transition-all duration-300 w-fit justify-center items-center`}>
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'light' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default/8 dark:border-neutral-800/50' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                  title="Light Theme"
                >
                  <Sun size={16} weight="regular" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default/8 dark:border-neutral-800/50' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                  title="Dark Theme"
                >
                  <Moon size={16} weight="regular" />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-2 rounded-lg transition-all flex items-center justify-center ${theme === 'system' ? 'bg-bg-primary shadow-sm text-accent-primary border border-border-default/8 dark:border-neutral-800/50' : 'text-text-tertiary hover:text-text-primary border border-transparent'}`}
                  title="System Default"
                >
                  <Monitor size={16} weight="regular" />
                </button>
              </div>
            </li>

            <li>
              <ListItem
                as={NavLink}
                to="/profile"
                icon={User}
                label={isExpanded ? 'Profile' : ''}
                isActive={location.pathname === '/profile'}
                title={!isExpanded ? 'Profile' : ''}
                onClick={() => isMobileOpen && closeMobileNav()}
                className={!isExpanded ? 'flex items-center justify-center px-0 [&>div]:justify-center [&>div]:gap-0' : ''}
              />
            </li>
            <li>
              <ListItem
                as={NavLink}
                to="/settings"
                icon={Gear}
                label={isExpanded ? 'Settings' : ''}
                isActive={location.pathname === '/settings'}
                title={!isExpanded ? 'Settings' : ''}
                onClick={() => isMobileOpen && closeMobileNav()}
                className={!isExpanded ? 'flex items-center justify-center px-0 [&>div]:justify-center [&>div]:gap-0' : ''}
              />
            </li>

          </ul>

          {/* Bottom utility: Download Apex */}
          <div className={`border-t border-border-default/8 dark:border-neutral-800/50 pt-4 mt-3 flex flex-col gap-2 ${!isExpanded ? 'items-center' : ''}`}>
            <ListItem
              as="button"
              icon={DownloadSimple}
              label={isExpanded ? 'Download Apex' : ''}
              title={!isExpanded ? 'Download Apex' : ''}
              onClick={async () => {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                if (isStandalone) {
                  showToastGlobal("Apex is already installed and running as an app!", "info");
                  return;
                }

                if (window.deferredPrompt) {
                  try {
                    window.deferredPrompt.prompt();
                    const choice = await window.deferredPrompt.userChoice;
                    console.log('[Apex] Install prompt result:', choice?.outcome);
                    window.deferredPrompt = null;
                  } catch (err) {
                    console.error('[Apex] Install error:', err);
                  }
                } else {
                  showToastGlobal("To install Apex, open your browser menu and select 'Install Apex' or 'Add to Home Screen'.", "info");
                }
              }}
              className={!isExpanded ? 'flex items-center justify-center px-0 [&>div]:justify-center [&>div]:gap-0' : ''}
            />
          </div>
        </nav>
      </aside>
    </>
  );
}

export default AsideNavBar;