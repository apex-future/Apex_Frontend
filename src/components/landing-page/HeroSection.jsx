import React from 'react'
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
        gsap.fromTo(".hero-img-wrapper",
            {
                y: 100,
                opacity: 0,
                scale: 0.9
            },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.5,
                ease: "power3.out"
            }
        )
    }, [])

    return (
        <div className='w-full relative pt-20 sm:pt-32 overflow-hidden bg-bg-primary' id='hero'>
            {/* Immersive Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className='hero-section-content p-4 flex flex-col gap-10 sm:gap-16 relative z-[50]'>
                <div className='text-content max-w-[900px] mx-auto text-center'>
                    <h1 className='text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display text-text-primary tracking-tightest leading-[1.1] mb-6'>
                        Stop Studying In Tabs.<br />
                        Enter Your <span className='inline-flex items-center relative'>
                            <span className='apex italic px-3 inline-block bg-accent-primary/20 rounded-lg'> </span>
                            <span className='inline-block w-1.5 h-[1em] bg-accent-primary ml-1 animate-pulse shadow-[0_0_15px_rgba(139,92,246,0.6)]'></span>
                        </span>
                    </h1>
                    <p className='text-lg sm:text-xl md:text-2xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed'>
                        A focused learning workspace for students <br className="hidden sm:block" /> who refuse to be average.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full px-4">
                        <a href="#cta" className='group relative p-4 px-8 rounded-2xl w-full sm:w-auto min-w-[240px] bg-accent-primary text-white font-bold text-lg shadow-2xl shadow-accent-primary/30 transition-all hover:scale-105 hover:bg-accent-hover active:scale-95 text-center'>
                            Request Private Access
                            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a href="#features" className="p-4 px-8 rounded-2xl w-full sm:w-auto min-w-[200px] bg-white/80 backdrop-blur-md border-2 border-border-default text-text-primary font-bold text-lg shadow-xl transition-all hover:bg-white active:scale-95 text-center">
                            Learn More
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-border-default" />
                        <span className="text-[11px] sm:text-xs text-text-tertiary font-black uppercase tracking-[0.4em] opacity-80">
                            Private Beta • Founding Scholars
                        </span>
                        <div className="h-[1px] w-8 bg-border-default" />
                    </div>
                </div>

                <div className="img-content relative z-[50] max-w-6xl mx-auto px-4 sm:px-10 pb-10">
                    <div className="hero-img-wrapper relative group">
                        {/* Dynamic Backlight Glow */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-accent-primary/20 via-purple-500/20 to-accent-primary/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />

                        <div className="relative rounded-[2.5rem] p-2 bg-white/40 backdrop-blur-sm border border-white/40 shadow-2xl">
                            <img
                                src={heroImg}
                                alt="Apex dashboard preview"
                                className="rounded-[2rem] shadow-2xl group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroSection