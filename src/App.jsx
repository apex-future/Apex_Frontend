import { useState, useEffect } from "react"
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import MainApp from './main_app/MainApp'
import LandingPage from './landing_page/LandingPage'
import SignupPage from './landing_page/SignupPage'
import LoginPage from './landing_page/LoginPage'
import ForgotPasswordPage from './landing_page/ForgotPasswordPage'
import ResetPasswordPage from './landing_page/ResetPasswordPage'
import PrivacyPolicy from './landing_page/PrivacyPolicy'
import VerifyEmailPage from './auth/VerifyEmailPage'
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
import useQuestStore from './main_app/store/useQuestStore';
import NotFoundPage from './main_app/pages/NotFoundPage';
import SharePage from './main_app/pages/SharePage';
import soundManager from './utils/soundManager';
import useOnlineStatus from './main_app/hooks/useOnlineStatus';

function App() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isOnline } = useOnlineStatus();
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Unverified check: requires data (online) to show/redirect to /verify-email
  const isUnverified = user && (user.is_verified === false || user.is_verified === null);
  const shouldRequireVerification = isOnline && isUnverified;

  // Determine if we should show the landing-specific loader
  const isLandingPath = window.location.pathname === '/' || window.location.pathname === '';
  const showLandingLoader = !isLoggedIn && isLandingPath;

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      window.deferredPrompt = e;
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
            // After seeding, immediately try to flush any pending offline XP
            useXpStore.getState().flushPendingXp();
          })
          .catch((err) => console.error('[Apex XP] Failed to seed XP profile:', err.message));

        useQuestStore.getState().resetIfNewDay();
        apiClient.get('/api/quests/today')
          .then((res) => {
            useQuestStore.getState().seedQuests(res.data);
            console.log('[App] Quest store seeded on load');
          })
          .catch((err) => {
            console.error('[App] Quest seed failed:', err);
          });

        if (user.settings) {
          useSettingsStore.getState().seedFromSupabase(user.settings);
          if (import.meta.env.DEV) console.log('[Apex Gear] Seed attempted from cloud');
          
          if ('Notification' in window && Notification.permission === 'granted' && user.settings.notifications?.readingReminders) {
            import('./main_app/services/notificationService').then(mod => {
              const authToken = localStorage.getItem('apex_token');
              mod.default.subscribeToPush(authToken);
            });
          }
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

              // Streak safety net — server reconciles streak from history
              apiClient.post('/api/auth/streak/reconcile')
                .then((res) => {
                  if (res.data?.corrected) {
                    useStudyStore.getState().seedFromSupabase(res.data);
                    console.log('[Apex Streak] Safety net corrected streak:', res.data.current_streak);
                  }
                })
                .catch(() => {}); // Non-blocking

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
          navigate('/', { replace: true });
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

      if (!userData.user?.user_type) {
        setNeedsOnboarding(true);
      }
    }
    setIsLoggedIn(true);

    if (isOnline && (userData?.user?.is_verified === false || userData?.user?.is_verified === null)) {
      navigate('/verify-email', { replace: true });
    } else {
      navigate('/', { replace: true });
    }

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
    navigate('/', { replace: true });
    setIsLoggedIn(false);
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  // When coming back online, re-verify status for unverified users and redirect to /verify-email
  useEffect(() => {
    const handleOnlineVerifyCheck = async () => {
      if (authService.isAuthenticated()) {
        try {
          const freshUser = await authService.me();
          if (freshUser) {
            useAuthStore.getState().setUser(freshUser);
            if (freshUser.is_verified === false || freshUser.is_verified === null) {
              navigate('/verify-email', { replace: true });
            }
          }
        } catch (err) {
          console.error('[Apex Auth] Online verify check failed:', err);
        }
      }
    };

    window.addEventListener('online', handleOnlineVerifyCheck);
    return () => window.removeEventListener('online', handleOnlineVerifyCheck);
  }, [navigate]);

  useEffect(() => {
    const handleFirstGesture = () => {
      soundManager.init();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture,
      { once: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture,
      { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  useEffect(() => {
    const { soundEnabled } = useXpStore.getState();
    soundManager.setEnabled(soundEnabled);
  }, []);

  // Show loading screen only during initial auth token check
  if (loading) {
    return showLandingLoader ? <LandingLoadingScreen /> : <ApexLoadingScreen />;
  }

  // Show onboarding for existing users who haven't personalized yet
  if (isLoggedIn && needsOnboarding && !shouldRequireVerification) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/share" element={<SharePage />} />
        {!isLoggedIn ? (
          <>
            <Route path="/" element={<LandingPage onLogin={handleLogin} deferredPrompt={deferredPrompt} />} />
            <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage onLogin={handleLogin} userEmail={user?.email} />} />

            {/* Redirect protected app routes to landing page when unauthenticated */}
            <Route path="/profile" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
            <Route path="/onboarding" element={<OnboardingPage onComplete={() => navigate('/')} />} />
            <Route path="/reader/*" element={<Navigate to="/" replace />} />
            <Route path="/spaces" element={<Navigate to="/" replace />} />
            <Route path="/space/*" element={<Navigate to="/" replace />} />
            <Route path="/book/*" element={<Navigate to="/" replace />} />
            <Route path="/dictionary" element={<Navigate to="/" replace />} />
            <Route path="/ai" element={<Navigate to="/" replace />} />
            <Route path="/tabs" element={<Navigate to="/" replace />} />
            <Route path="/import" element={<Navigate to="/" replace />} />
            <Route path="/streak" element={<Navigate to="/" replace />} />
            <Route path="/exams" element={<Navigate to="/" replace />} />
            <Route path="/analytics" element={<Navigate to="/" replace />} />
            <Route path="/notes/*" element={<Navigate to="/" replace />} />
            <Route path="/quest" element={<Navigate to="/" replace />} />
            <Route path="/discover" element={<Navigate to="/" replace />} />
            <Route path="/search" element={<Navigate to="/" replace />} />
            <Route path="/flashcards" element={<Navigate to="/" replace />} />

            {/* Show 404 page for any unauthenticated non-existent route */}
            <Route path="*" element={<NotFoundPage isLoggedIn={false} />} />
          </>
        ) : (
          <>
            {/* When logged in, handle verify-email and protected routes */}
            <Route path="/verify-email" element={
              (!isOnline && !window.location.search.includes('token=')) || (user?.is_verified && !window.location.search.includes('token=')) ? (
                <Navigate to="/" replace />
              ) : (
                <VerifyEmailPage onLogin={handleLogin} userEmail={user?.email} />
              )
            } />
            <Route path="/onboarding" element={
              shouldRequireVerification ? (
                <Navigate to="/verify-email" replace />
              ) : (
                <OnboardingPage onComplete={() => navigate('/')} />
              )
            } />
            <Route path="/*" element={
              shouldRequireVerification ? (
                <Navigate to="/verify-email" replace />
              ) : (
                <MainApp onLogout={handleLogout} />
              )
            } />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;