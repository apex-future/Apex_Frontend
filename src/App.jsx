import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from 'react-router-dom'
import MainApp from './main_app/MainApp'
import LandingPage from './landing_page/LandingPage'
import SignupPage from './landing_page/SignupPage'
import LoginPage from './landing_page/LoginPage'
import PrivacyPolicy from './landing_page/PrivacyPolicy'
import authService from './main_app/services/authService'
import syncService from './main_app/services/syncService'
import db from './main_app/db/apex.db'
import useAuthStore from './main_app/store/authStore'
import useStudyStore from './main_app/store/studyStore'
import useThemeStore from './main_app/store/themeStore'
import useSettingsStore from './main_app/store/settingsStore'
import useXpStore from './main_app/store/useXpStore'
import apiClient from './main_app/services/apiClient'
import ApexLoadingScreen from './main_app/components/layout/ApexLoadingScreen'
import LandingLoadingScreen from './landing_page/components/LandingLoadingScreen'
import OnboardingPage from './landing_page/OnboardingPage';
import AccessibilityPage from './landing_page/AccessibilityPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
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
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      // User has a token — render immediately from local Dexie data
      // Apply theme before render to prevent flash
      useThemeStore.getState().initTheme();

      setIsLoggedIn(true);
      setLoading(false);

      // Everything below runs in the background — nothing here blocks render
      try {
        const user = await authService.me();
        useAuthStore.getState().setUser(user);

        useStudyStore.getState().seedFromSupabase(user);
        console.log('[Apex Streak] Store seeded from Supabase');
        useStudyStore.getState().checkStreakIntegrity();

        // Seed XP store from server (non-blocking, runs in background)
        apiClient.get('/api/xp/profile')
          .then((xpProfile) => {
            useXpStore.getState().seedFromServer(xpProfile.data);
          })
          .catch((err) => console.error('[Apex XP] Failed to seed XP profile:', err.message));

        if (user.settings) {
          useSettingsStore.getState().seedFromSupabase(user.settings);
          if (import.meta.env.DEV) console.log('[Apex Gear] Seed attempted from cloud');
        }

        if (!user.user_type) {
          setNeedsOnboarding(true);
        }

        if (navigator.onLine) {
          console.log('[Apex] Sync running in background');
          syncService.pullAllUserData()
            .then(() => {
              // Re-seed streak from the fuller cloud data that just arrived
              const freshUser = useAuthStore.getState().user;
              if (freshUser) {
                useStudyStore.getState().seedFromSupabase(freshUser);
                useStudyStore.getState().checkStreakIntegrity();
                console.log('[Apex Streak] Re-seeded from full pull data');
              }
              return syncService.pushSync();
            })
            .catch((err) => console.error('Pull sync failed, continuing with local data:', err.message));
        }
      } catch (error) {
        console.error('Auth verification failed:', error.message);
        if (error.response?.status === 401) {
          // Token is dead — log out silently
          authService.logout();
          useAuthStore.getState().clearUser();
          setIsLoggedIn(false);
        } else {
          // Network error — stay logged in, local data is already rendering
          console.log('[Apex Auth] Network error during background auth check — continuing with local session');
          const cachedUser = useAuthStore.getState().user;
          if (cachedUser && !cachedUser.user_type) setNeedsOnboarding(true);
        }
      }
    };

    checkAuth();
  }, []);

  // Sync offline streak changes when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Apex Streak] Back online -- flushing pending streak sync');
      useStudyStore.getState().flushPendingStreakSync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Flush pending XP actions when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      useXpStore.getState().flushPendingXp();
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

    // Pull all data from Supabase for this user (non-blocking — app already rendered)
    if (navigator.onLine) {
      syncService.pullAllUserData()
        .then(() => syncService.migrateLocalData())
        .catch((err) => console.error('Post-login sync failed:', err.message));
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

  // Show loading screen only during initial auth token check
  if (loading) {
    return showLandingLoader ? <LandingLoadingScreen /> : <ApexLoadingScreen />;
  }

  // Show onboarding for existing users who haven't personalized yet
  if (isLoggedIn && needsOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
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
  );
}

export default App;