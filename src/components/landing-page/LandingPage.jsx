import React from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import Features from './Features'
import AboutUs from './AboutUs'
import FAQ from "./FAQ.jsx"
function LandingPage() {
  return (
    <div className='bg-bg-subtle'>
        <NavBar />    
        <HeroSection />
        <Features />
        <AboutUs />
        <FAQ />
    </div>
  )
}

export default LandingPage