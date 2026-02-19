import React, { useState, useEffect, useCallback } from 'react';
// Import essential layout and navigation components
import AsideNavBar from './components/layout/navigation/AsideNavBar';
import NavBarProvider from './components/layout/navigation/NavBarContext';
import { BookProvider } from './context/BookContext';
import TopNavBar from './components/layout/navigation/TopNavBar';
import { Routes, Route, useLocation } from 'react-router-dom';
// Page level components
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/navigation/BottomNavBar';
import Profile from './components/layout/user/Profile';
import ReaderView from './components/reader/ReaderView';

import BookShelf from './components/layout/book_shelf/BookShelf';
import BookDetails from './components/books/BookDetails';
import Dictionary from './components/dictionary/Dictionary';

function MainApp() {
  // asideIsOpen: State variable that determines if the desktop-style sidebar should be rendered.
  const [asideIsOpen, setAsideIsOpen] = useState(true);
  // isMobileOpen: State variable specifically for the mobile slide-over sidebar visibility.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const asideToggle = {
    closeAside: () => setAsideIsOpen(false),
    openAside: () => setAsideIsOpen(true)
  };

      const location = useLocation();

  return (
    <div className='flex relative min-h-screen bg-bg-elevated'>
      {/* <div className="absolute top-0 z-[-2] min-h-full w-full bg-bg-primary bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div> */}

      <BookProvider>
        <NavBarProvider asideToggleFunctions={asideToggle}>
          {asideIsOpen && !location.pathname.startsWith('/reader') && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
        </NavBarProvider>

        <div className='flex-1 min-w-0 relative z-[10]'>
          <main className="">
            <Routes>
              <Route path="/" element={
                <HomePage
                  setIsMobileOpen={setIsMobileOpen}
                />
              } />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reader/:bookId" element={<ReaderView />} />
              <Route path="/bookshelf" element={<BookShelf />} />
              <Route path="/book/:bookId" element={<BookDetails />} />
              <Route path="/dictionary" element={<Dictionary />} />
            </Routes>
          </main>
          
          {/* Hide bottom navbar when reading a book */}
          {!location.pathname.startsWith('/reader') && <BottomNavBar />}
        </div>
      </BookProvider>
    </div>
  );
}

export default MainApp;
