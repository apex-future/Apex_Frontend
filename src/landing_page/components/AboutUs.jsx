import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import studySetup from "../../assets/study-setup.jpg";

gsap.registerPlugin(ScrollTrigger);

function AboutUs() {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(".about-heading", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "apple" })
          .fromTo(".about-text", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "apple" }, "-=0.6")
          .fromTo(".about-image", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.2, ease: "apple" }, "-=0.4");
    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} id="about" className='w-full py-24 md:py-32 relative bg-surface-base border-t border-border-default/5'>
            <div className='max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center'>
                
                {/* Left: Philosophy */}
                <div className='flex flex-col gap-8'>
                    <div className="aura-label mb-2">Our Philosophy</div>
                    <h2 className='about-heading text-4xl md:text-5xl font-display font-bold leading-tight text-text-primary'>
                        Built for focus.<br/>Designed for understanding.
                    </h2>
                    
                    <div className='flex flex-col gap-6 text-lg text-text-secondary leading-relaxed font-sans'>
                        <p className="about-text">
                            Apex was born from a simple observation: modern studying is fundamentally broken. Between dozens of open tabs, endless distractions, and generic AI tools that don't understand your context, actual learning gets lost in the noise.
                        </p>
                        <p className="about-text">
                            We believe that technology should bring you closer to the material, not pull you away from it. Our mission is to build focused learning experiences that eliminate distraction and make academic excellence accessible to every serious student.
                        </p>
                    </div>
                </div>

                {/* Right: Visual */}
                <div className='about-image relative w-full h-full min-h-[400px] lg:min-h-[600px] rounded-[2rem] overflow-hidden shadow-aura-lg'>
                    <img src={studySetup} alt="A clean, focused study setup" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    {/* Subtle gradient overlay to ensure it blends nicely */}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-base/80 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]"></div>
                </div>

            </div>
        </section>
    );
}

export default AboutUs;