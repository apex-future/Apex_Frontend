import React from 'react'
import { Sparkle, PencilSimple, Book, YoutubeLogo } from '@phosphor-icons/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Features() {
    useGSAP(() => {
        gsap.fromTo(".feature-card-wrapper", 
            {
                x: (i) => i % 2 === 0 ? -50 : 50,
                opacity: 0,
            },
            {
                scrollTrigger: {
                    trigger: ".feature-list",
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.4)",
                clearProps: "all" // Clean up after animation to avoid conflicts with hover effects
            }
        );
    }, []);

    return (
        <section className='fetaures-section pt-16 md:pt-24' id='features' aria-labelledby="features-heading">
            <h2 id="features-heading" className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4 ml-4 lg:text-center leading-tight'>Why Serious Students Choose <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30' aria-label="Apex"> Apex </span></h2>

            <div className="feature-list grid sm:grid-cols-2 max-w-[1000px] gap-8 w-[90%] mx-auto mt-8">
                <div className="feature-card-wrapper h-full">
                    <article className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-6 rounded-2xl backdrop-blur-md min-h-[256px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>
                        <Sparkle className="inline-block size-12   text-purple-500  " aria-hidden="true" weight="fill" />

                        <div className='paragraph-overlay h-full flex flex-col gap-6 rounded-lg p-2 mt-4'>
                            <div className='font-display font-semibold text-3xl' aria-label="Availability">
                                24/7
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text- md:text-lg pb-2 leading-snug'>Instant AI Explanations:</h3>
                                    <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                                    Highlight any text and get clear explanations without
                                    opening a new tab.</p>
                            </div>

                        </div>

                    </article>
                </div>

                <div className="feature-card-wrapper h-full">
                    <article className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-6 rounded-2xl backdrop-blur-md min-h-[256px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>

                        <PencilSimple className="inline-block size-10  text-yellow-500 " aria-hidden="true" weight="fill" />
                        <div className='paragraph-overlay h-full flex flex-col gap-4 rounded-lg p-2'>
                            <div className='font-display font-semibold text-7xl' aria-label="Limitless">
                                ∞
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2 leading-snug'>Smart Highlighting & Notes:</h3>
                                    <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                                    Capture insights and build your personal study guide
                                    as you read.</p>
                            </div>

                        </div>

                    </article>
                </div>

                <div className="feature-card-wrapper h-full">
                    <article className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-6 rounded-2xl backdrop-blur-md min-h-[256px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>

                        <Book className="inline-block size-12  text-blue-500 " aria-hidden="true" weight="fill" />

                        <div className='paragraph-overlay h-full flex flex-col gap-6 rounded-lg p-2 mt-4'>
                            <div className='font-display font-semibold text-3xl' aria-label="Over five hundred thousand">
                                500K +
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2 leading-snug'>Built-in Dictionary:</h3>
                                    <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                                    Look up definitions instantly—no app switching, no
                                    breaking flow.</p>
                            </div>

                        </div>

                    </article>
                </div>

                <div className="feature-card-wrapper h-full">
                    <article className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-6 rounded-2xl backdrop-blur-md min-h-[256px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>


                        <YoutubeLogo className="inline-block size-12  text-red-500 " aria-hidden="true" weight="fill" />
                        <div className='paragraph-overlay h-full flex flex-col gap-6 rounded-lg p-2 mt-4'>
                            <div className='font-display font-semibold text-3xl' aria-label="Over ten thousand">
                                10K +
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2 leading-snug'>Curated Video Library:</h3>
                                    <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                                    Expert video explanations for every topic—delivered right where you are</p>
                            </div>

                        </div>

                    </article>
                </div>
            </div>
        </section>
    )
}

export default Features