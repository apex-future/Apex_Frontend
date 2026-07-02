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
import Lenis from 'lenis'

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

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="light">
      {isLoading && (
        <div 
          className="fixed inset-0 z-[10000] transition-opacity duration-200"
          style={{ opacity: isFading ? 0 : 1 }}
        >
          <LandingLoadingScreen />
        </div>
      )}
      <div className='bg-bg-subtle overflow-x-hidden min-h-screen text-text-primary'>
        <NavBar />    
        <HeroSection />
        <Features />
        <AboutUs />
        <FAQ />
        <CTA onLogin={onLogin} />
        <Footer />
        <PWAPrompt deferredPrompt={deferredPrompt} />
      </div>
    </div>
  )
}   



export default LandingPage