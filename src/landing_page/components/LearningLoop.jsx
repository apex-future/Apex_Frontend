import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function LearningLoop() {
    const sectionRef = useRef(null);

    const steps = [
        "Read",
        "Ask",
        "Understand",
        "Practice",
        "Track",
        "Improve"
    ];

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 60%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".loop-header", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".loop-step", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "apple" }, "-=0.4")
          .fromTo(".loop-line", { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: "apple", transformOrigin: "left center" }, "-=0.6");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className='w-full py-24 md:py-32 relative bg-surface-base border-t border-border-default/5 overflow-hidden'>
            <div className='max-w-[1200px] mx-auto px-6'>
                
                <div className='loop-header text-center max-w-3xl mx-auto mb-20'>
                    <h2 className='text-3xl md:text-5xl font-display font-bold leading-tight text-text-primary'>
                        The complete learning loop.
                    </h2>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Continuous Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-border-default/10 -translate-y-1/2 z-0">
                        <div className="loop-line h-full bg-brand origin-left w-full"></div>
                    </div>

                    {/* Continuous Line (Mobile) */}
                    <div className="md:hidden absolute top-0 bottom-0 left-6 w-px bg-border-default/10 z-0">
                        <div className="loop-line w-full bg-brand origin-top h-full"></div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 relative z-10 pl-12 md:pl-0">
                        {steps.map((step, index) => (
                            <div key={index} className="loop-step flex flex-row md:flex-col items-center gap-4 group">
                                {/* Node */}
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300
                                    ${index === steps.length - 1 ? 'border-brand bg-brand text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'border-brand bg-surface-base text-brand'}`}>
                                    <div className={`w-2 h-2 rounded-full ${index === steps.length - 1 ? 'bg-white' : 'bg-brand/50'}`}></div>
                                </div>
                                
                                {/* Label */}
                                <span className={`font-display text-lg tracking-wide uppercase transition-colors duration-300
                                    ${index === steps.length - 1 ? 'text-text-primary font-bold' : 'text-text-tertiary font-semibold group-hover:text-text-primary'}`}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}

export default LearningLoop;
