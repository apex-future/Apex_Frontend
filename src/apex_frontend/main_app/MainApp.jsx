import React, { useState, useEffect, useCallback } from 'react';
import AsideNavBar from './components/layout/navigation/AsideNavBar';
import NavBarProvider from './components/layout/navigation/NavBarContext';
import TopNavBar from './components/layout/navigation/TopNavBar';
import { Routes, Route } from 'react-router-dom';
// Page level components
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/navigation/BottomNavBar';
import Profile from './components/layout/user/Profile';
import ReaderView from './components/reader/ReaderView';

function MainApp() {
  const [asideIsOpen, setAsideIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [books, setBooks] = useState([]);

  const asideToggle = {
    closeAside: () => setAsideIsOpen(false),
    openAside: () => setAsideIsOpen(true)
  };

  // Upload Logic - Stabilized
  const handleUpload = useCallback((fileObject) => {
    const newBook = {
      id: Date.now(),
      title: fileObject.name || "New Document",
      author: "Uploaded User",
      progress: 0,
      currentPage: 0,
      totalPages: 1, // Default
      status: 'new',
      lastAccessed: new Date().toISOString(),
      cover: null,
      file: fileObject, // STORE THE ACTUAL FILE!
      isLocal: true
    };

    setBooks(prev => [newBook, ...prev]);
  }, []);

  const handleUpdateProgress = useCallback((bookId, progress, currentPage, totalPages) => {
    setBooks(prev => prev.map(book =>
      book.id === bookId ? { ...book, progress, currentPage, totalPages } : book
    ));
  }, []);

  const handleBookClick = useCallback((bookId) => {
    setBooks(prev => prev.map(book =>
      book.id === parseInt(bookId) ? { ...book, lastAccessed: new Date().toISOString() } : book
    ));
  }, []);

  return (
    <div className='flex relative min-h-screen max-w-full overflow-x-hidden'>
      <div className="absolute top-0 z-[-2] min-h-full w-full bg-bg-primary bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>

      <NavBarProvider asideToggleFunctions={asideToggle}>
        {asideIsOpen && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}
      </NavBarProvider>

      <div className='flex-1 overflow-hidden relative z-[10]'>
        <main className="">
          <Routes>
            <Route path="/" element={
              <HomePage
                setIsMobileOpen={setIsMobileOpen}
                books={books}
                onUpload={handleUpload}
                onBookClick={handleBookClick}
              />
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reader/:bookId" element={<ReaderView books={books} onUpdateProgress={handleUpdateProgress} />} />
          </Routes>
        </main>
        <BottomNavBar onUpload={handleUpload} />
      </div>
    </div>
  );
}

export default MainApp;
