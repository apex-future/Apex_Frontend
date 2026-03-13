import React, { useState, useEffect } from 'react'
import NavBar from "./components/NavBar.jsx"
import HeroSection from "./components/HeroSection.jsx"
import Features from "./components/Features.jsx"
import AboutUs from './components/AboutUs'
import FAQ from "./components/FAQ.jsx"
import CTA from "./components/CTA.jsx"
import Footer from "./components/Footer.jsx"
import PWAPrompt from './components/PWAPrompt'
import LandingLoadingScreen from '../main_app/components/layout/LandingLoadingScreen.jsx'

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

    if (document.readyState === 'complete') {
      handleLoad();
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