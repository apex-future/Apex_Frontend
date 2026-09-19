import React, { useState, useEffect } from 'react';
import NavBar from "./components/NavBar.jsx";
import HeroSection from "./components/HeroSection.jsx";
import TheProblem from './components/TheProblem.jsx';
import ReadingExperience from './components/ReadingExperience.jsx';
import CleoSection from './components/CleoSection.jsx';
import PracticeSection from './components/PracticeSection.jsx';
import ProgressSection from './components/ProgressSection.jsx';
import LearningLoop from './components/LearningLoop.jsx';
import AboutUs from './components/AboutUs.jsx';
import FAQ from "./components/FAQ.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";
import PWAPrompt from './components/PWAPrompt';
import LandingLoadingScreen from './components/LandingLoadingScreen.jsx';
import Lenis from 'lenis';

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
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="dark"> {/* Enforce dark mode for landing page to match new design */}
      {isLoading && (
        <div 
          className="fixed inset-0 z-[10000] transition-opacity duration-200"
          style={{ opacity: isFading ? 0 : 1 }}
        >
          <LandingLoadingScreen />
        </div>
      )}
      <div className='bg-surface-base overflow-x-hidden min-h-screen text-text-primary selection:bg-brand-light/30'>
        <NavBar />    
        <HeroSection />
        <TheProblem />
        <ReadingExperience />
        <CleoSection />
        <PracticeSection />
        <ProgressSection />
        <LearningLoop />
        <AboutUs />
        <FAQ />
        <CTA onLogin={onLogin} />
        <Footer />
        <PWAPrompt deferredPrompt={deferredPrompt} />
      </div>
    </div>
  );
}   

export default LandingPage;