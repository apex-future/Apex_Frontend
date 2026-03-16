import React, { useState } from 'react';
import useToast from './hooks/useToast';
import ToastContainer from './components/ui/Toast';
import AsideNavBar from './components/layout/navigation/AsideNavBar';
import NavBarProvider from './components/layout/navigation/NavBarContext';
import { BookProvider } from './context/BookContext';
import { Routes, Route, useLocation } from 'react-router-dom';
// Page level components
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/navigation/BottomNavBar';
import Profile from './components/layout/user/Profile';
import ReaderView from './components/reader/ReaderView';

import BookShelf from './components/layout/book_shelf/BookShelf';
import ShelfDetail from './components/layout/book_shelf/ShelfDetail';
import BookDetails from './components/books/BookDetails';
import Dictionary from './components/dictionary/Dictionary';
import ApexAI from './components/ai/ApexAI';
import NotesPage from './components/notes/NotesPage';
import Settings from './components/layout/user/Settings';
import DuplicateBookModal from './components/modals/DuplicateBookModal';
import ImportPage from './pages/ImportPage';
import { BookContext } from './context/BookContextInstance';
import { useContext } from 'react';
import useThemeStore from './store/themeStore';
import useStudyStore from './store/studyStore';


function MainApp({ onLogout }) {
  // asideIsOpen: State variable that determines if the desktop-style sidebar should be rendered.
  const [asideIsOpen, setAsideIsOpen] = useState(true);
  // isMobileOpen: State variable specifically for the mobile slide-over sidebar visibility.
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toasts, removeToast } = useToast();
  const asideToggle = {
    closeAside: () => setAsideIsOpen(false),
    openAside: () => setAsideIsOpen(true),
  };

  const location = useLocation();
  const { showDuplicateModal, setShowDuplicateModal } = useContext(BookContext) || {};
  const { resolvedTheme } = useThemeStore();
  const updateStreak = useStudyStore(state => state.updateStreak);

  React.useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  return (
    <div className={`flex relative min-h-screen bg-bg-elevated ${resolvedTheme}`}>

      <BookProvider>
        <NavBarProvider asideToggleFunctions={asideToggle}>
          {asideIsOpen && !location.pathname.startsWith('/reader') && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} onLogout={onLogout} />}

          <div className='flex-1 min-w-0 relative z-[10]'>
            <main className="">
              <Routes>
                <Route path="/" element={
                  <HomePage
                    setIsMobileOpen={setIsMobileOpen}
                  />
                } />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings onLogout={onLogout} />} />
                <Route path="/reader/:bookId" element={<ReaderView />} />
                <Route path="/bookshelf" element={<BookShelf />} />
                <Route path="/shelf/:shelfName" element={<ShelfDetail />} />
                <Route path="/book/:bookId" element={<BookDetails />} />
                <Route path="/dictionary" element={<Dictionary />} />
                <Route path="/ai" element={<ApexAI />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/import" element={<ImportPage />} />
              </Routes>
            </main>

            {/* Hide bottom navbar on specialized screens */}
            {!location.pathname.startsWith('/reader') && location.pathname !== '/ai' && <BottomNavBar />}
          </div>

          <DuplicateBookModal
            isOpen={showDuplicateModal}
            onClose={() => setShowDuplicateModal(false)}
          />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </NavBarProvider>
      </BookProvider>
    </div>
  );
}

export default MainApp;
