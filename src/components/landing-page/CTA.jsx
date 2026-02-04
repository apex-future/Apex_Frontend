import React from 'react'
import sparkle from "../../assets/star-project.png"
function CTA() {
  return (
    <section className="mt-14 relative p-5 bg-black ">
     
     <div className="flex flex-col gap-5 w-full p-3 absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2">
        <h3 className="CTA-heading text-white font-display text-xl text-center">
            Studying that keeps you in your zone, not lost in tabs. <br />
            Join the waitlist and be first to reach your <span className='inline-flex items-center'>
                                <span className='  italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/50 '> Apex</span>
                                <span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink'></span>
                        </span> 
        </h3>
        <div className="button-wrapper flex justify-center">
        <button className="p-3 rounded-full font-medium   w-[350px] text-white bg-purple-500">Join The Waitlist</button>
        </div>
   
        </div>
        <img src={sparkle} className='mx-auto '/>
    

    </section>
  )
}

export default CTA