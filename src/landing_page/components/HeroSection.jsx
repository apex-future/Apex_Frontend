import React from 'react'
import { TextCursor } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from "../../assets/e-book-dashboard.jpg"

gsap.registerPlugin(TextPlugin, ScrollTrigger);


function HeroSection() {
    useGSAP(() => {
        gsap.to(".apex", {
            text: "Apex",
            duration: 2
        })
    }, [])
    useGSAP(() => {
        // Text and buttons slide from left
        gsap.from(".hero-header, .CTA-buttons", {
            x: -100,
            opacity: 0,
            duration: 1.2,
            ease: "back.out(1.2)",
            stagger: 0.2
        });

        // Image slides from right
        gsap.fromTo(".hero-img-wrapper",
            {
                x: 100,
                opacity: 0
            },
            {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "back.out(1.2)"
            }
        )
    }, [])
    return (
        <section className=' w-full relative pt-24 md:pt-32 overflow-hidden' id='hero' aria-labelledby="hero-heading">

            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:16px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" aria-hidden="true"></div>

            <div className='hero-section-content p-4 gap-4 flex flex-col md:gap-6 relative z-[50]'>
                <div className='hero-header flex flex-col gap-2'>
                    <div className='tagline-wrapper flex justify-center'>
                        <span className='inline-flex items-center gap-2 bg-accent-primary/10 text-accent-primary font-semibold border border-accent-primary/20 py-1.5 px-4 rounded-full text-xs sm:text-sm tracking-wider backdrop-blur-sm'>
                            <span className='relative flex h-2 w-2' aria-hidden="true">
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75'></span>
                                <span className='relative inline-flex rounded-full h-2 w-2 bg-accent-primary'></span>
                            </span>
                            MVP Live
                        </span>
                    </div>
                    <div className='text-content max-w-[800px] mx-auto'>
                        <h1 id="hero-heading" className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight sm:leading-snug md:leading-snug text-center font-display'>Stop Studying In Tabs
                            <br></br>
                            Enter Your <span className='inline-flex items-center'>
                                <span className='apex italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30' aria-label="Apex"> </span>
                                <span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink' aria-hidden="true"></span>
                            </span>
                        </h1>
                        <p className='text-center p-4 text-text-primary sm:text-lg text-secondary md:text-xl max-w-2xl mx-auto leading-relaxed'>One space to read, understand, and retain — without the noise.</p>
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                    <div className="CTA-buttons flex flex-col mx-auto w-full sm:flex-row justify-center items-center gap-4">
                        <Link to="/signup" className='p-4 rounded-full w-full sm:w-1/2 max-w-[272px] border-2 px-6 text-center hover:bg-black hover:text-white text-white border-subtle bg-accent-primary font-medium md:text-lg cursor-pointer transition-all duration-200 '>Get Started</Link>
                        <a className=" p-4 px-6  w-full text-center rounded-full max-w-[272px] shadow-md md:text-lg sm:w-1/2 font-medium border-2   border-subtle bg-bg-elevated  hover:bg-black hover:text-white cursor-pointer transition-all duration-200 " href="#features" onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                        }}>Learn More</a>
                    </div>
                </div>
                <div className="img-content overflow-hidden relative z-[50] p-4">
                    <div className="hero-img-wrapper">
                        <img src={heroImg} alt="Apex dashboard showing E-book reader interface" className="hero-img z-[50] rounded-2xl mx-auto hover:rotate-2 duration-300 transition-all  shadow-lg" loading="eager" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection