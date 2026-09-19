import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from "../../assets/apex_dashbaord.png";

gsap.registerPlugin(ScrollTrigger);

function HeroSection() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "apple", duration: 1 } });
        
        // Text reveals
        tl.fromTo(".hero-tag", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 })
          .fromTo(".hero-headline", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
          .fromTo(".hero-subhead", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
          .fromTo(".hero-ctas", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.6")
          .fromTo(".hero-image", { opacity: 0, scale: 0.96, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "spring" }, "-=0.4");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className='w-full relative pt-28 md:pt-40 pb-16 md:pb-32 overflow-hidden' id='hero' aria-labelledby="hero-heading">
            {/* Subtle background ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-subtle rounded-full blur-[120px] opacity-50 pointer-events-none" aria-hidden="true" />
            
            <div className='max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center text-center'>
                
                {/* Tag */}
                <div className='hero-tag mb-8'>
                    <span className='inline-flex items-center gap-2 bg-surface-raised/50 text-text-secondary font-medium border border-border-default/10 py-1.5 px-4 rounded-full text-xs sm:text-sm tracking-wide'>
                        <span className='relative flex h-2 w-2' aria-hidden="true">
                            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75'></span>
                            <span className='relative inline-flex rounded-full h-2 w-2 bg-brand'></span>
                        </span>
                        Apex is currently in Beta
                    </span>
                </div>

                {/* Typography Focus */}
                <h1 id="hero-heading" className='hero-headline text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold text-text-primary leading-[1.05] tracking-tight font-display max-w-[900px]'>
                    Turn reading into <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-brand-gradient">real understanding.</span>
                </h1>
                
                <p className='hero-subhead mt-6 text-text-secondary text-lg md:text-xl max-w-[600px] leading-relaxed font-sans'>
                    Read, understand, practice, and track your progress — all in one focused learning environment.
                </p>

                {/* CTAs */}
                <div className="hero-ctas mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                    <Link to="/signup" className='aura-btn-primary px-8 py-4 w-full sm:w-auto text-center text-lg shadow-aura-sm'>
                        Start learning
                    </Link>
                    <a href="#problem-section" onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('problem-section')?.scrollIntoView({ behavior: 'smooth' });
                        }} className="aura-btn-secondary px-8 py-4 w-full sm:w-auto text-center text-lg">
                        See how Apex works
                    </a>
                </div>
            </div>

            {/* Product Visual - Asymmetric / Bleeding edge */}
            <div className="hero-image relative mt-20 md:mt-32 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 perspective-1000">
                <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-border-default/10 shadow-aura-lg bg-surface-card">
                    {/* Simulated Mac OS window top bar for UI realism */}
                    <div className="h-10 w-full bg-surface-raised flex items-center px-4 gap-2 border-b border-border-default/10">
                        <div className="w-3 h-3 rounded-full bg-text-placeholder/30"></div>
                        <div className="w-3 h-3 rounded-full bg-text-placeholder/30"></div>
                        <div className="w-3 h-3 rounded-full bg-text-placeholder/30"></div>
                    </div>
                    <img 
                        src={heroImg} 
                        alt="Apex Reader Interface showing highlights and AI companion" 
                        className="w-full object-cover object-top"
                        loading="eager" 
                    />
                    {/* Subtle inner overlay for blending */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-[inherit] pointer-events-none" />
                </div>
            </div>
            
        </section>
    );
}

export default HeroSection;