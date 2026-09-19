import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ArrowRight } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger);

function TheProblem() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 70%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".problem-heading", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".tab-item", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "apple" }, "-=0.4")
          .fromTo(".tab-strike", { scaleX: 0 }, { scaleX: 1, duration: 0.4, stagger: 0.1, ease: "apple", transformOrigin: "left center" }, "-=0.2")
          .fromTo(".solution-text", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" }, "+=0.2");
    }, { scope: sectionRef });

    const tabs = [
        "Your Textbook PDF",
        "Google Search for concepts",
        "YouTube for explanations",
        "Dictionary app",
        "ChatGPT in another window",
        "A messy Notion page",
        "A random quiz website"
    ];

    return (
        <section ref={sectionRef} id="problem-section" className='w-full py-24 md:py-32 relative bg-surface-base border-t border-border-default/5'>
            <div className='max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center'>
                
                {/* Left side: The struggle */}
                <div className='flex flex-col gap-6'>
                    <h2 className='problem-heading text-3xl md:text-5xl font-display font-semibold leading-tight text-text-primary'>
                        Your textbook shouldn't be the beginning of a scavenger hunt.
                    </h2>
                    
                    <div className='mt-8 flex flex-col gap-4 font-sans text-lg text-text-secondary'>
                        {tabs.map((tab, idx) => (
                            <div key={idx} className='tab-item relative inline-flex items-center gap-3 w-fit'>
                                <X size={20} className="text-text-placeholder" />
                                <span>{tab}</span>
                                <div className='tab-strike absolute left-8 right-[-10px] top-1/2 h-[2px] bg-text-tertiary/60 origin-left'></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side: The solution */}
                <div className='solution-text flex flex-col justify-center h-full'>
                    <div className='aura-card p-8 md:p-12 relative overflow-hidden group'>
                        {/* Decorative background blur */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/10 rounded-full blur-3xl group-hover:bg-brand/20 transition-colors duration-700 pointer-events-none" />
                        
                        <h3 className='text-2xl md:text-3xl font-display font-semibold mb-6 text-text-primary'>
                            Apex brings the learning loop together.
                        </h3>
                        <p className='text-text-secondary text-lg leading-relaxed mb-8'>
                            Stop switching contexts. When everything you need is in one place, reading turns into actual retention.
                        </p>
                        
                        <div className="flex items-center gap-4 text-brand font-medium">
                            <span>One focused workspace</span>
                            <ArrowRight size={20} weight="bold" />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

export default TheProblem;
