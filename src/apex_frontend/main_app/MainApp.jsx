import React, { useState, useEffect, useCallback } from 'react';
// Import essential layout and navigation components
import AsideNavBar from './components/layout/navigation/AsideNavBar';
import NavBarProvider from './components/layout/navigation/NavBarContext';
import { BookProvider } from './context/BookContext';
import TopNavBar from './components/layout/navigation/TopNavBar';
import { Routes, Route } from 'react-router-dom';
// Page level components
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/navigation/BottomNavBar';
import Profile from './components/layout/user/Profile';
import ReaderView from './components/reader/ReaderView';

import BookShelf from './components/layout/book_shelf/BookShelf';

function MainApp() {
  // asideIsOpen: State variable that determines if the desktop-style sidebar should be rendered.
  const [asideIsOpen, setAsideIsOpen] = useState(true);
  // isMobileOpen: State variable specifically for the mobile slide-over sidebar visibility.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const asideToggle = {
    closeAside: () => setAsideIsOpen(false),
    openAside: () => setAsideIsOpen(true)
  };

  return (
    // Top-level flex container: Manages the horizontal layout between the Sidebar and the Main Main Content.
    <div className='flex relative gap-4 min-h-screen bg-bg-elevated max-w-full'>
      {/* Mesh gradient background: Positioned absolutely to provide a decorative background layer. */}
      {/* <div className="absolute top-0  z-[-2] min-h-full w-full bg-bg-primary bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div> */}
      
      {/* BookProvider: Encapsulates the application in a context that provides shared book data and actions. */}
      <BookProvider>
        {/* NavBarProvider: Exposes sidebar visibility controls to any component in the tree that needs them. */}
        <NavBarProvider asideToggleFunctions={asideToggle}>
          {/* AsideNavBar: The sidebar component; only mounted if asideIsOpen state is truthy. */}
          {asideIsOpen && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
        </NavBarProvider>

        {/* Content Wrapper: flex-1 ensures this container takes up all available space besides the sidebar. */}
        <div className='flex-1  overflow-hidden relative z-[10]'>
             {/* Main Content: Houses the Router's view and applies thematic rounding to its container. */}
          <main className="rounded-l-xl">
              <Routes>
                {/* Route Definitions: Specifies which component to render based on the current browser URL. */}
              <Route path="/" element={
              <HomePage
                setIsMobileOpen={setIsMobileOpen}
              />
            } />
                <Route path="/profile" element={<Profile />} />
            <Route path="/reader/:bookId" element={<ReaderView />} />
                <Route path="/bookshelf" element={<BookShelf />} />
            </Routes>
             </main>
             
          {/* BottomNavBar: Sticky navigation bar typically visible only on mobile-sized screens. */}
          <BottomNavBar />
        </div>
      </BookProvider>
    </div>
  );
}

export default MainApp;
