import React from 'react'
import NavBar from "./components/NavBar.jsx"
import HeroSection from "./components/HeroSection.jsx"
import Features from "./components/Features.jsx"
import AboutUs from './components/AboutUs'
import FAQ from "./components/FAQ.jsx"
import CTA from "./components/CTA.jsx"
import Footer from "./components/Footer.jsx"
import PWAPrompt from './components/PWAPrompt'

function LandingPage({ onLogin, deferredPrompt }) {
  return (
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
  )
}

export default LandingPage