import React from 'react'
import { Sparkles, Pen, Book, PlaySquare } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Features() {
    useGSAP(() => {
        gsap.from(".feature-card", {
            scrollTrigger: {
                trigger: ".feature-list",
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out"
        });
    }, []);

    return (
        <section className='fetaures-section pt-14 md:pt-20' id='features'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4 ml-3  lg:text-center'>Why Serious Students Choose <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> Apex </span></h2>

            <div className="feature-list grid sm:grid-cols-2 max-w-[1000px] gap-5 w-[90%] mx-auto mt-5">
                <div className="feature-card-wrapper h-full">
                    <div className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>
                        <Sparkles className="inline-block size-12   text-purple-500  " />

                        <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
                            <div className='font-display font-semibold text-3xl'>
                                24/7
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text- md:text-lg pb-2'>Instant AI Explainatons:</h3>
                                <p className="text-sm md:text-base text-text-secondary">
                                    Highlight any text and get clear explanations without
                                    opening a new tab.</p>
                            </div>

                        </div>

                    </div>
                </div>

                <div className="feature-card-wrapper h-full">
                    <div className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>

                        <Pen className="inline-block size-10  text-yellow-500 " />
                        <div className='paragraph-overlay h-full flex flex-col gap-2   rounded-lg  p-2 '>
                            <div className='font-display font-semibold text-7xl'>
                                ∞
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2'>Smart Highlighting & Notes:</h3>
                                <p className="text-sm md:text-base text-text-secondary">
                                    Capture insights and build your personal study guide
                                    as you read.</p>
                            </div>

                        </div>

                    </div>
                </div>

                <div className="feature-card-wrapper h-full">
                    <div className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>

                        <img src="" alt="" />
                        <Book className="inline-block size-12  text-blue-500 " />

                        <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
                            <div className='font-display font-semibold text-3xl'>
                                500K +
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2'>Built-in Dictionary:</h3>
                                <p className="text-sm md:text-base text-text-secondary">
                                    Look up definitions instantly—no app switching, no
                                    breaking flow.</p>
                            </div>

                        </div>

                    </div>
                </div>

                <div className="feature-card-wrapper h-full">
                    <div className='feature-card relative bg-gray-200 shadow-inner shadow-white border-2 p-5  rounded-lg backdrop-blur-md  min-h-[250px] h-full flex flex-col overflow-hidden hover:scale-105 transition-transform duration-300'>


                        <PlaySquare className="inline-block size-12  text-red-500 " />
                        <div className='paragraph-overlay h-full flex flex-col gap-5   rounded-lg  p-2 mt-3'>
                            <div className='font-display font-semibold text-3xl'>
                                10K +
                            </div>
                            <div className="feature-main-text">
                                <h3 className='font-medium text-black text-base md:text-lg pb-2'>Curated Video Library:</h3>
                                <p className="text-sm md:text-base text-text-secondary">
                                    Expert video explanations for every topic—delivered right where you are</p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}

export default Features