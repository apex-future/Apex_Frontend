import React from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import Features from './Features'
import AboutUs from './AboutUs'
function LandingPage() {
  return (
    <div className='bg-bg-subtle'>
        <NavBar />    
        <HeroSection />
        <Features />
        <AboutUs />
    </div>
  )
}

export default LandingPage