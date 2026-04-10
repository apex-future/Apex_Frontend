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
import useStudyStore from './main_app/store/studyStore'
import useThemeStore from './main_app/store/themeStore'
import useSettingsStore from './main_app/store/settingsStore'
import ApexLoadingScreen from './main_app/components/layout/ApexLoadingScreen'
import LandingLoadingScreen from './landing_page/components/LandingLoadingScreen'
import OnboardingPage from './landing_page/OnboardingPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Determine if we should show the landing-specific loader
  const isLandingPath = window.location.pathname === '/' || window.location.pathname === '';
  const showLandingLoader = !isLoggedIn && isLandingPath;

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      console.log('[Apex] beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // One-time local database cleanup
  // Clears broken book data from before the upload fix was deployed
  // Version string must be bumped if another cleanup is ever needed
  const CLEAN_SLATE_VERSION = '1.6.3';

  // useEffect(() => {
  //   const runOneTimeCleanup = async () => {
  //     try {
  //       const cleaned = localStorage.getItem('apex_db_cleaned');
  //       if (cleaned === CLEAN_SLATE_VERSION) return; // already ran on this device

  //       // Clear all local tables that may contain broken data
  //       await db.books.clear();
  //       await db.highlights.clear();
  //       await db.bookmarks.clear();
  //       await db.reading_progress.clear();
  //       await db.sync_queue.clear();
  //       await db.notes.clear();

  //       // Delete the legacy ApexBooksDB ghost database
  //       try {
  //         await new Promise((resolve, reject) => {
  //           const req = indexedDB.deleteDatabase('ApexBooksDB');
  //           req.onsuccess = () => {
  //             console.log('[Apex] Legacy ApexBooksDB deleted');
  //             resolve();
  //           };
  //           req.onerror = () => reject(req.error);
  //           req.onblocked = () => {
  //             console.warn('[Apex] ApexBooksDB deletion blocked — will retry next load');
  //             resolve(); // Don't block the app
  //           };
  //         });
  //       } catch (err) {
  //         console.warn('[Apex] Could not delete ApexBooksDB:', err);
  //       }

  //       // Mark cleanup as done — this device will never run it again
  //       localStorage.setItem('apex_db_cleaned', CLEAN_SLATE_VERSION);
  //       console.log('[Apex] One-time local database cleanup complete');
  //     } catch (err) {
  //       console.error('[Apex] One-time cleanup failed:', err);
  //     }
  //   };

  //   runOneTimeCleanup();
  // }, []);

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

          // Seed streak store from Supabase data on app load
          // seedFromSupabase only overwrites local if Supabase is more recent
          useStudyStore.getState().seedFromSupabase(user);
          console.log('[Apex Streak] Store seeded from Supabase');

          // Check if streak is broken (lastActiveDate is not today/yesterday)
          // Resets streakCount to 0 immediately so StreakBadge shows the correct value
          useStudyStore.getState().checkStreakIntegrity();

          // Seed settings store from Supabase
          if (user.settings) {
            useSettingsStore.getState().seedFromSupabase(user.settings);
            console.log('[Apex Settings] Store seeded from Supabase');

            // Apply theme from settings
            const savedTheme = user.settings.theme;
            if (savedTheme) {
              useThemeStore.getState().setTheme(savedTheme);
            }
          }

          // Check if existing user needs onboarding
          if (!user.user_type) {
            setNeedsOnboarding(true);
          }

          setIsLoggedIn(true);

          // Run full data pull if online
          if (navigator.onLine) {
            setHydrating(true);
            try {
              await syncService.pullAllUserData();
              await syncService.pushSync();
            } catch (err) {
              console.error('Pull sync failed, continuing with local data:', err.message);
            }
            setHydrating(false);
          }
        } catch (error) {
          console.error("Auth verification failed:", error.message);
          // Only log out if it's a 401 Unauthorized
          if (error.response?.status === 401) {
            authService.logout();
            useAuthStore.getState().clearUser();
            setIsLoggedIn(false);
          } else {
            // Network error or 500 — keep them logged in locally using cached data
            console.log("[Apex Auth] Network or server error during auth check, proceeding with local session.");
            
            // Re-use cached user if available
            const cachedUser = useAuthStore.getState().user;
            if (cachedUser && !cachedUser.user_type) {
              setNeedsOnboarding(true);
            }
            
            setIsLoggedIn(true);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Sync offline streak changes when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      const { streakCount, lastActiveDate } = useStudyStore.getState();
      if (lastActiveDate) {
        console.log('[Apex Streak] Back online — syncing streak to Supabase');
        useStudyStore.getState().syncStreakToSupabase();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Sync settings when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      useSettingsStore.getState().syncOnReconnect();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleLogin = async (userData) => {
    // Store user data from login/register response in Zustand
    if (userData?.user) {
      useAuthStore.getState().setUser(userData.user);

      // Check if user needs onboarding
      if (!userData.user?.user_type) {
        setNeedsOnboarding(true);
      }
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
        console.error('Post-login sync failed:', err.message);
      }
      setHydrating(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    useAuthStore.getState().clearUser();
    setIsLoggedIn(false);
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  // Show loading screen during initial auth check OR during data hydration
  if (loading || hydrating) {
    return showLandingLoader ? <LandingLoadingScreen /> : <ApexLoadingScreen />;
  }

  // Show onboarding for existing users who haven't personalized yet
  if (isLoggedIn && needsOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/" element={<LandingPage onLogin={handleLogin} deferredPrompt={deferredPrompt} />} />
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