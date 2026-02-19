import React from 'react'
import { Brain, PenLine, Zap, Video } from 'lucide-react';
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
            <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4 ml-3 lg:text-center text-text-primary'>
                Why Serious Students Choose <span className='italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/30 '> Apex </span>
            </h2>

            <div className="feature-list grid sm:grid-cols-2 max-w-[1000px] gap-6 w-[90%] mx-auto mt-8">
                {/* Feature 1: AI Explanations */}
                <div className='feature-card relative bg-white shadow-xl border border-border-default/50 p-6 sm:p-8 rounded-3xl backdrop-blur-md min-h-[200px] flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500'>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <Brain size={24} />
                        </div>
                        <h3 className='font-display font-bold text-2xl text-text-primary'>Instant Clarity</h3>
                    </div>
                    <p className="text-xl text-text-secondary leading-tight font-medium">
                        Highlight text. Get AI breakdowns. <br />
                        Understand tough concepts in seconds.
                    </p>
                </div>

                {/* Feature 2: Active Reading */}
                <div className='feature-card relative bg-white shadow-xl border border-border-default/50 p-6 sm:p-8 rounded-3xl backdrop-blur-md min-h-[200px] flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500'>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <PenLine size={24} />
                        </div>
                        <h3 className='font-display font-bold text-2xl text-text-primary'>Active Knowledge</h3>
                    </div>
                    <p className="text-xl text-text-secondary leading-tight font-medium">
                        Capture insights. Build notes. <br />
                        Turn reading into a structured study guide.
                    </p>
                </div>

                {/* Feature 3: Integrated Tools */}
                <div className='feature-card relative bg-white shadow-xl border border-border-default/50 p-6 sm:p-8 rounded-3xl backdrop-blur-md min-h-[200px] flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500'>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-yellow-100 rounded-2xl text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white transition-colors duration-300">
                            <Zap size={24} />
                        </div>
                        <h3 className='font-display font-bold text-2xl text-text-primary'>Infinite Focus</h3>
                    </div>
                    <p className="text-xl text-text-secondary leading-tight font-medium">
                        Built-in dictionary and tools. <br />
                        No more tab jumping or broken focus.
                    </p>
                </div>

                {/* Feature 4: Visual Mastery */}
                <div className='feature-card relative bg-white shadow-xl border border-border-default/50 p-6 sm:p-8 rounded-3xl backdrop-blur-md min-h-[200px] flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500'>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                            <Video size={24} />
                        </div>
                        <h3 className='font-display font-bold text-2xl text-text-primary'>Visual Mastery</h3>
                    </div>
                    <p className="text-xl text-text-secondary leading-tight font-medium">
                        Expert video tutorials. <br />
                        Connected directly to what you're reading.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default Features