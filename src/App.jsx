import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from 'react-router-dom'
import MainApp from './apex_frontend/main_app/MainApp'
import LandingPage from './apex_frontend/landing_page/LandingPage'
import SignupPage from './apex_frontend/landing_page/SignupPage'
import LoginPage from './apex_frontend/landing_page/LoginPage'
import authService from './services/authService'
import syncService from './services/syncService'

function App() {
  // Use authService to check initial authentication status
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Initialize sync service status listeners
      syncService.init();

      if (authService.isAuthenticated()) {
        try {
          // Verify token is still valid
          await authService.me();
          setIsLoggedIn(true);
          // Run initial sync
          syncService.onAppLoad();
        } catch (error) {
          console.error("Auth verification failed:", error);
          authService.logout();
          setIsLoggedIn(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
      </div>
    );
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