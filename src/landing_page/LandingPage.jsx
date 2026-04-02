import React, { useState, useEffect } from 'react'
import NavBar from "./components/NavBar.jsx"
import HeroSection from "./components/HeroSection.jsx"
import Features from "./components/Features.jsx"
import AboutUs from './components/AboutUs'
import FAQ from "./components/FAQ.jsx"
import CTA from "./components/CTA.jsx"
import Footer from "./components/Footer.jsx"
import PWAPrompt from './components/PWAPrompt'
import LandingLoadingScreen from './components/LandingLoadingScreen.jsx'

function LandingPage({ onLogin, deferredPrompt }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setIsFading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 200); // 200ms for fade-out transition
    };

    // If the page is already fully loaded by the time React mounts,
    // trigger the fade-out after a delay to ensure it's actually seen.
    if (document.readyState === 'complete') {
      const waitTimer = setTimeout(handleLoad, 100);
      return () => clearTimeout(waitTimer);
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <>
      {isLoading && (
        <div 
          className="fixed inset-0 z-[10000] transition-opacity duration-200"
          style={{ opacity: isFading ? 0 : 1 }}
        >
          <LandingLoadingScreen />
        </div>
      )}
      <div className='bg-bg-subtle overflow-x-hidden'>
        <NavBar />    
        <HeroSection />
        <Features />
        <AboutUs />
        <FAQ />
        <CTA onLogin={onLogin} />
        <Footer />
        <PWAPrompt deferredPrompt={deferredPrompt} />
      </div>
    </>
  )
}   



export default LandingPage