import React, { Suspense, lazy } from 'react'
import NavBar from './NavBar'
import HeroSection from './HeroSection'

// Lazy load sections below the fold
const Features = lazy(() => import('./Features'))
const AboutUs = lazy(() => import('./AboutUs'))
const FAQ = lazy(() => import('./FAQ'))
const CTA = lazy(() => import('./CTA'))
const Footer = lazy(() => import('./Footer'))

// Loading Placeholder
const SectionLoader = () => (
  <div className="w-full h-32 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
  </div>
)

function LandingPage() {
  return (
    <div className='bg-bg-subtle overflow-hidden'>
        <NavBar />    
        <HeroSection />
        <Suspense fallback={<SectionLoader />}>
            <Features />
            <AboutUs />
            <FAQ />
            <CTA />
            <Footer />
        </Suspense>
    </div>
  )
}

export default LandingPage