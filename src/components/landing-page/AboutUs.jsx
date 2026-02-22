import React, { useRef, useState } from 'react'
import studySetup from "../../assets/study-setup.jpg"
import { SquareArrowOutUpRight } from 'lucide-react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import eye from "../../assets/eye.png"
import dart from "../../assets/dart.png"
gsap.registerPlugin(ScrollTrigger);

function AboutUs() {
    let [isAboutOpen, setIsAboutOpen] = useState(false);
    let aboutParagraph = useRef(null)

    const openAbout = () => {
        aboutParagraph.current.classList.toggle("line-clamp-2");
        setIsAboutOpen((previousState) => !previousState)
    }

    useGSAP(() => {
        gsap.from(".info-wrapper > div", {
            scrollTrigger: {
                trigger: "#about",
                start: "top 75%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out"
        });
    }, []);

    return (
        <section className="info-section pt-14 md:pt-20 " id='about'>
            <h2 className="about-us-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-display p-2 px-4  text-center ">
                About Us
            </h2>
            <div className='info-wrapper grid grid-cols-1 md:grid-cols-2 gap-5 w-[90%] mx-auto  mt-5'>
                <div className="about-us relative rounded-2xl overflow-auto max-h-[400px]">
                    <img src={studySetup} alt="dark theme study setup" className="h-full w-full object-cover" />
                    <div className={`paragragh-layer absolute flex flex-col justify-center transition-all duration-300 bottom-0 ${isAboutOpen ? 'h-full pt-12' : "h-[35%]"}   p-3 
                        bg-black/50 backdrop-blur-md
                        [mask-image:linear-gradient(to_top,black_70%,transparent)] w-full`}>
                        <header className="about-us-header flex justify-between items-center mb-1">
                            <h3 className='font-display text-2xl text-white font-semibold py-2 '>About Apex</h3>
                            <SquareArrowOutUpRight className='text-white cursor-pointer' onClick={openAbout} />
                        </header>

                        <p className='text-white line-clamp-2' ref={aboutParagraph}>
                            Apex is a focused learning workspace designed to eliminate context switching and help students enter deep study mode.
                            We're evolving into a complete learning hub with study scheduling, practice questions,
                            and collaboration tools — everything designed to help you study smarter and reach your apex.
                        </p>
                    </div>
                </div>
                <div className='flex w-full gap-5 flex-col sm:flex-row md:flex-col'>
                    <div className="mission-box relative overflow-hidden rounded-2xl   sm:w-1/2 md:w-full md:h-1/2 h-[200px] flex flex-col gap-2 justify-center items-center bg-purple-400 p-6 group hover:-translate-y-2 transition-all duration-500" id='mission'>
                        <img src={dart} alt="" className="absolute -right-[8rem] top-1/2 -translate-y-1/2 object-contain opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                        <h3 className='relative z-10 font-display text-2xl text-white font-bold text-center group-hover:scale-110 transition-transform'>Our Mission</h3>
                        <p className="relative z-10 mission-paragraph text-white text-center font-medium leading-relaxed">To empower students to learn deeply by eliminating distractions and making focused studying effortless.</p>
                    </div>
                    <div className="vision-box relative overflow-hidden rounded-2xl sm:w-1/2  md:w-full md:h-1/2 h-[200px] flex flex-col gap-2 justify-center items-center bg-purple-300 p-6 group hover:-translate-y-2 transition-all duration-500">
                        <img src={eye} alt="" className="absolute -right-[8rem] top-1/2  -translate-y-1/2 object-contain opacity-20 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                        <h3 className='relative z-10 font-display text-2xl text-black font-bold text-center group-hover:scale-110 transition-transform'>Our Vision</h3>
                        <p className="relative z-10 vision-paragraph text-black text-center font-medium leading-relaxed">Building the future of education: One platform where students read, practice, and reach their apex.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutUs