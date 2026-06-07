import React, { useState } from 'react';
import useToast from './hooks/useToast';
import ToastContainer from './components/ui/Toast';
import AsideNavBar from './components/layout/navigation/AsideNavBar';
import NavBarProvider from './components/layout/navigation/NavBarContext';
import { BookProvider } from './context/BookContext';
import { Routes, Route, useLocation } from 'react-router-dom';
import notificationService from './services/notificationService';
// Page level components
import HomePage from './components/home/HomePage';
import BottomNavBar from './components/layout/navigation/BottomNavBar';
import Profile from './components/layout/user/Profile';
import ReaderView from './components/reader/ReaderView';

import BookSpaces from './components/layout/spaces/BookSpaces';
import SpaceDetail from './components/layout/spaces/SpaceDetail';
import BookDetails from './components/books/BookDetails';
import Dictionary from './components/dictionary/Dictionary';
import ApexAI from './components/ai/ApexAI';
import TabsPage from './components/tabs/TabsPage';
import Settings from './components/layout/user/Settings';
import DuplicateBookModal from './components/modals/DuplicateBookModal';
import ImportPage from './pages/ImportPage';
import StreakPage from './pages/StreakPage';
import ExamPage from './pages/ExamPage';
import GlobalAnalytics from './components/analytics/GlobalAnalytics';
import NotebooksPage from './pages/NotebooksPage';
import NotebookDetailPage from './pages/NotebookDetailPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NotificationDrawer from './components/notifications/NotificationDrawer';
import { BookContext } from './context/BookContextInstance';
import { useContext } from 'react';
import useThemeStore from './store/themeStore';
import Lenis from 'lenis';


function MainApp({ onLogout }) {
  // asideIsOpen: State variable that determines if the desktop-style sidebar should be rendered.
  const [asideIsOpen, setAsideIsOpen] = useState(true);
  // isMobileOpen: State variable specifically for the mobile slide-over sidebar visibility.
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { toasts, removeToast } = useToast();
  const asideToggle = {
    closeAside: () => setAsideIsOpen(false),
    openAside: () => setAsideIsOpen(true),
    isNotificationOpen,
    setIsNotificationOpen
  };

  const location = useLocation();
  const { showDuplicateModal, setShowDuplicateModal } = useContext(BookContext) || {};
  const { resolvedTheme } = useThemeStore();

  React.useEffect(() => {
    // Request notification permission and check for missed days
    notificationService.requestPermission().then(() => {
      notificationService.checkAndNotify();
      notificationService.scheduleNotification();
    });
  }, []);

  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    window.__lenis = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      window.__lenis = null
    }
  }, [])

  React.useEffect(() => {
    if (!window.__lenis) return
    if (location.pathname.startsWith('/reader')) {
      window.__lenis.stop()
    } else {
      window.__lenis.start()
    }
  }, [location.pathname])

  return (
    <div className={`flex relative min-h-screen bg-bg-elevated ${resolvedTheme}`}>

      <BookProvider>
        <NavBarProvider asideToggleFunctions={asideToggle}>
          {asideIsOpen && !location.pathname.startsWith('/reader') && !location.pathname.match(/^\/notes\/[^/]+\/(new|[^/]+)$/) && <AsideNavBar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} onLogout={onLogout} />}

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
                <Route path="/spaces" element={<BookSpaces />} />
                <Route path="/space/:spaceId" element={<SpaceDetail />} />
                <Route path="/book/:bookId" element={<BookDetails />} />
                <Route path="/dictionary" element={<Dictionary />} />
                <Route path="/ai" element={<ApexAI />} />
                <Route path="/tabs" element={<TabsPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/streak" element={<StreakPage />} />
                <Route path="/exams" element={<ExamPage />} />
                <Route path="/analytics" element={<GlobalAnalytics />} />
                <Route path="/notes" element={<NotebooksPage />} />
                <Route path="/notes/:bookId" element={<NotebookDetailPage />} />
                <Route path="/notes/:bookId/new" element={<NoteEditorPage />} />
                <Route path="/notes/:bookId/:noteId" element={<NoteEditorPage />} />
              </Routes>
            </main>

            {/* Hide bottom navbar on specialized screens */}
            {!location.pathname.startsWith('/reader') && location.pathname !== '/ai' && !location.pathname.match(/^\/notes\/[^/]+\/(new|[^/]+)$/) && <BottomNavBar />}
          </div>

          <DuplicateBookModal
            isOpen={showDuplicateModal}
            onClose={() => setShowDuplicateModal(false)}
          />
          <NotificationDrawer 
            isOpen={isNotificationOpen} 
            onClose={() => setIsNotificationOpen(false)} 
          />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </NavBarProvider>
      </BookProvider>
    </div>
  );
}

export default MainApp;
