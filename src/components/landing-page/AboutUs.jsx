import React from 'react'
import studySetup from "../../assets/study-setup.jpg"
import { useRef,useState } from 'react'
import { ArrowBigUp,SquareArrowOutUpRight } from 'lucide-react'
function AboutUs() {
    let [isAboutOpen,setIsAboutOpen] = useState(false);
    let aboutParagraph = useRef(null)
    const openAbout = ()=>{
        // console.log(aboutParagraph.current)
        aboutParagraph.current.classList.toggle("line-clamp-3");
        setIsAboutOpen((previousState)=>{
            return !previousState //negate the previous state creates a toggle effect
        })
    }
  return (
    <section className="info-section pt-12 relative ">
    
        <div className='info-wrapper grid grid-cols-1 md:grid-cols-2 gap-5 w-[90%] mx-auto'>
            <div className="about-us relative rounded-lg overflow-hidden max-h-[400px]">
                   <img src={studySetup} alt="dark theme study setup" srcSet="" className="h-full w-full object-cover" />
                   <div className={`paragragh-layer absolute bottom-0 ${isAboutOpen?'h-full pt-12':"h-[35%]" }   p-3 
                bg-black/50 backdrop-blur-md
                [mask-image:linear-gradient(to_top,black_70%,transparent)] w-full`}>
                    <header className="about-us-header flex justify-between items-center mb-1">
                    <h3 className='font-display text-xl text-white font-semibold py-2 sm:text-2xl'>About Apex</h3>
                    <SquareArrowOutUpRight className='text-white' onClick={openAbout} />
                  
                    </header>
             
                    <p className='text-white line-clamp-3 text-sm sm:text-base' ref={aboutParagraph}>Apex is an AI-powered reading platform that keeps students in their flow. 
        Get instant explanations, definitions, and educational videos without losing focus. 
        We're evolving into a complete learning hub with study scheduling, practice questions, 
        and collaboration tools — everything designed to help you study smarter and reach your apex.
                </p>
                   </div>
            </div>
            <div className='flex w-full gap-5 flex-col sm:flex-row md:flex-col'>
                <div className="mission-box rounded-lg sm:w-1/2 md:w-full md:h-1/2 h-[200px] bg-purple-500 p-3">
                <h3 className='font-display text-xl text-white font-semibold sm:text-2xl '>Our Mission</h3></div>
                <div className="vision-box rounded-lg sm:w-1/2  md:w-full md:h-1/2 h-[200px] bg-purple-300 p-3">
                <h3 className='font-display text-xl text-black font-semibold sm:text-2xl '>Our Vision</h3>
                </div>
            </div>
        </div>
    </section>
  )
}

export default AboutUs