import React from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'
import Features from './Features'
function LandingPage() {
  return (
    <div className='bg-bg-subtle'>
        <NavBar />    
        <HeroSection />
        <Features />
    </div>
  )
}

export default LandingPage