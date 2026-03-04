import React, { useRef, useState } from 'react'
import studySetup from "../../../assets/study-setup.jpg"
import { SquareArrowOutUpRight } from 'lucide-react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import eye from "../../../assets/eye.png"
import dart from "../../../assets/dart.png"
gsap.registerPlugin(ScrollTrigger);

function AboutUs() {
    let [isAboutOpen, setIsAboutOpen] = useState(false);
    let aboutParagraph = useRef(null)

    const openAbout = () => {
        aboutParagraph.current.classList.toggle("line-clamp-2");
        setIsAboutOpen((previousState) => !previousState)
    }

    useGSAP(() => {
        // About Us box from left
        gsap.fromTo(".about-us", 
            { x: -50, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 85%",
                },
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: "back.out(1.4)",
                immediateRender: false
            }
        );

        // Mission and Vision from right
        gsap.fromTo(".mission-box, .vision-box", 
            { x: 50, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 85%",
                },
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.4)",
                immediateRender: false
            }
        );
    }, []);

    return (
        <section className="info-section pt-16 md:pt-24 overflow-hidden" id='about' aria-labelledby="about-heading">
            <h2 id="about-heading" className="about-us-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4  text-center ">
                About Us
            </h2>
            <div className='info-wrapper grid grid-cols-1 md:grid-cols-2 gap-6 w-[90%] mx-auto  mt-8'>
                <div className="about-us relative rounded-2xl overflow-auto max-h-[400px]">
                    <img src={studySetup} alt="Dark themed study setup with computer and textbooks" className="h-full w-full object-cover" loading="lazy" />
                    <div className={`paragragh-layer absolute flex flex-col justify-center transition-all duration-300 bottom-0 ${isAboutOpen ? 'h-full pt-12' : "h-[35%]"}   p-3 
                        bg-black/50 backdrop-blur-md
                        [mask-image:linear-gradient(to_top,black_70%,transparent)] w-full`}>
                        <header className="about-us-header flex justify-between items-center mb-2">
                            <h3 className='font-display text-2xl text-white font-semibold py-2 leading-snug'>About Apex</h3>
                            <button 
                                onClick={openAbout} 
                                className='text-white cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors'
                                aria-label={isAboutOpen ? "Collapse About Section" : "Expand About Section"}
                                aria-expanded={isAboutOpen}
                            >
                                <SquareArrowOutUpRight size={24} />
                            </button>
                        </header>

                        <p className='text-white line-clamp-2 leading-relaxed' ref={aboutParagraph}>
                         Apex is your study space, refined. No distractions. No tab switching. Just focused learning — and everything you need to get there.
                        </p>
                    </div>
                </div>
                <div className='flex w-full gap-6 flex-col sm:flex-row md:flex-col'>
                    <article className="mission-box relative overflow-hidden rounded-2xl   sm:w-1/2 md:w-full md:h-1/2 h-[200px] flex flex-col gap-2 justify-center items-center bg-purple-400 p-8 group hover:-translate-y-2 transition-all duration-500" id='mission'>
                        <img src={dart} alt="" className="absolute -right-[8rem] top-1/2 -translate-y-1/2 object-contain opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none" aria-hidden="true" />
                        <h3 className='relative z-10 font-display text-2xl text-white font-bold text-center group-hover:scale-110 transition-transform leading-snug'>Our Mission</h3>
                        <p className="relative z-10 mission-paragraph text-white text-center font-medium leading-relaxed">We build focused learning experiences that eliminate distraction and make academic excellence accessible to every student.</p>
                    </article>
                    <article className="vision-box relative overflow-hidden rounded-2xl sm:w-1/2  md:w-full md:h-1/2 h-[200px] flex flex-col gap-2 justify-center items-center bg-purple-300 p-8 group hover:-translate-y-2 transition-all duration-500">
                        <img src={eye} alt="" className="absolute -right-[8rem] top-1/2  -translate-y-1/2 object-contain opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none" aria-hidden="true" />
                        <h3 className='relative z-10 font-display text-2xl text-black font-bold text-center group-hover:scale-110 transition-transform leading-snug'>Our Vision</h3>
                        <p className="relative z-10 vision-paragraph text-black text-center font-medium leading-relaxed">A world where every student has the tools to reach their full potential.</p>
                    </article>
                </div>
            </div>
        </section>
    )
}

export default AboutUs