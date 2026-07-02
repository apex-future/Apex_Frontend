import './lib/gsap'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log('[Apex SW] Navigation strategy: NetworkFirst — stale deploy fix active');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <IconContext.Provider value={{ color: "currentColor", size: "1em", weight: "regular", mirrored: false }}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </IconContext.Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

// Register launch queue consumer for file handling (deep links)
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    if (launchParams.files && launchParams.files.length > 0) {
      window.location.href = '/import';
    }
  });
}

// Automatically reload when a new service worker takes control
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
