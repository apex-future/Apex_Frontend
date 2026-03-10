import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from 'react-router-dom'
import MainApp from './main_app/MainApp'
import LandingPage from './landing_page/LandingPage'
import SignupPage from './landing_page/SignupPage'
import LoginPage from './landing_page/LoginPage'
import authService from './main_app/services/authService'
import syncService from './main_app/services/syncService'
import db from './main_app/db/apex.db'
import useAuthStore from './main_app/store/authStore'
import useThemeStore from './main_app/store/themeStore'
import ApexLoadingScreen from './main_app/components/layout/ApexLoadingScreen'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);

  // One-time local database cleanup
  // Clears broken book data from before the upload fix was deployed
  // Version string must be bumped if another cleanup is ever needed
  const CLEAN_SLATE_VERSION = '1.6.3';

  useEffect(() => {
    const runOneTimeCleanup = async () => {
      try {
        const cleaned = localStorage.getItem('apex_db_cleaned');
        if (cleaned === CLEAN_SLATE_VERSION) return; // already ran on this device

        // Clear all local tables that may contain broken data
        await db.books.clear();
        await db.highlights.clear();
        await db.bookmarks.clear();
        await db.reading_progress.clear();
        await db.sync_queue.clear();

        // Delete the legacy ApexBooksDB ghost database
        try {
          await new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase('ApexBooksDB');
            req.onsuccess = () => {
              console.log('[Apex] Legacy ApexBooksDB deleted');
              resolve();
            };
            req.onerror = () => reject(req.error);
            req.onblocked = () => {
              console.warn('[Apex] ApexBooksDB deletion blocked — will retry next load');
              resolve(); // Don't block the app
            };
          });
        } catch (err) {
          console.warn('[Apex] Could not delete ApexBooksDB:', err);
        }

        // Mark cleanup as done — this device will never run it again
        localStorage.setItem('apex_db_cleaned', CLEAN_SLATE_VERSION);
        console.log('[Apex] One-time local database cleanup complete');
      } catch (err) {
        console.error('[Apex] One-time cleanup failed:', err);
      }
    };

    runOneTimeCleanup();
  }, []);

  useEffect(() => {
    // Initialize theme
    useThemeStore.getState().initTheme();

    const checkAuth = async () => {
      // Initialize sync service (listeners, debounced functions)
      syncService.init();

      if (authService.isAuthenticated()) {
        try {
          // Verify token is still valid
          const user = await authService.me();
          // Store user in Zustand immediately
          useAuthStore.getState().setUser(user);
          setIsLoggedIn(true);

          // Run full data pull if online
          if (navigator.onLine) {
            setHydrating(true);
            try {
              await syncService.pullAllUserData();
              await syncService.pushSync();
            } catch (err) {
              console.error('Pull sync failed, continuing with local data:', err);
            }
            setHydrating(false);
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          authService.logout();
          useAuthStore.getState().clearUser();
          setIsLoggedIn(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async (userData) => {
    // Store user data from login/register response in Zustand
    if (userData?.user) {
      useAuthStore.getState().setUser(userData.user);
    }
    setIsLoggedIn(true);

    // Pull all data from Supabase for this user
    if (navigator.onLine) {
      setHydrating(true);
      try {
        await syncService.pullAllUserData();
        // Also migrate any pre-account local data
        await syncService.migrateLocalData();
      } catch (err) {
        console.error('Post-login sync failed:', err);
      }
      setHydrating(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    useAuthStore.getState().clearUser();
    setIsLoggedIn(false);
  };

  // Show loading screen during initial auth check OR during data hydration
  if (loading || hydrating) {
    return <ApexLoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            {/* Redirect any other logged-out route to landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            {/* When logged in, MainApp takes over root and handles all sub-routes */}
            <Route path="/*" element={<MainApp onLogout={handleLogout} />} />
          </>
        )}
      </Routes>
    </div>
  )
}

export default App