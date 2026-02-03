import React from 'react'
import studySetup from "../../assets/study-setup.jpg"
function AboutUs() {
  return (
    <section className="info-section pt-12 relative ">
    
        <div className='info-wrapper grid grid-cols-1 md:grid-cols-2 gap-5 w-[90%] mx-auto'>
            <div className="about-us relative rounded-lg overflow-hidden max-h-[400px]">
                   <img src={studySetup} alt="dark theme study setup" srcSet="" className="h-full w-full object-cover" />
                   <div className="paragragh-layer absolute bottom-0 h-[30%] p-3 
                bg-black/50 backdrop-blur-md
                [mask-image:linear-gradient(to_top,black_70%,transparent)] w-full">
                    <h3 className='font-display text-xl text-white font-semibold'>About Apex</h3>
                    <p className='text-white'>Apex is an eReader</p>
                   </div>
            </div>
            <div className='flex w-full gap-5 flex-col sm:flex-row md:flex-col'>
                <div className="mission-box rounded-lg sm:w-1/2 md:w-full md:h-1/2 h-[200px] bg-purple-500 p-3">
                <h3 className='font-display text-xl text-white font-semibold '>Our Mission</h3></div>
                <div className="vision-box rounded-lg sm:w-1/2  md:w-full md:h-1/2 h-[200px] bg-purple-300 p-3">
                <h3 className='font-display text-xl text-black font-semibold '>Our Vision</h3>
                </div>
            </div>
        </div>
    </section>
  )
}

export default AboutUs