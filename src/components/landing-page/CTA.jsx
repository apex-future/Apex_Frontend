import React from 'react'
import sparkle from "../../assets/star-project.png"
import WaitlistForm from './WaitlistForm'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function CTA() {
  useGSAP(() => {
    gsap.fromTo(".CTA-heading", 
      { x: -100, opacity: 0 },
      {
        scrollTrigger: {
          trigger: "#cta",
          start: "top 85%",
        },
        x: 0,
        opacity: 1,
        duration: 1,
        ease: "back.out(1.4)",
        immediateRender: false
      }
    );

    gsap.fromTo("#waitlist", 
      { x: 100, opacity: 0 },
      {
        scrollTrigger: {
          trigger: "#cta",
          start: "top 85%",
        },
        x: 0,
        opacity: 1,
        duration: 1,
        delay: 0.2,
        ease: "back.out(1.4)",
        immediateRender: false
      }
    );

    // Sparkle animation
    gsap.from(".lg\\:sparkle-animation", {
      scrollTrigger: {
        trigger: "#cta",
        start: "top center",
        scrub: true
      },
      rotation: 180,
      scale: 0.5,
      opacity: 0.5
    });

  }, []);

  return (
    <section className="mt-16 relative min-h-[512px] p-6 bg-black " id="cta" aria-labelledby="cta-heading">
      <div className="wrapper py-8 md:pt-12 relative z-[10] gap-8 grid grid-cols-1 md:grid-cols-2 justify-center items-center">
        <div className="flex flex-col gap-6 w-full p-4 ">
          <h2 id="cta-heading" className="CTA-heading text-white font-display text-2xl sm:text-3xl p-4 leading-loose text-center">
          The best students don't juggle tabs.  <br />
            They use <span className='italic px-2 inline-block  py-0 bg-accent-primary/50' aria-label="Apex">Apex</span>
          </h2>
        </div>
        <WaitlistForm />
      </div>

      <img src={sparkle} alt="" className='absolute  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none lg:sparkle-animation' aria-hidden="true" />
    </section>
  )
}

export default CTA