import React, { useState } from 'react';
import { Sparkle, Home, X, Book, Pen, Star, Cog, WholeWord, Menu } from 'lucide-react';
import logo from "../../../assets/logo/logo-light.jpg";

function NavBar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleNavLink = () => {
    setIsExpanded(!isExpanded);
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '#home' },
    { icon: Book, label: 'Books', href: '#books' },
    { icon: Star, label: 'Favourite', href: '#favourite' },
    { icon: WholeWord, label: 'Dictionary', href: '#dictionary' },
    { icon: Sparkle, label: 'ApexAi', href: '#apexai' },
    { icon: Pen, label: 'Notes', href: '#notes' },
  ];

  return (
    <>
             
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-2 z-40 p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

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
          transition-all duration-300 ease-in-out
          flex flex-col h-screen
          
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
            className={`hidden md:block p-1 hover:bg-gray-200 rounded transition-colors ${
              !isExpanded ? 'mx-auto' : 'ml-auto'
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
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg
                      hover:bg-gray-200 transition-all duration-200
                      text-gray-700 font-medium
                      ${!isExpanded ? 'justify-center' : ''}
                    `}
                    title={!isExpanded ? item.label : ''}
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
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Bottom navigation (Settings) */}
          <ul className="border-t border-gray-200 pt-4">
            <li>
              <a
                href="#settings"
                className={`
                  flex items-center gap-3 p-2 rounded-lg
                  hover:bg-gray-200 transition-all duration-200
                  text-gray-700 font-medium
                  ${!isExpanded ? 'justify-center' : ''}
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
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default NavBar;