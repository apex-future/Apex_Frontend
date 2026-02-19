import React from 'react'
import sparkle from "../../assets/star-project.png"
import WaitlistForm from './WaitlistForm'
function CTA() {
  return (
    <section className="mt-14 relative min-h-[500px] p-5 bg-black " id="cta">
      <div className="wrapper py-8 md:pt-10 relative z-[10] gap-5 grid grid-cols-1 md:grid-cols-2 jsutify-center items-center">
        <div className="flex flex-col gap-5 w-full p-3 ">
          <h3 className="CTA-heading text-white font-display text-xl sm:text-2xl p-2 leading-relaxed text-center">
            Studying that keeps you in your zone, not lost in tabs. <br />
            Request Private Access and be first to reach your <span className='inline-flex items-center'>
              <span className='  italic px-2 inline-block h-[1.3em] py-0 bg-accent-primary/50 '> Apex</span>
              <span className='inline-block sm:w-1 w-[0.1em] h-[1em] sm:h-[1.2em] bg-accent-primary ml-1 animate-blink'></span>
            </span>
          </h3>
          {/* <div className="button-wrapper flex justify-center">
                <button className="p-3 rounded-full font-medium   w-[350px] text-white bg-purple-500">Join The Waitlist</button>
            </div> */}
        </div>
        <WaitlistForm />

      </div>

      <img src={sparkle} className='absolute top-1/2 left-1/2  -translate-x-1/2 -translate-y-1/2' />

      {/* Ice Storm1$$ */}
    </section>
  )
}

export default CTA