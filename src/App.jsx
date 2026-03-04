import { useState } from "react"
import { Routes, Route, Navigate } from 'react-router-dom'
import MainApp from './apex_frontend/main_app/MainApp'
import LandingPage from './apex_frontend/landing_page/LandingPage'
import SignupPage from './apex_frontend/landing_page/SignupPage'

function App() {
  // form a placeholder backend signing functionality
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <div className="min-h-screen">
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage onLogin={() => setIsLoggedIn(true)} />} />
            {/* Redirect any other logged-out route to landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            {/* When logged in, MainApp takes over root and handles all sub-routes */}
            <Route path="/*" element={<MainApp />} />
          </>
        )}
      </Routes>
    </div>
  )
}

export default App